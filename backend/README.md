# MAGI 后端项目结构

## 📁 目录说明

### `/src` - 核心应用代码
- **server.js** - 主服务器入口（WebSocket、REST API）
- **ai-agents.js** - AI代理编排（BALTHASAR、CASPER、MELCHIOR）
- **debate-engine.js** - 三阶段辩论引擎（独立分析→相互评价→投票）
- **db.js** - SQLite数据库管理
- **config.js** - 全局配置（端口、数据库等）

### `/lib` - 核心库
- **model.js** - 模型调用统一入口（provider 配置、客户端创建、流式调用）

### `/config` - 配置文件
- **package.json** - NPM项目配置和依赖
- **package-lock.json** - 依赖版本锁定

### `/tools` - 工具和文档

#### `/tools/tests` - 测试工具集
- **test-agents.js** - 测试AI代理功能
- **test-chat-api.js** - 测试聊天API
- **test-quick.js** - 快速测试脚本
- **test-siliconflow.js** - 测试SiliconFlow API集成
- **test-three-phases.js** - 测试三阶段辩论流程
- **integration-test.js** - 完整集成测试
- **verify-system.js** - 系统验证脚本
- **verify-integration.js** - 集成验证脚本

### 根目录配置文件
- **.env** - 环境变量（本地）
- **.env.example** - 环境变量示例
- **.env.local** - 本地开发配置
- **.gitignore** - Git忽略配置
- **.secrets** - 密钥存储（不提交）
- **.secrets.example** - 密钥示例

### 数据文件
- **magi.db** - SQLite数据库文件
- **magi.db-shm** - 数据库共享内存
- **magi.db-wal** - 数据库预写日志

## 🚀 快速开始

### 安装依赖
```bash
cd backend
npm install
```

### 启动服务器
```bash
npm start
# 或使用 nodemon 自动重启
npm run dev
```

### 运行测试
```bash
# 快速测试
node tools/tests/test-quick.js

# 完整集成测试
node tools/tests/integration-test.js

# 验证系统
node tools/tests/verify-system.js
```

## 📋 API端点

### WebSocket
- `ws://localhost:3000/ws` - 实时通信

### REST API
- `POST /api/chat` - 发送问题
- `GET /api/history` - 获取历史记录
- `POST /api/vote` - 提交用户投票
- `GET /api/status` - 获取系统状态

## 🔐 环境变量配置

```bash
# API密钥
SILICONFLOW_API_KEY=your_key_here

# 模型配置
MODEL_NAME=deepseek-ai/DeepSeek-V3

# 数据库
DATABASE_PATH=./magi.db

# 端口
PORT=3000
```

## 📝 测试指南

### 测试AI代理
```bash
node tools/tests/test-agents.js
```

### 测试三阶段流程
```bash
node tools/tests/test-three-phases.js
```

### 测试SiliconFlow API
```bash
node tools/tests/test-siliconflow.js
```

### 完整系统验证
```bash
node tools/tests/verify-system.js
```

---

**最后更新**: 2026-04-16
**版本**: 1.0
