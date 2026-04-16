<template>
  <div class="system-status">
    <div class="status-card">
      <div class="card-title">系统状态</div>
      <div class="status-item">
        <span class="label">连接状态</span>
        <span :class="['value', wsStatus]">
          {{ wsStatus === 'connected' ? '✓ 已连接' : '✗ 未连接' }}
        </span>
      </div>
      <div class="status-item">
        <span class="label">查询次数</span>
        <span class="value">{{ queryCount }}</span>
      </div>
    </div>

    <div class="status-card">
      <div class="card-title">AI 代理</div>
      <div class="ai-list">
        <div v-for="ai in aiStatus" :key="ai.name" class="ai-item">
          <span class="ai-dot" :style="{ backgroundColor: ai.color }"></span>
          <span class="ai-name">{{ ai.name }}</span>
          <span class="ai-status">{{ ai.status }}</span>
        </div>
      </div>
    </div>

    <div class="status-card">
      <div class="card-title">快速操作</div>
      <button class="action-btn" @click="$emit('show-history')">📜 历史记录</button>
      <button class="action-btn" @click="$emit('show-stats')">📊 统计信息</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  queryCount: {
    type: Number,
    default: 0
  },
  wsStatus: {
    type: String,
    default: 'disconnected'
  }
})

defineEmits(['show-history', 'show-stats'])

const aiStatus = [
  { name: 'BALTHASAR', color: '#00e5ff', status: '就绪' },
  { name: 'CASPER', color: '#ff00ff', status: '就绪' },
  { name: 'MELCHIOR', color: '#ffaa00', status: '就绪' }
]
</script>

<style scoped>
.system-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.status-card {
  border: 1px solid var(--neon-cyan);
  border-radius: 4px;
  padding: 12px;
  background: rgba(0, 229, 255, 0.05);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.1);
}

.card-title {
  color: var(--neon-cyan);
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--neon-cyan);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  margin-bottom: 6px;
  padding: 4px 0;
}

.status-item:last-child {
  margin-bottom: 0;
}

.label {
  color: rgba(0, 255, 136, 0.7);
}

.value {
  color: var(--neon-green);
  font-weight: bold;
  text-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
}

.value.connected {
  color: var(--neon-green);
}

.value.disconnected {
  color: var(--neon-red);
}

/* AI 列表 */
.ai-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 4px 0;
}

.ai-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-shadow: 0 0 5px currentColor;
}

.ai-name {
  color: var(--neon-green);
  font-weight: bold;
  min-width: 70px;
}

.ai-status {
  color: rgba(0, 255, 136, 0.6);
  font-size: 10px;
  margin-left: auto;
}

/* 快速操作按钮 */
.action-btn {
  width: 100%;
  padding: 6px 8px;
  margin-bottom: 6px;
  border: 1px solid var(--neon-cyan);
  background: rgba(0, 229, 255, 0.1);
  color: var(--neon-cyan);
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-btn:hover {
  background: rgba(0, 229, 255, 0.2);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn:last-child {
  margin-bottom: 0;
}
</style>
