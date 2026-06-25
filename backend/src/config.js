import { activeProvider, activeModel } from '../lib/model.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: process.env.PORT || 3000,
  wsPort: process.env.WS_PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // 模型配置委托给 lib/model.js
  ai: {
    provider: activeProvider,
    model: activeModel,
  },

  dbPath: process.env.DB_PATH || './magi.db',

  debate: {
    consensusThreshold: parseInt(process.env.CONSENSUS_THRESHOLD || '67'),
  },

  app: {
    name: 'MAGI',
    version: '1.0.0',
    description: '新世纪福音战士 MAGI 超级计算机系统',
  },
};

export function validateConfig() {
  // model.js 导入时已自动验证配置，此处仅输出启动信息
  console.log(`✅ ${config.app.name} — AI: ${config.ai.provider} / ${config.ai.model}`);
}

export default config;
