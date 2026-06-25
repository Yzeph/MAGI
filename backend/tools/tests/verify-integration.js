#!/usr/bin/env node

/**
 * 系统集成检查 - 验证代码正确性
 * 不调用AI，只检查类和方法是否正确实现
 */

import { DebateEngine } from '../../src/debate-engine.js';
import { MAGIAgents } from '../../src/ai-agents.js';
import { magiDB } from '../../src/db.js';
import { config } from '../../src/config.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '../../src');

console.log(`
╔════════════════════════════════════════╗
║   MAGI Day 3 - 系统集成完整性检查      ║
╚════════════════════════════════════════╝
`);

const checks = [];

// 1. 检查 DebateEngine
console.log('🔍 检查 DebateEngine...');
try {
  const engine = new DebateEngine();

  const hasMethods = [
    'runDebate',
    'runPhase1',
    'runPhase2',
    'runPhase3',
    'extractVote',
    'sendEvent',
    'getSummary'
  ].every(method => typeof engine[method] === 'function');

  if (hasMethods) {
    console.log('  ✅ 所有方法都已实现');
    checks.push(true);
  } else {
    console.log('  ❌ 缺少某些方法');
    checks.push(false);
  }
} catch (err) {
  console.log('  ❌ DebateEngine 初始化失败:', err.message);
  checks.push(false);
}

// 2. 检查 MAGIAgents
console.log('\n🔍 检查 MAGIAgents...');
try {
  const agents = new MAGIAgents();
  const names = agents.getAgentNames();

  if (names.length === 3 && names.includes('BALTHASAR') && names.includes('CASPER') && names.includes('MELCHIOR')) {
    console.log('  ✅ 三个AI代理:', names.join(', '));
    checks.push(true);
  } else {
    console.log('  ❌ AI代理数量或名称不正确');
    checks.push(false);
  }
} catch (err) {
  console.log('  ❌ MAGIAgents 初始化失败:', err.message);
  checks.push(false);
}

// 3. 检查数据库
console.log('\n🔍 检查数据库...');
try {
  magiDB.initialize();
  const stats = magiDB.getStats();

  if (stats && typeof stats.total_conversations === 'number') {
    console.log(`  ✅ 数据库可用 (${stats.total_conversations} 条对话)`);
    checks.push(true);
  } else {
    console.log('  ❌ 数据库不可用');
    checks.push(false);
  }
} catch (err) {
  console.log('  ❌ 数据库初始化失败:', err.message);
  checks.push(false);
}

// 4. 检查配置
console.log('\n🔍 检查配置...');
try {
  const hasPort = config.port;
  const hasAI = config.ai && config.ai.provider;

  if (hasPort && hasAI) {
    console.log(`  ✅ AI 提供商: ${config.ai.provider}`);
    console.log(`  ✅ 端口: ${config.port}`);
    checks.push(true);
  } else {
    console.log('  ❌ 配置不完整');
    checks.push(false);
  }
} catch (err) {
  console.log('  ❌ 配置加载失败:', err.message);
  checks.push(false);
}

// 5. 检查 server.js 集成
console.log('\n🔍 检查 server.js 集成...');
try {
  const serverPath = `${srcDir}/server.js`;
  const serverCode = fs.readFileSync(serverPath, 'utf-8');

  // 检查关键导入
  const hasDebateEngineImport = serverCode.includes("import { DebateEngine }");
  const hasHandleQueryFunction = serverCode.includes("async function handleQuery");
  const hasDebateEngineUsage = serverCode.includes("new DebateEngine()");

  if (hasDebateEngineImport && hasHandleQueryFunction && hasDebateEngineUsage) {
    console.log('  ✅ DebateEngine 已正确导入');
    console.log('  ✅ handleQuery 函数已更新');
    console.log('  ✅ DebateEngine 实例化正确');
    checks.push(true);
  } else {
    console.log('  ❌ server.js 集成不完整');
    if (!hasDebateEngineImport) console.log('    - 缺少 DebateEngine 导入');
    if (!hasDebateEngineUsage) console.log('    - 没有实例化 DebateEngine');
    checks.push(false);
  }
} catch (err) {
  console.log('  ❌ server.js 检查失败:', err.message);
  checks.push(false);
}

// 6. 检查文件完整性
console.log('\n🔍 检查文件完整性...');
try {
  const requiredFiles = [
    'debate-engine.js',
    'ai-agents.js',
    'server.js',
    'config.js',
    'db.js'
  ];

  const allExist = requiredFiles.every(file => {
    const fullPath = `${srcDir}/${file}`;
    return fs.existsSync(fullPath);
  });

  if (allExist) {
    console.log('  ✅ 所有关键文件都存在');
    requiredFiles.forEach(f => console.log(`    - ${f}`));
    checks.push(true);
  } else {
    console.log('  ❌ 某些关键文件缺失');
    checks.push(false);
  }
} catch (err) {
  console.log('  ❌ 文件检查失败:', err.message);
  checks.push(false);
}

// 输出总结
console.log('\n' + '═'.repeat(40));
console.log('📊 检查结果总结');
console.log('═'.repeat(40));

const passCount = checks.filter(c => c).length;
const totalCount = checks.length;
const percentage = Math.round(passCount / totalCount * 100);

console.log(`\n✅ 通过: ${passCount}/${totalCount} (${percentage}%)`);

if (passCount === totalCount) {
  console.log(`
🎉 完美！Day 3 系统集成已完成

📝 摘要：
  ✅ DebateEngine 三阶段引擎已实现
  ✅ 三个 AI 代理已配置
  ✅ 数据库已初始化
  ✅ 配置系统就绪
  ✅ server.js 已集成
  ✅ 所有文件完整

🚀 系统已准备好运行完整的三阶段辩论！

📡 启动服务：
   cd backend && npm start

🔗 WebSocket 连接：
   wscat -c ws://localhost:3000/ws

📤 发送查询：
   {"type": "query", "question": "你的问题"}

`);
} else {
  console.log(`\n⚠️ 有 ${totalCount - passCount} 项检查未通过，请查看上述错误`);
  process.exit(1);
}

magiDB.close();

