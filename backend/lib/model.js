// =============================================================================
// MAGI 模型调用 — 统一入口
// =============================================================================
// 模型配置、密钥加载、客户端创建、流式调用全部集中在此文件。
// 外部只需调用 streamModel()，无需关心底层 provider 差异。
//
// provider 切换方式:
//   .env 中设置 AI_PROVIDER=deepseek，.secrets 中填写对应 API key
//
// 模型名/地址覆盖:
//   不设置则使用各 provider 的默认值
//   .env 中设置 DEEPSEEK_MODEL=xxx 或 DEEPSEEK_BASE_URL=xxx 可临时切换
//
// 各人格独立配置:
//   设置 {NAME}_API_KEY 后 createCustomStream() 会创建独立的 provider 实例
//   可用于让 BALTHASAR/CASPER/MELCHIOR 分别使用不同的 API 地址和密钥
// =============================================================================

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// ---------------------------------------------------------------------------
// 1. 环境变量加载（优先级: .env → .env.local → .secrets → 系统环境变量）
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

for (const file of ['.env', '.env.local', '.secrets']) {
  const p = path.join(rootDir, file);
  if (fs.existsSync(p)) dotenv.config({ path: p });
}

// ---------------------------------------------------------------------------
// 2. Provider 配置注册表
// ---------------------------------------------------------------------------
const PROVIDERS = {
  anthropic: {
    defaultModel: 'claude-sonnet-4-6',
    envKey: 'ANTHROPIC_API_KEY',
    envModel: 'ANTHROPIC_MODEL',
    envBaseUrl: 'ANTHROPIC_BASE_URL',

    createClient() {
      const opts = { apiKey: process.env[this.envKey] };
      const baseUrl = process.env[this.envBaseUrl];
      if (baseUrl) opts.baseURL = baseUrl;
      return new Anthropic(opts);
    },

    async stream(client, system, messages, onChunk, modelName) {
      const stream = client.messages.stream({
        model: modelName || this.resolvedModel,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system,
        messages,
      });
      let full = '';
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          full += event.delta.text;
          onChunk(event.delta.text);
        }
      }
      return full;
    },
  },

  openai: {
    defaultModel: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
    defaultTimeout: 60000,
    envKey: 'OPENAI_API_KEY',
    envModel: 'OPENAI_MODEL',
    envBaseUrl: 'OPENAI_BASE_URL',
    envTimeout: 'OPENAI_TIMEOUT',

    createClient() {
      return new OpenAI({
        apiKey: process.env[this.envKey],
        baseURL: process.env[this.envBaseUrl] || this.baseUrl,
        timeout: parseInt(process.env[this.envTimeout]) || this.defaultTimeout,
      });
    },

    async stream(client, system, messages, onChunk, modelName) {
      const stream = await client.chat.completions.create({
        model: modelName || this.resolvedModel,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
      });
      let full = '';
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) { full += text; onChunk(text); }
      }
      return full;
    },
  },

  siliconflow: {
    defaultModel: 'Pro/deepseek-ai/DeepSeek-V3.2',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultTimeout: 60000,
    envKey: 'SILICONFLOW_API_KEY',
    envModel: 'SILICONFLOW_MODEL',
    envBaseUrl: 'SILICONFLOW_BASE_URL',
    envTimeout: 'SILICONFLOW_TIMEOUT',

    createClient() {
      return new OpenAI({
        apiKey: process.env[this.envKey],
        baseURL: process.env[this.envBaseUrl] || this.baseUrl,
        timeout: parseInt(process.env[this.envTimeout]) || this.defaultTimeout,
      });
    },

    async stream(client, system, messages, onChunk, modelName) {
      const stream = await client.chat.completions.create({
        model: modelName || this.resolvedModel,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
      });
      let full = '';
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) { full += text; onChunk(text); }
      }
      return full;
    },
  },

  deepseek: {
    defaultModel: 'deepseek-v4-flash',
    baseUrl: 'https://api.deepseek.com',
    defaultTimeout: 60000,
    envKey: 'DEEPSEEK_API_KEY',
    envModel: 'DEEPSEEK_MODEL',
    envBaseUrl: 'DEEPSEEK_BASE_URL',
    envTimeout: 'DEEPSEEK_TIMEOUT',

    createClient() {
      return new OpenAI({
        apiKey: process.env[this.envKey],
        baseURL: process.env[this.envBaseUrl] || this.baseUrl,
        timeout: parseInt(process.env[this.envTimeout]) || this.defaultTimeout,
      });
    },

    async stream(client, system, messages, onChunk, modelName) {
      const stream = await client.chat.completions.create({
        model: modelName || this.resolvedModel,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
      });
      let full = '';
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) { full += text; onChunk(text); }
      }
      return full;
    },
  },

  'openai-compatible': {
    defaultModel: 'qwen2.5:72b',
    baseUrl: 'http://localhost:8000/v1',
    defaultTimeout: 60000,
    envKey: 'OPENAI_COMPAT_API_KEY',
    envModel: 'OPENAI_COMPAT_MODEL',
    envBaseUrl: 'OPENAI_COMPAT_BASE_URL',
    envTimeout: 'OPENAI_COMPAT_TIMEOUT',

    createClient() {
      return new OpenAI({
        apiKey: process.env[this.envKey] || 'not-needed',
        baseURL: process.env[this.envBaseUrl] || this.baseUrl,
        timeout: parseInt(process.env[this.envTimeout]) || this.defaultTimeout,
      });
    },

    async stream(client, system, messages, onChunk, modelName) {
      const stream = await client.chat.completions.create({
        model: modelName || this.resolvedModel,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
      });
      let full = '';
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) { full += text; onChunk(text); }
      }
      return full;
    },
  },
};

