#!/usr/bin/env node
/**
 * MAGI 完整集成测试套件
 * 测试所有功能：WebSocket连接、查询提交、AI流式输出、投票、历史记录
 */

import WebSocket from 'ws';

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/ws';

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function testPass(name) {
  testResults.total++;
  testResults.passed++;
  testResults.tests.push({ name, status: 'PASS' });
  log(`✅ ${name}`, 'green');
}

function testFail(name, error) {
  testResults.total++;
  testResults.failed++;
  testResults.tests.push({ name, status: 'FAIL', error: error.toString() });
  log(`❌ ${name}`, 'red');
  log(`   Error: ${error}`, 'red');
}

function testSkip(name, reason) {
  testResults.total++;
  testResults.tests.push({ name, status: 'SKIP', reason });
  log(`⏭️  ${name} (${reason})`, 'yellow');
}

// ============ 测试 1: 健康检查 ============

async function testHealthCheck() {
  const testName = 'Test 1: Health Check (GET /health)';
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();

    if (response.ok && data.status === 'ok') {
      testPass(testName);
    } else {
      testFail(testName, new Error(`Invalid response: ${JSON.stringify(data)}`));
    }
  } catch (error) {
    testFail(testName, error);
  }
}

// ============ 测试 2: API 信息端点 ============

async function testAPIInfo() {
  const testName = 'Test 2: API Info (GET /api/info)';
  try {
    const response = await fetch(`${BASE_URL}/api/info`);
    const data = await response.json();

    if (response.ok && data.app && data.version) {
      testPass(testName);
    } else {
      testFail(testName, new Error('Missing required fields'));
    }
  } catch (error) {
    testFail(testName, error);
  }
}

// ============ 测试 3: WebSocket 连接 ============

async function testWebSocketConnection() {
  const testName = 'Test 3: WebSocket Connection';

  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_URL);
      let connected = false;
      let receivedWelcome = false;

      ws.onopen = () => {
        connected = true;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'system_message' && data.message.includes('MAGI')) {
            receivedWelcome = true;
          }
        } catch (e) {
          // 忽略解析错误
        }
      };

      ws.onerror = (error) => {
        testFail(testName, error);
        resolve();
      };

      // 等待连接和欢迎消息
      setTimeout(() => {
        if (connected && receivedWelcome) {
          testPass(testName);
        } else if (connected && !receivedWelcome) {
          testFail(testName, new Error('No welcome message received'));
        } else {
          testFail(testName, new Error('WebSocket connection failed'));
        }
        ws.close();
        resolve();
      }, 1000);
    } catch (error) {
      testFail(testName, error);
      resolve();
    }
  });
}

// ============ 测试 4: WebSocket 查询和流式输出 ============

async function testWebSocketQuery() {
  const testName = 'Test 4: WebSocket Query with Streaming Output';

  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_URL);
      let phaseStarted = false;
      let aiStreamReceived = false;
      let conversationComplete = false;
      const phaseStatuses = { 1: false, 2: false, 3: false };

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'query',
          question: '什么是人工智能？'
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'phase_start') {
            phaseStarted = true;
            phaseStatuses[data.phase] = true;
          }

          if (data.type === 'ai_stream') {
            aiStreamReceived = true;
          }

          if (data.type === 'conversation_complete') {
            conversationComplete = true;
            clearTimeout(timeout);

            if (phaseStarted && aiStreamReceived && conversationComplete &&
                phaseStatuses[1] && phaseStatuses[2] && phaseStatuses[3]) {
              testPass(testName);
            } else {
              testFail(testName, new Error('Incomplete conversation flow'));
            }

            ws.close();
            resolve();
          }
        } catch (e) {
          // 忽略解析错误
        }
      };

      ws.onerror = (error) => {
        testFail(testName, error);
        resolve();
      };

      // 超时处理（60秒）
      const timeout = setTimeout(() => {
        testFail(testName, new Error('WebSocket query timeout'));
        ws.close();
        resolve();
      }, 60000);
    } catch (error) {
      testFail(testName, error);
      resolve();
    }
  });
}

// ============ 测试 5: HTTP 查询端点 ============

async function testHTTPQuery() {
  const testName = 'Test 5: HTTP Query (POST /api/query)';
  try {
    const response = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '人工智能有意识吗？' })
    });

    const data = await response.json();

    if (response.ok && data.success && data.data && data.data.conversationId) {
      testPass(testName);
      return data.data.conversationId;
    } else {
      testFail(testName, new Error(`Invalid response: ${JSON.stringify(data)}`));
      return null;
    }
  } catch (error) {
    testFail(testName, error);
    return null;
  }
}

// ============ 测试 6: 获取历史记录 ============

async function testGetHistory() {
  const testName = 'Test 6: Get History (GET /api/history)';
  try {
    const response = await fetch(`${BASE_URL}/api/history?limit=10&offset=0`);
    const data = await response.json();

    if (response.ok && data.success && Array.isArray(data.data)) {
      testPass(testName);
    } else {
      testFail(testName, new Error('Invalid history response'));
    }
  } catch (error) {
    testFail(testName, error);
  }
}

