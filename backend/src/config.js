import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载环境变量（优先级：.secrets > .env > 系统环境变量）
// 首先加载 .secrets（如果存在）
const secretsPath = path.join(__dirname, '.secrets');
if (fs.existsSync(secretsPath)) {
  dotenv.config({ path: secretsPath });
}

// 然后加载 .env（不覆盖已加载的值）
dotenv.config();

export const config = {
  // 服务器配置
  port: process.env.PORT || 3000,
  wsPort: process.env.WS_PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // AI 模型配置
  ai: {
    // 选择模型提供商: 'anthropic', 'openai', 'openai-compatible', 'siliconflow'
    provider: process.env.AI_PROVIDER || 'siliconflow',

    // Anthropic Claude 配置
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-6'
    },

    // OpenAI 配置
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    },

    // SiliconFlow 配置（推荐用于国内）
    siliconflow: {
      apiKey: process.env.SILICONFLOW_API_KEY || '',
      model: process.env.SILICONFLOW_MODEL || 'Pro/deepseek-ai/DeepSeek-V3.2',
      baseUrl: 'https://api.siliconflow.cn/v1',
      timeout: parseInt(process.env.SILICONFLOW_TIMEOUT || '60000')
    },

    // OpenAI 兼容格式配置（LM Studio, Ollama, LocalAI 等）
    openaiCompatible: {
      apiKey: process.env.OPENAI_COMPAT_API_KEY || 'not-needed',
      model: process.env.OPENAI_COMPAT_MODEL || 'local-model',
      baseUrl: process.env.OPENAI_COMPAT_BASE_URL || 'http://localhost:8000/v1',
      timeout: parseInt(process.env.OPENAI_COMPAT_TIMEOUT || '60000')
    },

    // 通用模型配置
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048'),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    topP: parseFloat(process.env.AI_TOP_P || '1.0'),
    enableThinking: process.env.AI_ENABLE_THINKING !== 'false' // 仅Anthropic支持
  },

  // 数据库配置
  dbPath: process.env.DB_PATH || './magi.db',

  // 应用配置
  app: {
    name: 'MAGI',
    version: '1.0.0',
    description: '新世纪福音战士 MAGI 超级计算机系统'
  }
};

// 验证必要的环境变量
export function validateConfig() {
  const provider = config.ai.provider.toLowerCase();

  switch (provider) {
    case 'anthropic':
      if (!config.ai.anthropic.apiKey) {
        throw new Error('缺少 ANTHROPIC_API_KEY 环境变量（使用 provider: anthropic）');
      }
      break;
    case 'openai':
      if (!config.ai.openai.apiKey) {
        throw new Error('缺少 OPENAI_API_KEY 环境变量（使用 provider: openai）');
      }
      break;
    case 'siliconflow':
      if (!config.ai.siliconflow.apiKey) {
        throw new Error('缺少 SILICONFLOW_API_KEY 环境变量（使用 provider: siliconflow）');
      }
      break;
    case 'openai-compatible':
      if (!config.ai.openaiCompatible.baseUrl) {
        throw new Error('缺少 OPENAI_COMPAT_BASE_URL 环境变量（使用 provider: openai-compatible）');
      }
      break;
    default:
      throw new Error(`未知的 AI_PROVIDER: ${provider}。支持: anthropic, openai, siliconflow, openai-compatible`);
  }

  console.log(`✅ 使用 AI 提供商: ${provider}`);
}

export default config;
