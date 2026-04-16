import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { config, validateConfig } from './config.js';
import { magiDB } from './db.js';
import { MAGIAgents } from './ai-agents.js';
import { DebateEngine } from './debate-engine.js';
import { v4 as uuidv4 } from 'uuid';

// 验证配置
try {
  validateConfig();
} catch (error) {
  console.error('❌ 配置错误:', error.message);
  process.exit(1);
}

// 初始化MAGI AI代理
let agents = null;
try {
  agents = new MAGIAgents();
  console.log('✅ MAGI AI代理系统初始化成功');
} catch (error) {
  console.error('❌ MAGI AI代理初始化失败:', error.message);
  process.exit(1);
}

// 初始化Express应用
const app = express();
const server = createServer(app);

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ============ HTTP API 路由 ============

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: config.app.name,
    version: config.app.version,
    timestamp: new Date().toISOString()
  });
});

/**
 * API 信息端点
 */
app.get('/api/info', (req, res) => {
  res.json({
    app: config.app.name,
    version: config.app.version,
    description: config.app.description,
    endpoints: {
      health: 'GET /health',
      info: 'GET /api/info',
      query: 'POST /api/query (HTTP同步查询)',
      history: 'GET /api/history (获取历史记录)',
      conversation: 'GET /api/conversation/:id (查看对话详情)',
      vote: 'POST /api/vote (用户投票)',
      getVotes: 'GET /api/vote/:conversationId (获取对话投票)',
      stats: 'GET /api/stats (系统统计)',
      websocket: 'WS /ws (WebSocket实时查询)'
    }
  });
});

/**
 * POST /api/query
 * 提交查询（HTTP方式，同步等待结果）
 */
