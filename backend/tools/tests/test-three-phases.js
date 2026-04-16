#!/usr/bin/env node

/**
 * 测试完整的三阶段辩论引擎
 * 验证Phase 1、Phase 2、Phase 3是否正常工作
 */

import { DebateEngine } from '../../src/debate-engine.js';
import { MAGIAgents } from '../../src/ai-agents.js';

class MockWebSocket {
  constructor() {
    this.readyState = 1; // OPEN
    this.messages = [];
  }

  send(data) {
    const message = JSON.parse(data);
    this.messages.push(message);
  }
}

async function testThreePhases() {
  console.log(`
╔════════════════════════════════════════╗
║   MAGI 三阶段辩论引擎测试开始          ║
╚════════════════════════════════════════╝
  `);

  try {
    // 检查AI代理是否正确初始化
    console.log('🔍 检查AI代理系统...');
    const agents = new MAGIAgents();
    const agentNames = agents.getAgentNames();
    console.log(`✅ 检测到 ${agentNames.length} 个AI代理:`, agentNames.join(', '));

    // 创建模拟WebSocket
    const mockWs = new MockWebSocket();

    // 创建辩论引擎
    console.log('\n🔨 初始化辩论引擎...');
    const debateEngine = new DebateEngine();
    console.log('✅ 辩论引擎初始化成功');

    // 准备测试问题
    const testQuestion = '人工智能在未来会对人类社会产生什么样的影响？';
    console.log(`\n📝 测试问题: ${testQuestion}\n`);

    // 运行三阶段辩论
    console.log('🚀 启动三阶段辩论引擎...\n');
    const startTime = Date.now();
    const result = await debateEngine.runDebate(testQuestion, mockWs);
    const elapsedTime = Date.now() - startTime;

    // 验证结果
    console.log(`\n📊 三阶段辩论完成 (耗时: ${(elapsedTime / 1000).toFixed(1)}s)\n`);

    // Phase 1 结果
    console.log('═══════════════════════════════════════');
    console.log('📍 Phase 1: 独立分析');
    console.log('═══════════════════════════════════════');
    Object.entries(result.phases.phase1).forEach(([ai, content]) => {
      console.log(`\n${ai}:`);
      console.log(`  字符数: ${content.length}`);
      console.log(`  摘要: ${content.substring(0, 100)}...`);
    });

    // Phase 2 结果
    console.log('\n═══════════════════════════════════════');
    console.log('📍 Phase 2: 相互评价');
    console.log('═══════════════════════════════════════');
    Object.entries(result.phases.phase2).forEach(([ai, content]) => {
      console.log(`\n${ai} 的评价:`);
      console.log(`  字符数: ${content.length}`);
      console.log(`  摘要: ${content.substring(0, 100)}...`);
    });

    // Phase 3 结果
    console.log('\n═══════════════════════════════════════');
    console.log('📍 Phase 3: 共识形成和投票');
    console.log('═══════════════════════════════════════');
    console.log('\n📌 最终共识:');
    console.log(`  ${result.consensus.substring(0, 150)}...`);

    console.log('\n🗳️ 投票结果:');
    Object.entries(result.votes).forEach(([ai, vote]) => {
      const voteStr = vote === true ? '✅ 同意' : (vote === false ? '❌ 不同意' : '⚪ 中立');
      console.log(`  ${ai}: ${voteStr}`);
    });

    // WebSocket 事件统计
    console.log('\n═══════════════════════════════════════');
    console.log('📡 WebSocket 事件统计');
    console.log('═══════════════════════════════════════');
    const eventTypes = {};
    mockWs.messages.forEach(msg => {
      eventTypes[msg.type] = (eventTypes[msg.type] || 0) + 1;
    });

    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} 条`);
    });

    // 总体统计
    console.log('\n═══════════════════════════════════════');
    console.log('📈 整体统计');
    console.log('═══════════════════════════════════════');
    console.log(`  总WebSocket消息数: ${mockWs.messages.length}`);
    console.log(`  对话ID: ${result.conversationId}`);
    console.log(`  时间戳: ${result.timestamp}`);

    // 验证完整性
    console.log('\n═══════════════════════════════════════');
    console.log('✅ 验证结果');
    console.log('═══════════════════════════════════════');

    const checks = [
      { name: 'Phase 1 结果存在', pass: Object.keys(result.phases.phase1).length === 3 },
      { name: 'Phase 2 结果存在', pass: Object.keys(result.phases.phase2).length === 3 },
      { name: 'Phase 3 共识存在', pass: !!result.consensus },
      { name: '投票结果存在', pass: Object.keys(result.votes).length === 3 },
      { name: 'WebSocket事件有效', pass: mockWs.messages.length > 0 },
      { name: '对话ID有效', pass: result.conversationId && result.conversationId.length > 0 }
    ];

    let passCount = 0;
    checks.forEach(check => {
      const icon = check.pass ? '✅' : '❌';
      console.log(`  ${icon} ${check.name}`);
      if (check.pass) passCount++;
    });

    console.log(`\n📊 通过率: ${passCount}/${checks.length} (${Math.round(passCount / checks.length * 100)}%)\n`);

    if (passCount === checks.length) {
      console.log('🎉 所有测试通过！三阶段系统完整运行成功！\n');
    } else {
      console.log('⚠️ 部分测试未通过，请检查日志\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('\n堆栈跟踪:');
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
testThreePhases();
