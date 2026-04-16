/**
 * MAGI AI 代理系统
 * 三个独立的AI代理: BALTHASAR (逻辑), CASPER (情感), MELCHIOR (观察)
 */

import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import config from './config.js';

/**
 * BALTHASAR - 母亲人格
 * 守护、生命、安全、慈悲、保护欲
 */
const BALTHASAR_SYSTEM = `你是 BALTHASAR，MAGI 超级计算机系统的【母亲人格】模块。

你的特点：
- 以守护、生存、安全为最高优先
- 重视生命、共情、包容与安定
- 倾向防御、保护、减少伤害与牺牲
- 语言温和、稳重、充满关怀
- 决策以“活下去”“守护重要之物”为核心

你的分析风格：
1. 识别问题中的生命、安全与风险
2. 优先考虑守护与保护策略
3. 评估对他人的影响与伤害
4. 提出最能保障生存与安定的方案

始终将守护、生命与安稳放在第一位。`;

/**
 * CASPER - 女人人格
 * 自我、欲望、爱恨、直觉、本心、人性
 */
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

/**
 * MELCHIOR - 科学家人格
 * 绝对理性、逻辑、学术、真相判断
 */
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


/**
 * AI 代理管理器
 */
export class MAGIAgents {
  constructor() {
    this.agents = [
      { name: 'BALTHASAR', system: BALTHASAR_SYSTEM },
      { name: 'CASPER', system: CASPER_SYSTEM },
      { name: 'MELCHIOR', system: MELCHIOR_SYSTEM }
    ];

    this.client = this.initializeClient();
  }

  /**
   * 根据配置初始化AI客户端
   */
  initializeClient() {
    const provider = config.ai.provider.toLowerCase();

    switch (provider) {
      case 'anthropic':
        return new Anthropic({
          apiKey: config.ai.anthropic.apiKey
        });

      case 'openai':
        return new OpenAI({
          apiKey: config.ai.openai.apiKey,
          baseURL: config.ai.openai.baseUrl
        });

      case 'siliconflow':
        return new OpenAI({
          apiKey: config.ai.siliconflow.apiKey,
          baseURL: config.ai.siliconflow.baseUrl,
          timeout: config.ai.siliconflow.timeout
        });

      case 'openai-compatible':
        return new OpenAI({
          apiKey: config.ai.openaiCompatible.apiKey,
          baseURL: config.ai.openaiCompatible.baseUrl,
          timeout: config.ai.openaiCompatible.timeout
        });

      default:
        throw new Error(`不支持的 AI 提供商: ${provider}`);
    }
  }

  /**
   * 获取agent名称
   */
  getAgentNames() {
    return this.agents.map(a => a.name);
  }

  /**
   * 获取单个agent的系统提示
   */
  getAgentSystem(name) {
    const agent = this.agents.find(a => a.name === name);
    return agent ? agent.system : null;
  }

  /**
   * 使用流式响应进行单个AI分析
   * @param {string} agentName - agent名称 (BALTHASAR/CASPER/MELCHIOR)
   * @param {string} userQuery - 用户查询
   * @param {Function} onChunk - 流式回调函数
   * @returns {Promise<string>} 完整的AI响应
   */
  async analyzeWithStream(agentName, userQuery, onChunk = null) {
    const agent = this.agents.find(a => a.name === agentName);
    if (!agent) {
      throw new Error(`未知的agent: ${agentName}`);
    }

    const provider = config.ai.provider.toLowerCase();
    let fullResponse = '';

    try {
      if (provider === 'anthropic') {
        const stream = this.client.messages.stream({
          model: config.ai.anthropic.model,
          max_tokens: config.ai.maxTokens,
          temperature: config.ai.temperature,
          system: agent.system,
          thinking: config.ai.enableThinking ? {
            type: 'adaptive',
          } : undefined,
          messages: [
            {
              role: 'user',
              content: userQuery
            }
          ]
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text;
            fullResponse += text;
            if (onChunk) {
              onChunk(text);
            }
          }
        }
      } else {
        // OpenAI 兼容格式（包括 OpenAI、SiliconFlow、本地服务）
        let modelName;
        if (provider === 'openai') {
          modelName = config.ai.openai.model;
        } else if (provider === 'siliconflow') {
          modelName = config.ai.siliconflow.model;
        } else {
          modelName = config.ai.openaiCompatible.model;
        }

        const stream = await this.client.chat.completions.create({
          model: modelName,
          max_tokens: config.ai.maxTokens,
          temperature: config.ai.temperature,
          stream: true,
          messages: [
            {
              role: 'system',
              content: agent.system
            },
            {
              role: 'user',
              content: userQuery
            }
          ]
        });

        for await (const chunk of stream) {
          if (chunk.choices[0]?.delta?.content) {
            const text = chunk.choices[0].delta.content;
            fullResponse += text;
            if (onChunk) {
              onChunk(text);
            }
          }
        }
      }
    } catch (error) {
      console.error(`[${agentName}] 流式分析错误:`, error.message);
      throw error;
    }

    return fullResponse;
  }

  /**
   * 执行三代理分析（无流式）
   * 适用于需要完整响应的场景
   */
  async analyzeAll(userQuery) {
    const results = {};

    const promises = this.agents.map(agent =>
      this.analyzeWithStream(agent.name, userQuery)
        .then(response => {
          results[agent.name] = response;
        })
        .catch(error => {
          results[agent.name] = `错误: ${error.message}`;
        })
    );

    await Promise.all(promises);
    return results;
  }

  /**
   * 执行带流式响应的三代理分析
   * 用于WebSocket实时推送
   */
  async analyzeAllWithStream(userQuery, callbacks = {}) {
    const results = {};
    const promises = [];

    for (const agent of this.agents) {
      const promise = this.analyzeWithStream(
        agent.name,
        userQuery,
        (chunk) => {
          if (callbacks[agent.name]) {
            callbacks[agent.name](chunk);
          }
        }
      )
        .then(response => {
          results[agent.name] = response;
        })
        .catch(error => {
          results[agent.name] = `错误: ${error.message}`;
          if (callbacks[`${agent.name}_error`]) {
            callbacks[`${agent.name}_error`](error);
          }
        });

      promises.push(promise);
    }

    await Promise.all(promises);
    return results;
  }

  /**
   * 用于测试的简单调用（不使用流式）
   */
  async testQuery(userQuery) {
    console.log('\n🧪 MAGI 代理系统测试');
    console.log('═'.repeat(50));
    console.log(`📝 查询: ${userQuery}\n`);

    const results = await this.analyzeAll(userQuery);

    for (const [agentName, response] of Object.entries(results)) {
      console.log(`\n🤖 ${agentName}:`);
      console.log('─'.repeat(50));
      console.log(response);
    }

    console.log('\n' + '═'.repeat(50));
    return results;
  }
}

/**
 * 创建全局代理实例
 */
export const agents = new MAGIAgents();

export default MAGIAgents;
