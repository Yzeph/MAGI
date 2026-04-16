#!/usr/bin/env node
/**
 * 直接测试 SiliconFlow Chat API
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载环境变量
const secretsPath = path.join(__dirname, '.secrets');
if (fs.existsSync(secretsPath)) {
  dotenv.config({ path: secretsPath });
}
dotenv.config();

const apiKey = process.env.SILICONFLOW_API_KEY;
const model = process.env.SILICONFLOW_MODEL || 'Pro/deepseek-ai/DeepSeek-V3.2';
const baseUrl = 'https://api.siliconflow.cn/v1';

console.log('\n🧪 SiliconFlow Chat API 直接测试\n');
console.log('配置:');
console.log(`  API Key: ${apiKey ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`  模型: ${model}`);
console.log(`  BaseURL: ${baseUrl}\n`);

// 测试数据
const testPayload = {
  model: model,
  messages: [
    {
      role: 'user',
      content: 'Hello, who are you?'
    }
  ],
  max_tokens: 512,
  temperature: 0.7,
  stream: false  // 先用非流式测试
};

console.log('📤 发送请求...\n');
console.log('请求体:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\n---\n');

// 发送请求
try {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testPayload)
  });

  console.log(`📥 响应状态: ${response.status}\n`);

  if (response.status === 200) {
    const data = await response.json();
    console.log('✅ 成功!\n');
    console.log('响应:');
    console.log(JSON.stringify(data, null, 2));
  } else if (response.status === 403) {
    console.log('❌ 403 Forbidden\n');
    const text = await response.text();
    console.log('错误信息:', text);

    console.log('\n\n可能的原因:');
    console.log('1. API密钥无权调用此接口');
    console.log('2. 模型名称错误或不支持该模型');
    console.log('3. 账户权限不足');
    console.log('4. API请求格式不正确');

    console.log('\n\n💡 解决方案:');
    console.log('1. 验证API密钥是否正确');
    console.log('2. 检查模型名称是否有效');
    console.log('3. 登录 cloud.siliconflow.cn 检查账户权限');
    console.log('4. 尝试简化请求体（移除system参数等）');
  } else {
    const text = await response.text();
    console.log(`❌ 错误 ${response.status}\n`);
    console.log('响应:', text);
  }
} catch (error) {
  console.log('❌ 请求失败:', error.message);
}