app.post('/api/query', async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({
      success: false,
      error: '缺少或无效的 question 参数'
    });
  }

  try {
    // 创建辩论引擎实例
    const debateEngine = new DebateEngine();

    // 运行完整的三阶段辩论（不通过WebSocket）
    const result = await debateEngine.runDebate(question, null);

    // 保存到数据库
    try {
      magiDB.saveConversation({
        id: result.conversationId,
        question: question,
        balthasar_phase1: result.phases.phase1.BALTHASAR || '',
        casper_phase1: result.phases.phase1.CASPER || '',
        melchior_phase1: result.phases.phase1.MELCHIOR || '',
        balthasar_phase2: result.phases.phase2.BALTHASAR || '',
        casper_phase2: result.phases.phase2.CASPER || '',
        melchior_phase2: result.phases.phase2.MELCHIOR || '',
        balthasar_vote: result.votes.BALTHASAR || null,
        casper_vote: result.votes.CASPER || null,
        melchior_vote: result.votes.MELCHIOR || null,
        consensus: result.consensus || '',
        vote_passed: result.phases.phase3.consensusPercentage >= 67 ? 1 : 0,
        total_tokens_used: 0,
        processing_time_ms: 0
      });
      console.log(`✅ 对话已保存到数据库 (${result.conversationId})`);
    } catch (dbError) {
      console.warn('⚠️  数据库保存失败:', dbError.message);
    }

    // 返回完整的结果
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ 查询处理失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/history
 * 获取历史对话列表
 */
app.get('/api/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const history = magiDB.getHistory(limit, offset);

    res.json({
      success: true,
      data: history,
      pagination: {
        limit,
        offset,
        total: magiDB.getStats().total_conversations
      }
    });
  } catch (error) {
    console.error('❌ 获取历史失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/conversation/:id
 * 获取单个对话的详细信息
 */
app.get('/api/conversation/:id', (req, res) => {
  try {
    const conversation = magiDB.getConversation(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: '对话不存在'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('❌ 获取对话失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vote
 * 用户投票
 */
app.post('/api/vote', (req, res) => {
  const { conversationId, userId, voteChoice } = req.body;

  if (!conversationId) {
    return res.status(400).json({
      success: false,
      error: '缺少 conversationId 参数'
    });
  }

  if (typeof voteChoice !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: '无效的 voteChoice 参数（应为 true 或 false）'
    });
  }

  try {
    // 检查对话是否存在
    const conversation = magiDB.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: '对话不存在'
      });
    }

    // 保存用户投票
    const voteId = magiDB.saveUserVote(conversationId, userId || 'anonymous', voteChoice);

    res.json({
      success: true,
      data: {
        voteId,
        conversationId,
        voteChoice,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ 保存投票失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vote/:conversationId
 * 获取某个对话的用户投票
 */
app.get('/api/vote/:conversationId', (req, res) => {
  const { conversationId } = req.params;

  try {
    const votes = magiDB.getUserVotes(conversationId);

    res.json({
      success: true,
      data: {
        conversationId,
        votes,
        total: votes.length,
        agreementCount: votes.filter(v => v.vote_choice === 1).length,
        disagreeCount: votes.filter(v => v.vote_choice === 0).length
      }
    });
  } catch (error) {
    console.error('❌ 获取投票失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats
 * 获取系统统计信息
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = magiDB.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ 获取统计失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============ 错误处理 ============

/**
 * 404 处理
 */
app.use((req, res) => {
  res.status(404).json({
    error: '路由不存在',
    path: req.path,
    method: req.method
  });
});

/**
 * 全局错误处理
 */
app.use((error, req, res, next) => {
  console.error('❌ 服务器错误:', error);
  res.status(500).json({
    error: '服务器内部错误',
    message: error.message
  });
});

// ============ WebSocket 服务 ============

const wss = new WebSocketServer({ server });

/**
 * WebSocket 连接处理
 */
wss.on('connection', (ws) => {
  const clientId = uuidv4().substr(0, 8);
  console.log(`🔗 客户端连接: ${clientId}`);

  // 向客户端发送欢迎消息
  ws.send(JSON.stringify({
    type: 'system_message',
    message: '欢迎连接到 MAGI 超级计算机系统',
    clientId: clientId,
    timestamp: new Date().toISOString()
  }));

  /**
   * 处理客户端消息
   */
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log(`📩 来自 ${clientId} 的消息:`, message.type);

      if (message.type === 'query') {
        handleQuery(ws, message.question, clientId);
      } else if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          error: '未知的消息类型'
        }));
      }
    } catch (error) {
      console.error('❌ 消息处理失败:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });

  /**
   * 处理连接关闭
   */
  ws.on('close', () => {
    console.log(`🔌 客户端断开连接: ${clientId}`);
  });

  /**
   * 处理连接错误
   */
  ws.on('error', (error) => {
    console.error(`❌ WebSocket 错误 (${clientId}):`, error);
  });
});

/**
 * 处理查询 - 三阶段辩论引擎
 * Phase 1: 独立分析 - 三个AI代理并行分析问题
 * Phase 2: 相互评价 - 代理评估彼此的分析
 * Phase 3: 共识形成 - 综合讨论形成最终结论
 */
async function handleQuery(ws, question, clientId) {
  console.log(`🔍 处理查询 (${clientId}):`, question);

  try {
    // 创建辩论引擎实例
    const debateEngine = new DebateEngine();

    // 运行完整的三阶段辩论
    const result = await debateEngine.runDebate(question, ws);

    // 保存到数据库
    try {
      magiDB.saveConversation({
        id: result.conversationId,
        question: question,
        balthasar_phase1: result.phases.phase1.BALTHASAR || '',
        casper_phase1: result.phases.phase1.CASPER || '',
        melchior_phase1: result.phases.phase1.MELCHIOR || '',
        balthasar_phase2: result.phases.phase2.BALTHASAR || '',
        casper_phase2: result.phases.phase2.CASPER || '',
        melchior_phase2: result.phases.phase2.MELCHIOR || '',
        balthasar_vote: result.votes.BALTHASAR || null,
        casper_vote: result.votes.CASPER || null,
        melchior_vote: result.votes.MELCHIOR || null,
        consensus: result.consensus || '',
        vote_passed: result.phases.phase3.consensusPercentage >= 67 ? 1 : 0,
        total_tokens_used: 0,
        processing_time_ms: 0
      });
      console.log(`✅ 对话已保存到数据库 (${result.conversationId})`);
    } catch (dbError) {
      console.warn('⚠️  数据库保存失败:', dbError.message);
    }

  } catch (error) {
    console.error('❌ 查询处理失败:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }));
  }
}

// ============ 服务器启动 ============

/**
 * 启动服务器
 */
function startServer() {
  try {
    // 初始化数据库
    magiDB.initialize();

    // 启动HTTP/WebSocket服务器
    server.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════╗
║     MAGI 超级计算机系统已启动          ║
╚════════════════════════════════════════╝

📡 HTTP API: http://localhost:${config.port}
🔗 WebSocket: ws://localhost:${config.port}

📚 API 文档: http://localhost:${config.port}/api/info
💚 健康检查: http://localhost:${config.port}/health

🌐 访问历史: http://localhost:${config.port}/api/history
📊 系统统计: http://localhost:${config.port}/api/stats

环境: ${config.nodeEnv}
数据库: ${config.dbPath}
      `);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

/**
 * 优雅关闭
 */
process.on('SIGINT', () => {
  console.log('\n⏹️  服务器正在关闭...');
  magiDB.close();
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

// 启动服务器
startServer();

export { app, server, wss };
