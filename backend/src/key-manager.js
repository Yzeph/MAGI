/**
 * 密钥管理模块
 * 安全地管理API密钥，支持多个来源和动态加载
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 密钥管理器类
 * 支持从环境变量、文件和密钥管理服务加载密钥
 */
export class KeyManager {
  constructor() {
    this.keys = {};
    this.keyRotationLog = [];
  }

  /**
   * 从环境变量加载密钥
   */
  loadFromEnv() {
    const envKeys = {
      anthropic: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      openaiCompat: process.env.OPENAI_COMPAT_API_KEY
    };

    Object.entries(envKeys).forEach(([name, value]) => {
      if (value && value.trim()) {
        this.setKey(name, value, 'environment');
      }
    });

    return Object.keys(this.keys).length > 0;
  }

  /**
   * 从密钥文件加载（用于本地开发）
   */
  loadFromFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

      lines.forEach(line => {
        const [name, key] = line.split('=').map(s => s.trim());
        if (name && key) {
          this.setKey(name, key, 'file');
        }
      });

      console.log(`✅ 从文件加载了 ${Object.keys(this.keys).length} 个密钥`);
      return true;
    } catch (error) {
      console.warn(`⚠️  密钥文件加载失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 设置密钥
   */
  setKey(name, value, source = 'manual') {
    if (!value || !value.trim()) {
      console.warn(`⚠️  密钥值为空: ${name}`);
      return false;
    }

    this.keys[name] = {
      value: value.trim(),
      source,
      setAt: new Date(),
      lastUsed: null
    };

    this.logRotation('set', name, source);
    return true;
  }

  /**
   * 获取密钥
   */
  getKey(name) {
    if (!this.keys[name]) {
      return null;
    }

    const keyData = this.keys[name];
    keyData.lastUsed = new Date();
    return keyData.value;
  }

  /**
   * 获取密钥信息（不含实际密钥值）
   */
  getKeyInfo(name) {
    if (!this.keys[name]) {
      return null;
    }

    const { value, ...info } = this.keys[name];
    return {
      ...info,
      masked: this.maskKey(value)
    };
  }

  /**
   * 掩盖密钥（显示前3个和后3个字符）
   */
  maskKey(key) {
    if (key.length <= 6) {
      return '*'.repeat(key.length);
    }
    return key.substring(0, 3) + '*'.repeat(key.length - 6) + key.substring(key.length - 3);
  }

  /**
   * 旋转密钥（更换为新密钥）
   */
  rotateKey(name, newValue) {
    const oldKey = this.keys[name];
    this.setKey(name, newValue, 'rotated');
    this.logRotation('rotate', name, 'manual', oldKey?.value);
    return true;
  }

  /**
   * 记录密钥操作日志
   */
  logRotation(operation, name, source, oldValue = null) {
    this.keyRotationLog.push({
      timestamp: new Date(),
      operation,
      keyName: name,
      source,
      oldValueMasked: oldValue ? this.maskKey(oldValue) : null
    });
  }

  /**
   * 获取可用的密钥列表（不含值）
   */
  listAvailableKeys() {
    return Object.entries(this.keys).map(([name, data]) => ({
      name,
      source: data.source,
      setAt: data.setAt,
      lastUsed: data.lastUsed,
      masked: this.maskKey(data.value)
    }));
  }

  /**
   * 验证密钥是否存在
   */
  hasKey(name) {
    return name in this.keys && this.keys[name].value;
  }

  /**
   * 清除密钥（谨慎使用）
   */
  removeKey(name) {
    if (this.keys[name]) {
      delete this.keys[name];
      this.logRotation('remove', name, 'manual');
      return true;
    }
    return false;
  }

  /**
   * 获取密钥轮转日志
   */
  getRotationLog(limit = 50) {
    return this.keyRotationLog.slice(-limit);
  }

  /**
   * 验证密钥格式（基本检查）
   */
  validateKeyFormat(name, value) {
    const validators = {
      anthropic: (v) => v.startsWith('sk-ant-'),
      openai: (v) => v.startsWith('sk-'),
      openaiCompat: (v) => v.length > 10
    };

    const validator = validators[name];
    if (validator && !validator(value)) {
      console.warn(`⚠️  密钥格式可能不正确: ${name}`);
      return false;
    }

    return true;
  }

  /**
   * 生成使用报告
   */
  getUsageReport() {
    const report = {};

    Object.entries(this.keys).forEach(([name, data]) => {
      report[name] = {
        source: data.source,
        setAt: data.setAt,
        lastUsed: data.lastUsed,
        daysSinceSet: Math.floor((Date.now() - data.setAt.getTime()) / (1000 * 60 * 60 * 24)),
        daysSinceLastUsed: data.lastUsed
          ? Math.floor((Date.now() - data.lastUsed.getTime()) / (1000 * 60 * 60 * 24))
          : 'never',
        masked: this.maskKey(data.value)
      };
    });

    return report;
  }
}

// 创建全局密钥管理器实例
export const keyManager = new KeyManager();

/**
 * 初始化密钥管理
 */
export function initializeKeyManager() {
  console.log('\n🔐 初始化密钥管理系统...');

  // 尝试从环境变量加载
  if (keyManager.loadFromEnv()) {
    console.log('✅ 已从环境变量加载密钥');
  }

  // 尝试从本地密钥文件加载（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    const secretsFile = path.join(__dirname, '.secrets');
    if (keyManager.loadFromFile(secretsFile)) {
      console.log('✅ 已从本地密钥文件加载');
    }
  }

  // 显示可用的密钥
  const availableKeys = keyManager.listAvailableKeys();
  if (availableKeys.length > 0) {
    console.log('\n📋 可用的API密钥:');
    availableKeys.forEach(key => {
      console.log(`   • ${key.name}: ${key.masked} (来源: ${key.source})`);
    });
  } else {
    console.warn('\n⚠️  未加载任何API密钥！');
    console.log('   请设置以下环境变量之一:');
    console.log('   - ANTHROPIC_API_KEY (用于Claude)');
    console.log('   - OPENAI_API_KEY (用于OpenAI)');
    console.log('   - OPENAI_COMPAT_API_KEY (用于兼容OpenAI的服务)');
  }

  console.log();
  return availableKeys.length > 0;
}

export default keyManager;
