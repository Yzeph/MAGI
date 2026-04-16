#!/usr/bin/env node

/**
 * 快速验证三阶段系统 - 最小化测试
 * 用于快速验证系统是否正确集成
 */

import { DebateEngine } from './debate-engine.js';

class MockWebSocket {
  constructor() {
    this.readyState = 1;
    this.eventLog = { phase_start: 0, ai_stream: 0, phase_complete: 0 };
  }

  send(data) {
    const msg = JSON.parse(data);
    this.eventLog[msg.type] = (this.eventLog[msg.type] || 0) + 1;
  }
}

async function quickTest() {
  console.log(`
╔════════════════════════════════════════╗
║   MAGI Day 3 - 三阶段系统验证          ║
╚════════════════════════════════════════╝
  `);

  try {
    const mockWs = new MockWebSocket();
    const debateEngine = new DebateEngine();

    // 简短问题快速测试
    const question = '人工智能的核心优势是什么？';

    console.log('📝 快速测试问题:', question);
    console.log('⏱️  启动三阶段辩论...\n');

    const startTime = Date.now();
    const result = await debateEngine.runDebate(question, mockWs);
    const elapsed = (Date.now() - startTime) / 1000;

    console.log(`\n✅ 三阶段系统验证完成！(${elapsed.toFixed(1)}s)\n`);

    // 验证三个阶段的结果
    const checks = [
      { name: 'Phase 1 完成', pass: Object.keys(result.phases.phase1).length === 3 },
      { name: 'Phase 2 完成', pass: Object.keys(result.phases.phase2).length === 3 },
      { name: 'Phase 3 完成', pass: !!result.consensus && Object.keys(result.votes).length === 3 },
      { name: 'WebSocket事件', pass: mockWs.eventLog.phase_start >= 3 }
    ];

    console.log('🔍 验证结果:');
    let pass = 0;
    checks.forEach(c => {
      const icon = c.pass ? '✅' : '❌';
      console.log(`  ${icon} ${c.name}`);
      if (c.pass) pass++;
    });

    if (pass === checks.length) {
      console.log(`\n🎉 所有验证通过！三阶段系统已集成成功\n`);
    }
  } catch (err) {
    console.error('❌ 验证失败:', err.message);
    process.exit(1);
  }
}

quickTest();
