<template>
  <div class="ai-window" :style="{ borderColor: color, boxShadow: `inset 0 0 40px ${color}1a, 0 0 15px ${color}33` }">
    <!-- Window Header -->
    <div class="window-header" :style="{ borderBottom: `2px solid ${color}`, background: `linear-gradient(90deg, ${color}33 0%, transparent 100%)` }">
      <div class="header-title">
        <span class="status-light" :style="{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }"></span>
        <div class="title-text">
          <div class="ai-name" :style="{ color: color, textShadow: `0 0 8px ${color}80` }">{{ name }}</div>
          <div class="ai-title" :style="{ color: color }">{{ title }}</div>
        </div>
      </div>
      <div class="vote-indicator" v-if="vote !== null">
        <span :class="vote ? 'vote-yes' : 'vote-no'">
          {{ vote ? '【承認】' : '【否決】' }}
        </span>
      </div>
      <div class="vote-indicator" v-else>
        <span class="vote-pending" :style="{ color: color }">【分析中】</span>
      </div>
    </div>

    <!-- Window Content -->
    <div class="window-content" :style="{ scrollbarColor: `${color} transparent` }">
      <!-- Phase 1 内容 -->
      <div v-if="phase1" class="phase-section">
        <div class="phase-label" :style="{ color: color, borderBottom: `1px dashed ${color}80` }">
          <span class="phase-icon">▶</span> PHASE 1: 独立分析 [INDEPENDENT_THOUGHT]
        </div>
        <div class="phase-content-wrapper">
          <AnimatedMarkdownText :text="phase1" :speed="15" class="phase-content" :style="{ color: color }" />
        </div>
      </div>

      <!-- Phase 2 内容 -->
      <div v-if="phase2" class="phase-section">
        <div class="phase-label" :style="{ color: color, borderBottom: `1px dashed ${color}80` }">
          <span class="phase-icon">▶</span> PHASE 2: 相互评价 [CROSS_EVALUATION]
        </div>
        <div class="phase-content-wrapper">
          <AnimatedMarkdownText :text="phase2" :speed="15" class="phase-content" :style="{ color: color }" />
        </div>
      </div>

      <!-- 空状态或加载状态 -->
      <div v-if="!phase1 && !phase2" class="empty-state">
        <div class="loading-container">
          <span class="loading-box" :style="{ borderColor: color }">
            <span v-if="isLoading" class="loading-bar" :style="{ backgroundColor: color }"></span>
          </span>
          <span class="empty-text" :style="{ color: color }">
            {{ isLoading ? 'AWAITING_DATA_STREAM...' : 'STANDBY...' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AnimatedMarkdownText from './AnimatedMarkdownText.vue'

defineProps({
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  phase1: {
    type: String,
    default: ''
  },
  phase2: {
    type: String,
    default: ''
  },
  vote: {
    type: [Boolean, null],
    default: null
  },
  isLoading: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>

.ai-window {
  display: flex;
  flex-direction: column;
  border: 2px solid;
  background: rgba(5, 5, 5, 0.85); /* 深色近黑背景 */
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* scanline 扫描线效果 */
.ai-window::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(255,255,255,0),
    rgba(255,255,255,0) 50%,
    rgba(0,0,0,0.1) 50%,
    rgba(0,0,0,0.1)
  );
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 10;
}

.window-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  position: relative;
  z-index: 11;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.status-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse-light 1.5s infinite;
}

@keyframes pulse-light {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ai-name {
  font-family: var(--font-mono);
  font-weight: bold;
  font-size: 20px;
  letter-spacing: 3px;
}

.ai-title {
  font-family: var(--font-mono);
  font-size: 12px;
  opacity: 0.8;
  letter-spacing: 1px;
}

.vote-indicator {
  font-family: var(--font-mono);
  font-weight: bold;
  font-size: 16px;
  letter-spacing: 2px;
}

.vote-yes {
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.6);
}

.vote-no {
  color: #ff0055;
  text-shadow: 0 0 10px rgba(255, 0, 85, 0.6);
}

.vote-pending {
  opacity: 0.7;
  animation: blink 1.5s infinite;
}

/* 窗口内容区 */
.window-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  position: relative;
  z-index: 11;
}

.phase-section {
  display: flex;
  flex-direction: column;
}

.phase-label {
  font-family: var(--font-mono);
  font-weight: bold;
  font-size: 14px;
  letter-spacing: 1px;
  padding-bottom: 8px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  opacity: 0.9;
}

.phase-icon {
  margin-right: 8px;
  font-size: 12px;
}

.phase-content-wrapper {
  padding: 10px 15px;
  background: rgba(0, 0, 0, 0.4);
  border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.phase-content {
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
  opacity: 0.9;
}

/* 深层覆盖 markdown-renderer 颜色 */
.phase-content :deep(*) {
  color: inherit !important;
}

/* 空状态加载 */
.empty-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.loading-box {
  width: 150px;
  height: 8px;
  border: 1px solid;
  padding: 2px;
  display: block;
  overflow: hidden;
  position: relative;
}

.loading-bar {
  height: 100%;
  display: block;
  width: 0%;
  animation: loading-bar-anim 2s ease-in-out infinite;
}

@keyframes loading-bar-anim {
  0% { width: 0%; }
  50% { width: 100%; }
  100% { width: 0%; transform: translateX(150px); opacity: 0; }
}

.empty-text {
  font-family: var(--font-mono);
  font-size: 14px;
  letter-spacing: 2px;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 滚动条定制 */
.window-content::-webkit-scrollbar {
  width: 6px;
}
.window-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}
.window-content::-webkit-scrollbar-thumb {
  background: currentColor;
  opacity: 0.5;
}
</style>
