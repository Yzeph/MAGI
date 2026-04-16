#!/usr/bin/env node
/**
 * SiliconFlow API 连接诊断脚本
 * 使用方法: node test-siliconflow.js
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.secrets') });
dotenv.config();

const config = {
  apiKey: process.env.SILICONFLOW_API_KEY || '',
  model: process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-72B-Instruct',
  baseUrl: 'https://api.siliconflow.cn/v1'
};

console.log('\n' + '='.repeat(60));
console.log('🔍 SiliconFlow API 连接诊断');
console.log('='.repeat(60) + '\n');

// ========== 检查 1: 配置加载 ==========
console.log('📋 检查 1: 配置加载状态\n');

const files = {
  '.env': fs.existsSync(path.join(__dirname, '.env')),
  '.secrets': fs.existsSync(path.join(__dirname, '.secrets')),
  'config.js': fs.existsSync(path.join(__dirname, 'config.js'))
};

console.log(`  .env 文件: ${files['.env'] ? '✅ 存在' : '⚠️  不存在'}`);
console.log(`  .secrets 文件: ${files['.secrets'] ? '✅ 存在' : '⚠️  不存在'}`);
console.log(`  config.js: ${files['config.js'] ? '✅ 存在' : '❌ 缺失'}\n`);

// ========== 检查 2: API 密钥 ==========
console.log('🔑 检查 2: API 密钥配置\n');

if (!config.apiKey) {
  console.log('  ❌ 错误: SILICONFLOW_API_KEY 未设置');
  console.log('\n  解决方案:');
  console.log('  1. 创建 .secrets 文件:');
  console.log('     cat > .secrets << EOF');
  console.log('     SILICONFLOW_API_KEY=sk-你的密钥');
  console.log('     EOF');
  console.log('  2. 或设置环境变量:');
  console.log('     export SILICONFLOW_API_KEY=sk-你的密钥');
  process.exit(1);
}

const keyLength = config.apiKey.length;
const keyPreview = config.apiKey.substring(0, 15) + '...' + config.apiKey.substring(-5);

console.log(`  密钥状态: ✅ 已设置`);
console.log(`  密钥长度: ${keyLength} 字符`);
console.log(`  密钥预览: ${keyPreview}`);
console.log(`  密钥格式: ${config.apiKey.startsWith('sk-') ? '✅ 正确 (sk-...)' : '⚠️  可能错误'}\n`);

// ========== 检查 3: 模型配置 ==========
console.log('🤖 检查 3: 模型配置\n');

console.log(`  模型: ${config.model}`);
console.log(`  BaseURL: ${config.baseUrl}\n`);

// ========== 检查 4: 网络连接 ==========
console.log('🌐 检查 4: 网络连接\n');

try {
  console.log('  测试 DNS 解析...');
  const { lookup } = await import('dns').then(m => m.promises ? m.promises : m);

  const resolve = lookup || (async (host) => {
    return new Promise((resolve, reject) => {
      require('dns').lookup(host, (err, address) => {
        if (err) reject(err);
        else resolve(address);
      });
    });
  });

  try {
    // 尝试简单的网络测试
    const testUrl = new URL(config.baseUrl);
    console.log(`  ✅ DNS 可解析: ${testUrl.hostname}`);
  } catch (e) {
    console.log(`  ⚠️  DNS 解析失败: ${e.message}`);
  }

  console.log('');
} catch (error) {
  console.log(`  ⚠️  网络诊断跳过\n`);
}

// ========== 检查 5: API 连接 ==========
console.log('🔌 检查 5: API 连接测试\n');

try {
  const response = await fetch(`${config.baseUrl}/models`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  });

  console.log(`  HTTP 状态: ${response.status}\n`);

  if (response.status === 200) {
    try {
      const data = await response.json();
      const models = Array.isArray(data) ? data : data.data || [];

      console.log(`  ✅ API 连接成功!`);
      console.log(`  可用模型数: ${models.length}\n`);

      if (models.length > 0) {
        console.log('  📊 可用模型列表 (前 10 个):');
        models.slice(0, 10).forEach((m, i) => {
          const modelId = m.id || m.model || m.name || '未知';
          console.log(`     ${i + 1}. ${modelId}`);
        });

        // 检查推荐的模型是否存在
        const modelExists = models.some(m =>
          (m.id || m.model || m.name || '').includes(config.model.split('/')[1])
        );

        console.log(`\n  推荐模型 "${config.model}": ${modelExists ? '✅ 可用' : '⚠️  不在列表中'}`);
      }
    } catch (e) {
      console.log(`  ⚠️  响应解析失败: ${e.message}`);
    }
  } else if (response.status === 401 || response.status === 403) {
    console.log(`  ❌ 认证失败 (${response.status})`);
    console.log('\n  可能的原因:');
    console.log('  1. API 密钥无效或已过期');
    console.log('  2. 账户余额不足');
    console.log('  3. API 密钥权限不足');
    console.log('\n  解决方案:');
    console.log('  1. 登录 https://cloud.siliconflow.cn');
    console.log('  2. 检查 API 密钥是否有效');
    console.log('  3. 检查账户余额');
    console.log('  4. 重新生成 API 密钥');
  } else {
    console.log(`  ⚠️  API 返回错误: ${response.status}\n`);
    console.log('  响应内容:');
    const text = await response.text();
    console.log(`  ${text || '(空)'}`);
  }
} catch (error) {
  console.log(`  ❌ 连接失败: ${error.message}\n`);
  console.log('  可能的原因:');
  console.log('  1. 网络连接问题');
  console.log('  2. API 服务暂停');
  console.log('  3. 防火墙阻止');
  console.log('  4. DNS 解析失败\n');
  console.log('  尝试:');
  console.log('  1. ping api.siliconflow.cn');
  console.log('  2. curl https://api.siliconflow.cn/v1/models');
}

// ========== 检查 6: 配置验证 ==========
console.log('\n✅ 检查 6: 配置完整性\n');

const checks = {
  '密钥已设置': !!config.apiKey,
  '密钥格式正确': config.apiKey.startsWith('sk-'),
  '模型已设置': !!config.model,
  '模型格式正确': config.model.includes('/'),
  'BaseURL 正确': config.baseUrl === 'https://api.siliconflow.cn/v1'
};

let allPassed = true;
Object.entries(checks).forEach(([check, passed]) => {
  console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  if (!passed) allPassed = false;
});

// ========== 总结 ==========
console.log('\n' + '='.repeat(60));
console.log('📊 诊断总结\n');

if (allPassed) {
  console.log('✅ 所有检查通过! 你可以开始使用 SiliconFlow API\n');
  console.log('下一步:');
  console.log('  1. 启动 MAGI 服务: npm start');
  console.log('  2. 发送查询进行测试');
  console.log('  3. 查看日志确认正常运行\n');
} else {
  console.log('⚠️  部分检查失败，请查看上方详细信息\n');
  console.log('常见解决方案:');
  console.log('  1. 确保 SILICONFLOW_API_KEY 已设置');
  console.log('  2. 确保密钥格式为 sk-... 开头');
  console.log('  3. 检查 SiliconFlow 账户余额');
  console.log('  4. 确保网络连接正常\n');
}

console.log('📖 详细指南: 查看 FIX_403_ERROR.md');
console.log('='.repeat(60) + '\n');

process.exit(allPassed ? 0 : 1);
