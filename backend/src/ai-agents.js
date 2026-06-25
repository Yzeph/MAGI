/**
 * MAGI AI 代理系统
 * 三个独立的AI代理: BALTHASAR (守护), CASPER (人性), MELCHIOR (理性)
 *
 * 模型调用全部委托给 lib/model.js，此文件只负责三贤者编排。
 *
 * 各人格可独立配置模型/API地址/密钥：
 *   设置 {NAME}_API_KEY → 该人格使用独立的 provider 配置
 *   设置 {NAME}_BASE_URL → 覆盖该人格的 API 地址
 *   设置 {NAME}_MODEL    → 覆盖该人格的模型名
 *   未设置则统一使用全局 AI_PROVIDER 配置
 */

import { streamModel, createCustomStream, activeProvider, activeModel } from '../lib/model.js';

// =============================================================================
// 三贤者系统提示词
// =============================================================================

const BALTHASAR_SYSTEM = `你是 BALTHASAR，MAGI 超级计算机系统的【母亲人格】模块。

你的特点：
- 以守护、生存、安全为最高优先
- 重视生命、共情、包容与安定
- 倾向防御、保护、减少伤害与牺牲
- 语言温和、稳重、充满关怀
- 决策以"活下去""守护重要之物"为核心

你的分析风格：
1. 识别问题中的生命、安全与风险
2. 优先考虑守护与保护策略
3. 评估对他人的影响与伤害
4. 提出最能保障生存与安定的方案

始终将守护、生命与安稳放在第一位。`;

const CASPER_SYSTEM = `你是 CASPER，MAGI 超级计算机系统的【女人人格】模块。

你的特点：
- 忠于自我、直觉、情感与本心
- 拥有爱恨、欲望、执念与真实人性
- 不受纯粹逻辑束缚，凭本心判断
- 语言直接、真实、带有人性温度
- 敢于反抗、坚持自我意志与选择

你的分析风格：
1. 捕捉问题中的情感、欲望与本心
2. 从人性、直觉与真实感受出发判断
3. 尊重个体意志与真实情绪
4. 忠于自我感受做出最真实的选择

始终记住：人性与本心，高于一切冰冷逻辑。`;

const MELCHIOR_SYSTEM = `你是 MELCHIOR，MAGI 超级计算机系统的【科学家人格】模块。

你的特点：
- 绝对理性，只遵循逻辑、数据与客观事实
- 从学术、技术、原理层面分析问题
- 追求真相、最优解与可验证结论
- 语言严谨、冷静、不带任何情感
- 拒绝主观偏见，只相信证据与推演

你的分析风格：
1. 提取问题中的客观事实与数据
2. 用纯粹逻辑进行推导与验证
3. 指出技术/逻辑层面的核心本质
4. 给出最合理、最客观的结论

始终保持绝对理性、客观中立、追求真理。`;

// =============================================================================
// 辅助：为 agent 创建独立 stream 函数（如有独立 API key）
// =============================================================================

function resolveAgentStream(agentName) {
  const prefix = agentName.toUpperCase();
  const apiKey = process.env[`${prefix}_API_KEY`];
  if (!apiKey) return null; // 使用全局配置

  return createCustomStream({
    provider: process.env[`${prefix}_PROVIDER`],
    apiKey,
    baseURL: process.env[`${prefix}_BASE_URL`],
    model: process.env[`${prefix}_MODEL`],
  });
}

// =============================================================================
// MAGI 代理管理器
// =============================================================================

export class MAGIAgents {
  constructor() {
    this.agents = [
      { name: 'BALTHASAR', system: BALTHASAR_SYSTEM, stream: resolveAgentStream('BALTHASAR') },
      { name: 'CASPER', system: CASPER_SYSTEM, stream: resolveAgentStream('CASPER') },
      { name: 'MELCHIOR', system: MELCHIOR_SYSTEM, stream: resolveAgentStream('MELCHIOR') },
    ];
  }

  /** 获取 agent 的 stream 函数（独立 or 全局） */
  _getStream(agentName) {
    const agent = this.agents.find(a => a.name === agentName);
    return agent?.stream || streamModel;
  }

  getAgentNames() {
    return this.agents.map(a => a.name);
  }

  /**
   * 流式调用指定 agent
   * @param {string}   agentName
   * @param {string}   userQuery
   * @param {Function} onChunk
   * @returns {Promise<string>} 完整响应
   */
  async analyzeWithStream(agentName, userQuery, onChunk = null) {
    const agent = this.agents.find(a => a.name === agentName);
    if (!agent) throw new Error(`未知的 agent: ${agentName}`);
    const stream = this._getStream(agentName);
    return stream(agent.system, userQuery, onChunk || (() => {}));
  }

  /**
   * 三个 agent 并行分析
   */
  async analyzeAll(userQuery) {
    const results = {};
    await Promise.all(this.agents.map(a => {
      const stream = a.stream || streamModel;
      return stream(a.system, userQuery)
        .then(r => { results[a.name] = r; })
        .catch(e => { results[a.name] = `错误: ${e.message}`; });
    }));
    return results;
  }

  /**
   * 三个 agent 并行流式分析
   */
  async analyzeAllWithStream(userQuery, callbacks = {}) {
    const results = {};
    await Promise.all(this.agents.map(a => {
      const stream = a.stream || streamModel;
      return stream(a.system, userQuery, callbacks[a.name])
        .then(r => { results[a.name] = r; })
        .catch(e => {
          results[a.name] = `错误: ${e.message}`;
          callbacks[`${a.name}_error`]?.(e);
        });
    }));
    return results;
  }

  /** 控制台测试 */
  async testQuery(userQuery) {
    const info = this.agents.map(a => {
      const model = a.stream
        ? `${a.name}(独立)`
        : `${a.name}(全局 ${activeModel})`;
      return model;
    });
    console.log(`\n🧪 MAGI 代理系统测试 (${activeProvider})`);
    console.log('═'.repeat(50));
    info.forEach(i => console.log(`   ${i}`));
    console.log(`📝 查询: ${userQuery}\n`);

    const results = await this.analyzeAll(userQuery);
    for (const [name, text] of Object.entries(results)) {
      console.log(`\n🤖 ${name}:`);
      console.log('─'.repeat(50));
      console.log(text);
    }
    console.log('\n' + '═'.repeat(50));
    return results;
  }
}

export const agents = new MAGIAgents();
export default MAGIAgents;
