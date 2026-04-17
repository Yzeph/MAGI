/**
 * MAGI 三阶段辩论引擎
 * Phase 1: 独立分析 - 三个AI并行分析
 * Phase 2: 相互评价 - AI评估彼此的观点
 * Phase 3: 共识形成 - 最终投票和共识
 */

import { MAGIAgents } from './ai-agents.js';
import { v4 as uuidv4 } from 'uuid';

export class DebateEngine {
  constructor() {
    this.agents = new MAGIAgents();
    this.conversationId = null;
    this.phase1Results = {};
    this.phase2Results = {};
    this.phase3Results = {};
  }

  /**
   * 运行完整的三阶段辩论
   * @param {string} question - 用户问题
   * @param {WebSocket} ws - WebSocket连接用于推送事件
   * @returns {Promise<Object>} 完整的辩论结果
   */
  async runDebate(question, ws = null) {
    this.conversationId = uuidv4();
    this.phase1Results = {};
    this.phase2Results = {};
    this.phase3Results = {};

    try {
      // Phase 1: 独立分析
      console.log('\n📊 开始 Phase 1: 独立分析\n');
      this.sendEvent(ws, 'phase_start', {
        phase: 1,
        message: '开始第1阶段：三个代理独立分析',
        question,
        conversationId: this.conversationId,
        timestamp: new Date().toISOString()
      });

      await this.runPhase1(question, ws);

      // Phase 2: 相互评价
      console.log('\n📊 开始 Phase 2: 相互评价\n');
      this.sendEvent(ws, 'phase_start', {
        phase: 2,
        message: '开始第2阶段：代理相互评价',
        question,
        conversationId: this.conversationId,
        timestamp: new Date().toISOString()
      });

      await this.runPhase2(question, ws);

      // Phase 3: 共识形成
      console.log('\n📊 开始 Phase 3: 共识形成\n');
      this.sendEvent(ws, 'phase_start', {
        phase: 3,
        message: '开始第3阶段：共识形成和投票',
        question,
        conversationId: this.conversationId,
        timestamp: new Date().toISOString()
      });

      await this.runPhase3(question, ws);

      // 完整对话结果
      const result = {
        conversationId: this.conversationId,
        question,
        timestamp: new Date().toISOString(),
        phases: {
          phase1: this.phase1Results,
          phase2: this.phase2Results,
          phase3: this.phase3Results
        },
        consensus: this.phase3Results.consensus || '无共识',
        votes: this.phase3Results.votes || {}
      };

      // 发送完成事件
      this.sendEvent(ws, 'conversation_complete', result);

      return result;
    } catch (error) {
      console.error('❌ 辩论过程出错:', error);
      this.sendEvent(ws, 'error', {
        phase: 'unknown',
        message: error.message,
        conversationId: this.conversationId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Phase 1: 独立分析
   * 三个AI代理并行分析同一个问题
   */
  async runPhase1(question, ws) {
    const agents = this.agents.getAgentNames();

    const analysisPromises = agents.map(agentName =>
      this.agents.analyzeWithStream(agentName, question, (chunk) => {
        // 流式推送AI的输出
        this.sendEvent(ws, 'ai_stream', {
          ai: agentName,  // ✨ 保持大写，与前端一致
          phase: 1,
          chunk,
          conversationId: this.conversationId,
          timestamp: new Date().toISOString()
        });
      })
    );

    // 并行执行三个AI的分析
    const results = await Promise.all(analysisPromises);

    // 存储Phase 1结果
    agents.forEach((agentName, index) => {
      this.phase1Results[agentName] = results[index];
      console.log(`✅ ${agentName} Phase 1 完成 (${results[index].length} 字符)`);
    });

    // Phase 1 完成事件
    this.sendEvent(ws, 'phase_complete', {
      phase: 1,
      message: '第1阶段完成',
      conversationId: this.conversationId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Phase 2: 相互评价
   * 每个AI评估其他两个AI的分析
   */
  async runPhase2(question, ws) {
    const agents = this.agents.getAgentNames();

    // 为每个AI构建评价prompt
    const evaluationPromises = agents.map(async (evaluatorName) => {
      // 构建包含其他AI分析的context
      const otherAgents = agents.filter(a => a !== evaluatorName);
      const context = otherAgents
        .map(name => `${name} 的分析:\n${this.phase1Results[name]}`)
        .join('\n\n---\n\n');

      const evaluationPrompt = `
原始问题: ${question}

以下是其他AI代理的分析:
${context}

请你作为 ${evaluatorName} 代理，评价上述分析。请指出:
1. 这些分析的优点
2. 可能存在的不足或遗漏
3. 你的补充观点或改进建议

保持你的特有风格和角度。`;

      // 获取评价结果
      return this.agents.analyzeWithStream(evaluatorName, evaluationPrompt, (chunk) => {
        this.sendEvent(ws, 'ai_stream', {
          ai: evaluatorName,  // ✨ 保持大写，与前端一致
          phase: 2,
          chunk,
          conversationId: this.conversationId,
          timestamp: new Date().toISOString()
        });
      });
    });

    // 并行执行三个AI的评价
    const results = await Promise.all(evaluationPromises);

    // 存储Phase 2结果
    agents.forEach((agentName, index) => {
      this.phase2Results[agentName] = results[index];
      console.log(`✅ ${agentName} Phase 2 完成 (${results[index].length} 字符)`);
    });

    // Phase 2 完成事件
    this.sendEvent(ws, 'phase_complete', {
      phase: 2,
      message: '第2阶段完成',
      conversationId: this.conversationId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Phase 3: 共识形成和投票
   * AI代理讨论并达成共识，进行投票
   */
  async runPhase3(question, ws) {
    const agents = this.agents.getAgentNames();

    // 构建讨论prompt
    const discussionContext = `
原始问题: ${question}

所有分析总结:
${agents
  .map(
    name => `
${name} 的初步分析:
${this.phase1Results[name].substring(0, 300)}...

${name} 的评价:
${this.phase2Results[name].substring(0, 300)}...
`
  )
  .join('\n---\n')}

现在，请你作为 ${agents[0]} 代理，基于上述所有分析和评价，提出一个最终的共识观点。
这个观点应该：
1. 综合考虑三个代理的不同视角
2. 指出主要的共识点
3. 说明是否能达成一致结论
4. 如果有分歧，解释分歧所在

然后请在末尾以投票的形式明确表态: "我的投票结果是：同意" 或 "我的投票结果是：不同意"`;

    // 获取共识
    const consensusText = await this.agents.analyzeWithStream(agents[0], discussionContext, (chunk) => {
      this.sendEvent(ws, 'ai_stream', {
        ai: agents[0],  // ✨ 保持大写，与前端一致
        phase: 3,
        chunk,
        conversationId: this.conversationId,
        timestamp: new Date().toISOString()
      });
    });

    this.phase3Results.consensus = consensusText;
    this.phase3Results[agents[0]] = consensusText;

    // 让其他AI投票
    const votePromises = agents.slice(1).map(async (agentName) => {
      const votePrompt = `
基于刚才的讨论和共识:

"${consensusText.substring(0, 200)}..."

请你作为 ${agentName}，简洁地说明:
1. 明确给出你的投票结果: 同意 或 不同意
2. 原因是什么?`;

      return this.agents.analyzeWithStream(agentName, votePrompt, (chunk) => {
        this.sendEvent(ws, 'ai_stream', {
          ai: agentName,  // ✨ 保持大写，与前端一致
          phase: 3,
          chunk,
          conversationId: this.conversationId,
          timestamp: new Date().toISOString()
        });
      });
    });

    // 获取所有投票
    const voteResults = await Promise.all(votePromises);

    // 处理投票结果
    const votes = {};
    const melchiorVote = this.extractVote(consensusText);
    votes[agents[0]] = melchiorVote !== null ? melchiorVote : true; // 第一个AI的投票已在共识中，如果没有明确表明，默认同意自己得出的共识

    agents.slice(1).forEach((agentName, index) => {
      this.phase3Results[agentName] = voteResults[index];
      votes[agentName] = this.extractVote(voteResults[index]);
    });

    this.phase3Results.votes = votes;

    // 这段逻辑在之前被添加用于将想法合并入共识字符串
    // 现在前端支持独立展示三贤者的意见，不需要后端拼装了
    this.phase3Results.consensus = consensusText;

    // 计算共识百分比
    const agreeCount = Object.values(votes).filter(v => v === true).length;
    const consensusPercentage = Math.round((agreeCount / agents.length) * 100);
    this.phase3Results.consensusPercentage = consensusPercentage;

    console.log(`✅ Phase 3 完成: ${agreeCount}/${agents.length} AI同意 (${consensusPercentage}%)`);

    // Phase 3 完成和投票结果事件
    this.sendEvent(ws, 'phase_complete', {
      phase: 3,
      message: '第3阶段完成',
      votes,
      consensusPercentage,
      conversationId: this.conversationId,
      timestamp: new Date().toISOString()
    });

    this.sendEvent(ws, 'consensus_reached', {
      consensus: consensusText.substring(0, 500),
      agreeCount,
      totalAgents: agents.length,
      consensusPercentage,
      conversationId: this.conversationId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 从文本中提取投票结果
   */
  extractVote(text) {
    if (!text) return null;
    const text_lower = text.toLowerCase();
    
    // 移除括号内的动作描写（如(轻笑一声)）
    let cleanText = text_lower.replace(/（.*?）|\\(.*?\\)/g, '');
    
    // 移除可能干扰判断的提问复述
    cleanText = cleanText.replace(/你是否同意这个共识/g, '');
    cleanText = cleanText.replace(/是否同意/g, '');
    cleanText = cleanText.replace(/我的投票结果是/g, '');
    cleanText = cleanText.replace(/同意这个共识[？\?]/g, '');

    // 作为一个后备方案，先检查开头几行是否包含明确的单字回复
    const lines = cleanText.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      if (line.includes('否。') || line.includes('否，') || line === '否' || line.startsWith('否 ') || line.includes('否定的') || line.includes('不同意') || line.includes('反对') || line.includes('拒绝')) {
        return false;
      }
      if (line.includes('是。') || line.includes('是，') || line === '是' || line.startsWith('是 ') || line.includes('是的') || line.includes('同意') || line.includes('赞成') || line.includes('认同')) {
        return true;
      }
    }

    // 寻找最先出现的意图表述
    const match = cleanText.match(/(不同意|反对|拒绝|同意|赞成|认同|弃权|明确反对|无法同意|不能同意)/);
    
    if (match) {
      const w = match[0];
      if (w === '不同意' || w === '反对' || w === '拒绝' || w === '明确反对' || w === '无法同意' || w === '不能同意') return false;
      if (w === '同意' || w === '赞成' || w === '认同') return true;
      if (w === '弃权') return null;
    }

    // 默认回退如果仍然没有明确答案
    return null;
  }

  /**
   * 发送WebSocket事件
   */
  sendEvent(ws, type, data) {
    if (ws && ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(JSON.stringify({ type, ...data }));
      } catch (error) {
        console.error(`发送WebSocket事件失败 (${type}):`, error.message);
      }
    }
  }

  /**
   * 获取对话结果摘要
   */
  getSummary() {
    return {
      conversationId: this.conversationId,
      phase1: Object.keys(this.phase1Results).length + ' 个分析',
      phase2: Object.keys(this.phase2Results).length + ' 个评价',
      phase3Consensus: this.phase3Results.consensus ? '已形成' : '未形成',
      votes: this.phase3Results.votes || {}
    };
  }
}

export default DebateEngine;
