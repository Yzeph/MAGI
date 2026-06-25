/**
 * MAGI AI代理系统测试脚本
 * 测试三个独立代理的流式分析能力
 */

import { MAGIAgents } from '../../src/ai-agents.js';
import { config, validateConfig } from '../../src/config.js';

async function testAgentSystem() {
  try {
    // 验证配置
    console.log('🔧 验证配置...');
    validateConfig();
    console.log('✅ 配置验证通过\n');

    // 初始化agents
    console.log('🤖 初始化MAGI AI代理系统...');
    const agents = new MAGIAgents();
    console.log('✅ 代理系统初始化成功\n');

    // 显示可用代理
    const agentNames = agents.getAgentNames();
    console.log('📋 可用代理:');
    agentNames.forEach(name => {
      console.log(`   • ${name}`);
    });
    console.log();

    // 测试问题
    const testQuestions = [
      'AI在未来会取代人类吗?',
      '气候变化的主要原因是什么?',
      '什么是幸福?'
    ];

    // 选择第一个问题进行测试
    const question = testQuestions[0];
    console.log(`📝 测试问题: "${question}"\n`);

    // ======== 测试 1: 单个代理流式分析 ========
    console.log('📊 测试 1: 单个代理（BALTHASAR）流式分析');
    console.log('═'.repeat(50));

    let balthasarResponse = '';
    console.log('\n🤖 BALTHASAR 正在分析...\n');

    const balthasarChunks = await agents.analyzeWithStream(
      'BALTHASAR',
      question,
      (chunk) => {
        process.stdout.write(chunk);
        balthasarResponse += chunk;
      }
    );

    console.log('\n\n✅ BALTHASAR 分析完成');
    console.log(`   总长度: ${balthasarChunks.length} 字符\n`);

    // ======== 测试 2: 三代理并行分析 ========
    console.log('📊 测试 2: 三代理并行流式分析（全部响应）');
    console.log('═'.repeat(50));

    const allResults = await agents.analyzeAllWithStream(
      question,
      {
        BALTHASAR: (chunk) => {
          process.stdout.write(`[B] ${chunk}`);
        },
        CASPER: (chunk) => {
          process.stdout.write(`[C] ${chunk}`);
        },
        MELCHIOR: (chunk) => {
          process.stdout.write(`[M] ${chunk}`);
        }
      }
    );

    console.log('\n\n✅ 三代理分析完成\n');

    // 显示统计信息
    console.log('📈 分析结果统计:');
    console.log('─'.repeat(50));
    Object.entries(allResults).forEach(([agentName, response]) => {
      const length = response.length;
      const lines = response.split('\n').length;
      console.log(`${agentName}:`);
      console.log(`  • 长度: ${length} 字符`);
      console.log(`  • 行数: ${lines} 行`);
      console.log();
    });

    // ======== 测试 3: 代理系统信息 ========
    console.log('🔍 测试 3: 代理系统信息');
    console.log('═'.repeat(50));

    console.log('\n当前AI提供商配置:');
    console.log(`  • 提供商: ${config.ai.provider}`);
    console.log(`  • 模型: ${config.ai.model}`);
    console.log(`  • 数据库: ${config.dbPath}`);
    console.log(`  • 共识阈值: ${config.debate.consensusThreshold}%`);

    console.log('\n✅ 所有测试完成！\n');

    // 显示建议的下一步
    console.log('📋 后续步骤:');
    console.log('  1. 启动完整服务器: npm start');
    console.log('  2. 通过WebSocket连接到: ws://localhost:3000/ws');
    console.log('  3. 发送查询: {"type": "query", "question": "你的问题"}');
    console.log('  4. 接收实时流式响应\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
testAgentSystem();
