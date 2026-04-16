#!/bin/bash

# MAGI 启动脚本 (Linux/macOS 兼容)
# 本脚本用于在 Linux 或 macOS 系统下一键安装依赖并启动后端与前端服务。

echo "==========================================="
echo "       启动 MAGI 超级计算机系统        "
echo "==========================================="

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null
then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js (推荐 v18+)"
    echo "Linux 安装参考: sudo apt install nodejs npm 或使用 nvm 安装"
    exit 1
fi

# 检查构建工具（better-sqlite3 如果没有预编译包可能需要）
if ! command -v make &> /dev/null || ! command -v g++ &> /dev/null || ! command -v python3 &> /dev/null
then
    echo "⚠️ 警告: 您的系统可能缺少 C++ 构建工具或 Python3。"
    echo "这可能会导致 backend 模块 (即 better-sqlite3) 安装失败。"
    echo "如果稍后安装出错，请在 Linux 终端执行: sudo apt-get update && sudo apt-get install -y build-essential python3"
fi

# ==========================================
# 1. 启动后端
# ==========================================
echo ""
echo "[1/2] 正在准备后端服务..."
cd backend || exit 1

if [ ! -d "node_modules" ]; then
    echo "-> 首次运行，正在安装后端依赖..."
    npm install
fi

echo "-> 启动后端服务 (后台运行)..."
# 使用 nohup 放入后台运行，日志输出到 backend.log
nohup npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端已在后台启动 (PID: $BACKEND_PID)"
cd ..

# ==========================================
# 2. 启动前端
# ==========================================
echo ""
echo "[2/2] 正在准备前端服务..."
cd frontend || exit 1

if [ ! -d "node_modules" ]; then
    echo "-> 首次运行，正在安装前端依赖..."
    npm install
fi

echo "-> 启动前端界面..."
# 前端在前台运行显示，以便停止终端时可感知
npm run dev

# 当停止前端（Ctrl+C）时清理后端进程
trap "echo '正在关闭 MAGI...' && kill $BACKEND_PID && exit" INT TERM