// ============ 测试 7: 获取单个对话详情 ============

async function testGetConversation(conversationId) {
  if (!conversationId) {
    testSkip('Test 7: Get Conversation Detail (GET /api/conversation/:id)', 'No conversation ID available');
    return;
  }

  const testName = 'Test 7: Get Conversation Detail (GET /api/conversation/:id)';
  try {
    const response = await fetch(`${BASE_URL}/api/conversation/${conversationId}`);
    const data = await response.json();

    if (response.ok && data.success && data.data && data.data.question) {
      testPass(testName);
    } else {
      testFail(testName, new Error('Invalid conversation response'));
    }
  } catch (error) {
    testFail(testName, error);
  }
}

// ============ 测试 8: 提交投票 ============

async function testVote(conversationId) {
  if (!conversationId) {
    testSkip('Test 8: Submit Vote (POST /api/vote)', 'No conversation ID available');
    return;
  }

  const testName = 'Test 8: Submit Vote (POST /api/vote)';
  try {
    const response = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        userId: `test_user_${Date.now()}`,
        voteChoice: true
      })
    });

    const data = await response.json();

    if (response.ok && data.success && data.data) {
      testPass(testName);
    } else {
      testFail(testName, new Error('Vote submission failed'));
    }
  } catch (error) {
    testFail(testName, error);
  }
}

// ============ 测试 9: 获取投票统计 ============

async function testGetVotes(conversationId) {
  if (!conversationId) {
    testSkip('Test 9: Get Vote Statistics (GET /api/vote/:conversationId)', 'No conversation ID available');
    return;
  }

  const testName = 'Test 9: Get Vote Statistics (GET /api/vote/:conversationId)';
  try {
    const response = await fetch(`${BASE_URL}/api/vote/${conversationId}`);
    const data = await response.json();

    if (response.ok && data.success && data.data) {
      testPass(testName);
    } else {
      testFail(testName, new Error('Vote statistics retrieval failed'));
    }
  } catch (error) {
    testFail(testName, error);
  }
}

// ============ 测试 10: 系统统计 ============

async function testStats() {
  const testName = 'Test 10: System Statistics (GET /api/stats)';
  try {
    const response = await fetch(`${BASE_URL}/api/stats`);
    const data = await response.json();

    if (response.ok && data.success && data.data) {
      testPass(testName);
    } else {
      testFail(testName, new Error('Statistics retrieval failed'));
    }
  } catch (error) {
    testFail(testName, error);
  }
}

// ============ 主测试函数 ============

async function runAllTests() {
  log('\n╔════════════════════════════════════════════╗', 'bold');
  log('║    MAGI 完整集成测试套件 - Day 7 & 8     ║', 'bold');
  log('╚════════════════════════════════════════════╝\n', 'bold');

  log('💡 确保后端服务运行在 localhost:3000\n', 'cyan');

  // 基础HTTP测试
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('第1部分: 基础HTTP API测试', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  await testHealthCheck();
  await testAPIInfo();

  // WebSocket测试
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('第2部分: WebSocket实时通信测试', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  await testWebSocketConnection();
  await testWebSocketQuery();

  // HTTP查询测试
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('第3部分: HTTP查询和数据库测试', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  const conversationId = await testHTTPQuery();
  await testGetHistory();

  // 对话详情和投票测试
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('第4部分: 对话和投票功能测试', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  await testGetConversation(conversationId);
  await testVote(conversationId);
  await testGetVotes(conversationId);

  // 系统统计测试
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('第5部分: 系统监控测试', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  await testStats();

  // 生成报告
  log('\n╔════════════════════════════════════════════╗', 'bold');
  log('║            测试结果总结                    ║', 'bold');
  log('╚════════════════════════════════════════════╝\n', 'bold');

  log(`总测试数: ${testResults.total}`, 'cyan');
  log(`通过: ${testResults.passed}`, 'green');
  log(`失败: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');

  if (testResults.failed === 0) {
    log(`\n✅ 所有测试都通过了！`, 'green');
  } else {
    log(`\n❌ 有 ${testResults.failed} 个测试失败`, 'red');
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('详细测试报告:', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  testResults.tests.forEach((test, index) => {
    const statusColor = test.status === 'PASS' ? 'green' : test.status === 'FAIL' ? 'red' : 'yellow';
    log(`${index + 1}. [${test.status}] ${test.name}`, statusColor);
    if (test.error) {
      log(`   → ${test.error}`, 'red');
    }
    if (test.reason) {
      log(`   → ${test.reason}`, 'yellow');
    }
  });

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  // 测试成功标记
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// 运行所有测试
runAllTests().catch((error) => {
  log(`\n❌ 测试执行出错: ${error.message}`, 'red');
  process.exit(1);
});