// ---------------------------------------------------------------------------
// 3. 当前激活的 provider 实例
// ---------------------------------------------------------------------------
const providerName = process.env.AI_PROVIDER || 'siliconflow';
const provider = PROVIDERS[providerName];
if (!provider) {
  throw new Error(`未知的 AI_PROVIDER: "${providerName}"。可用: ${Object.keys(PROVIDERS).join(', ')}`);
}

// 写入通用参数
const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4096');
const temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
provider.maxTokens = maxTokens;
provider.temperature = temperature;

// 解析模型名 (AI_MODEL 全局覆盖 > provider 专用 env > defaultModel)
provider.resolvedModel = process.env.AI_MODEL || process.env[provider.envModel] || provider.defaultModel;

// 验证必要配置
const apiKey = process.env[provider.envKey];
if (!apiKey && providerName !== 'openai-compatible') {
  throw new Error(`缺少 ${provider.envKey} 环境变量（使用 provider: ${providerName}）`);
}

const client = provider.createClient();

// ---------------------------------------------------------------------------
// 4. 导出 — 统一调用入口
// ---------------------------------------------------------------------------

/** 当前激活的 provider 名称 */
export const activeProvider = providerName;

/** 当前使用的模型名 */
export const activeModel = provider.resolvedModel;

/**
 * 流式调用当前 provider
 *
 * @param {string}   system   系统提示词
 * @param {string}   userQuery 用户输入
 * @param {Function} onChunk  每收到一个文本块的回调
 * @param {string}   [modelName] 可选，覆盖当前 provider 的模型名
 * @returns {Promise<string>} 完整响应文本
 */
export async function streamModel(system, userQuery, onChunk = () => {}, modelName) {
  return provider.stream(client, system, [{ role: 'user', content: userQuery }], onChunk, modelName);
}

/**
 * 创建独立的流式调用函数（可覆盖 API key、baseURL、模型）
 * 用于各人格使用不同的提供商/密钥/地址
 *
 * @param {object}   opts
 * @param {string}   [opts.provider]  provider 名称，默认使用 AI_PROVIDER
 * @param {string}   [opts.apiKey]    API key
 * @param {string}   [opts.baseURL]   API 地址
 * @param {string}   [opts.model]     模型名
 * @param {number}   [opts.maxTokens] 最大 token 数
 * @param {number}   [opts.temperature] 温度
 * @returns {(system:string, userQuery:string, onChunk?:Function) => Promise<string>} stream 函数
 */
export function createCustomStream(opts = {}) {
  const providerName = opts.provider || process.env.AI_PROVIDER || 'siliconflow';
  let prov = PROVIDERS[providerName];
  if (!prov) {
    // 未知 provider → 视为 OpenAI 兼容服务，必须提供 baseURL
    const fallbackBaseURL = opts.baseURL || process.env[`${providerName.toUpperCase()}_BASE_URL`];
    if (!fallbackBaseURL) {
      throw new Error(`未知的 provider: "${providerName}"，且未设置 ${providerName.toUpperCase()}_BASE_URL`);
    }
    prov = {
      defaultModel: 'default',
      baseUrl: fallbackBaseURL,
      envKey: `${providerName.toUpperCase()}_API_KEY`,
      envModel: `${providerName.toUpperCase()}_MODEL`,
      envBaseUrl: `${providerName.toUpperCase()}_BASE_URL`,
      defaultTimeout: 60000,

      createClient() {
        return new OpenAI({
          apiKey: process.env[this.envKey],
          baseURL: process.env[this.envBaseUrl] || this.baseUrl,
          timeout: parseInt(process.env[`${providerName.toUpperCase()}_TIMEOUT`]) || this.defaultTimeout,
        });
      },

      async stream(client, system, messages, onChunk, modelName) {
        const stream = await client.chat.completions.create({
          model: modelName || this.resolvedModel,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: true,
          messages: [{ role: 'system', content: system }, ...messages],
        });
        let full = '';
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) { full += text; onChunk(text); }
        }
        return full;
      },
    };
  }

  const resolvedApiKey = opts.apiKey || process.env[prov.envKey];
  if (!resolvedApiKey && providerName !== 'openai-compatible') {
    throw new Error(`缺少 ${prov.envKey}（provider: ${providerName}）`);
  }

  const resolvedModel = opts.model || process.env.AI_MODEL || process.env[prov.envModel] || prov.defaultModel;
  const resolvedBaseURL = opts.baseURL || process.env[prov.envBaseUrl] || prov.baseUrl;
  const resolvedTimeout = opts.timeout || parseInt(process.env[prov.envTimeout]) || prov.defaultTimeout || 60000;
  const maxTokens = opts.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '4096');
  const temperature = opts.temperature ?? parseFloat(process.env.AI_TEMPERATURE || '0.7');

  let customClient;
  if (providerName === 'anthropic') {
    const anthropicOpts = { apiKey: resolvedApiKey };
    if (resolvedBaseURL) anthropicOpts.baseURL = resolvedBaseURL;
    customClient = new Anthropic(anthropicOpts);
  } else {
    customClient = new OpenAI({
      apiKey: resolvedApiKey,
      baseURL: resolvedBaseURL,
      timeout: resolvedTimeout,
    });
  }

  return async function customStream(system, userQuery, onChunk = () => {}) {
    return prov.stream(customClient, system, [{ role: 'user', content: userQuery }], onChunk, resolvedModel);
  };
}
