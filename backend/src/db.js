import Database from 'better-sqlite3';
import { config } from './config.js';

/**
 * 数据库管理类
 * 处理所有与SQLite的交互
 */
export class MAGIDatabase {
  constructor() {
    this.db = null;
  }

  /**
   * 初始化数据库连接和表结构
   */
  initialize() {
    try {
      this.db = new Database(config.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.createTables();
      this.upgradeTables();
      console.log('✅ 数据库初始化成功');
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 确保表结构是最新的（向下兼容旧数据库）
   */
  upgradeTables() {
    const existingColumns = this.getColumnNames('conversations');

    const migrations = [
      { column: 'balthasar_phase3', sql: 'ALTER TABLE conversations ADD COLUMN balthasar_phase3 TEXT' },
      { column: 'casper_phase3', sql: 'ALTER TABLE conversations ADD COLUMN casper_phase3 TEXT' },
      { column: 'melchior_phase3', sql: 'ALTER TABLE conversations ADD COLUMN melchior_phase3 TEXT' },
    ];

    for (const migration of migrations) {
      if (!existingColumns.includes(migration.column)) {
        try {
          this.db.exec(migration.sql);
          console.log(`✅ 数据库迁移: 添加列 ${migration.column}`);
        } catch (error) {
          console.warn(`⚠️ 数据库迁移失败 (${migration.column}):`, error.message);
        }
      }
    }
  }

  /**
   * 获取表的所有列名
   */
  getColumnNames(tableName) {
    try {
      const rows = this.db.pragma(`table_info(${tableName})`);
      return rows.map(row => row.name);
    } catch {
      return [];
    }
  }

  /**
   * 创建所有必要的表
   */
  createTables() {
    // conversations 表 - 存储对话记录
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        -- Phase 1: 独立分析
        balthasar_phase1 TEXT,
        casper_phase1 TEXT,
        melchior_phase1 TEXT,

        -- Phase 2: 相互评价
        balthasar_phase2 TEXT,
        casper_phase2 TEXT,
        melchior_phase2 TEXT,

        -- Phase 3 意见
        balthasar_phase3 TEXT,
        casper_phase3 TEXT,
        melchior_phase3 TEXT,

        -- Phase 3: 投票和共识
        balthasar_vote INTEGER,
        casper_vote INTEGER,
        melchior_vote INTEGER,
        consensus TEXT,
        vote_passed INTEGER DEFAULT 0,

        -- 元数据
        processing_time_ms INTEGER DEFAULT 0
      )
    `);

    // user_votes 表 - 存储用户投票（可选功能）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_votes (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        user_id TEXT,
        vote_choice INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      )
    `);

    // system_logs 表 - 系统日志
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `);

    // 创建索引以提高查询性能
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_conversations_created_at
      ON conversations(created_at DESC)
    `);
  }

  /**
   * 保存一个完整的对话记录
   */
  saveConversation(data) {
    const {
      id,
      question,
      balthasar_phase1,
      casper_phase1,
      melchior_phase1,
      balthasar_phase2,
      casper_phase2,
      melchior_phase2,
      balthasar_phase3,
      casper_phase3,
      melchior_phase3,
      balthasar_vote,
      casper_vote,
      melchior_vote,
      consensus,
      vote_passed,
      processing_time_ms
    } = data;

    // 为了兼容旧版，如果字段不存在则默认为空
    const b3 = balthasar_phase3 || '';
    const c3 = casper_phase3 || '';
    const m3 = melchior_phase3 || '';

    const stmt = this.db.prepare(`
      INSERT INTO conversations (
        id, question,
        balthasar_phase1, casper_phase1, melchior_phase1,
        balthasar_phase2, casper_phase2, melchior_phase2,
        balthasar_phase3, casper_phase3, melchior_phase3,
        balthasar_vote, casper_vote, melchior_vote,
        consensus, vote_passed,
        processing_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, question,
      balthasar_phase1, casper_phase1, melchior_phase1,
      balthasar_phase2, casper_phase2, melchior_phase2,
      b3, c3, m3,
      balthasar_vote ? 1 : 0, casper_vote ? 1 : 0, melchior_vote ? 1 : 0,
      consensus, vote_passed ? 1 : 0,
      processing_time_ms
    );
  }

  /**
   * 获取历史对话列表（分页）
   */
  getHistory(limit = 20, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT
        id, question, created_at,
        consensus, balthasar_vote, casper_vote, melchior_vote,
        balthasar_phase3, casper_phase3, melchior_phase3,
        processing_time_ms
      FROM conversations
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(limit, offset);
  }

  /**
   * 获取单个对话的详细信息
   */
  getConversation(id) {
    const stmt = this.db.prepare('SELECT * FROM conversations WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * 获取系统统计信息
   */
  getStats() {
    const statsStmt = this.db.prepare(`
      SELECT
        COUNT(*) as total_conversations,
        AVG(processing_time_ms) as avg_processing_time,
        SUM(total_tokens_used) as total_tokens_used,
        SUM(CASE WHEN vote_passed = 1 THEN 1 ELSE 0 END) as passed_votes,
        SUM(CASE WHEN vote_passed = 0 THEN 1 ELSE 0 END) as failed_votes
      FROM conversations
    `);

    const stats = statsStmt.get();

    // 计算AI的成功投票率
    const aiStatsStmt = this.db.prepare(`
      SELECT
        SUM(CASE WHEN balthasar_vote = 1 THEN 1 ELSE 0 END) as balthasar_votes,
        SUM(CASE WHEN casper_vote = 1 THEN 1 ELSE 0 END) as casper_votes,
        SUM(CASE WHEN melchior_vote = 1 THEN 1 ELSE 0 END) as melchior_votes
      FROM conversations
    `);

    const aiStats = aiStatsStmt.get();

    return {
      ...stats,
      ai_stats: {
        balthasar: {
          yes_votes: aiStats.balthasar_votes || 0,
          percentage: stats.total_conversations > 0
            ? ((aiStats.balthasar_votes || 0) / stats.total_conversations * 100).toFixed(2) + '%'
            : '0%'
        },
        casper: {
          yes_votes: aiStats.casper_votes || 0,
          percentage: stats.total_conversations > 0
            ? ((aiStats.casper_votes || 0) / stats.total_conversations * 100).toFixed(2) + '%'
            : '0%'
        },
        melchior: {
          yes_votes: aiStats.melchior_votes || 0,
          percentage: stats.total_conversations > 0
            ? ((aiStats.melchior_votes || 0) / stats.total_conversations * 100).toFixed(2) + '%'
            : '0%'
        }
      }
    };
  }

  /**
   * 保存用户投票
   */
  saveUserVote(conversationId, userId, voteChoice) {
    const id = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO user_votes (id, conversation_id, user_id, vote_choice)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(id, conversationId, userId || 'anonymous', voteChoice ? 1 : 0);
    return id;
  }

  /**
   * 获取某个对话的用户投票
   */
  getUserVotes(conversationId) {
    const stmt = this.db.prepare(`
      SELECT id, conversation_id, user_id, vote_choice, created_at
      FROM user_votes
      WHERE conversation_id = ?
      ORDER BY created_at DESC
    `);

    return stmt.all(conversationId) || [];
  }

  /**
   * 保存系统日志
   */
  log(level, message, metadata = null) {
    const stmt = this.db.prepare(`
      INSERT INTO system_logs (level, message, metadata)
      VALUES (?, ?, ?)
    `);

    stmt.run(level, message, metadata ? JSON.stringify(metadata) : null);
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('✅ 数据库连接已关闭');
    }
  }
}

// 创建并导出数据库实例
export const magiDB = new MAGIDatabase();

export default magiDB;
