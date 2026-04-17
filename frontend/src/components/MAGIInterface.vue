
<template>
  <div class="magi-interface-v2">
    <div class="magi-outer-border">
      <div class="magi-inner-border">
        
        <!-- Header Section -->
        <div class="magi-header">
          <!-- Left Text "提訴" and Control Buttons -->
          <div class="header-left">
            <div class="cyan-line"></div>
            <div class="header-title">提訴</div>
            <div class="cyan-line"></div>
            
            <!-- Restored Control Buttons -->
            <div class="panel-controls">
              <button
                class="control-btn"
                @click="showHistory = !showHistory"
                :class="{ active: showHistory }"
                title="打开历史记录面板"
              >
                 历史
              </button>
              <button
                class="control-btn"
                @click="showAiWindows = !showAiWindows"
                :class="{ active: showAiWindows }"
                title="显示AI分析详情"
              >
                 AI回答
              </button>
            </div>
          </div>
          
          <!-- Central Input Area -->
          <div class="header-space">
            <div class="global-input-wrapper">
              <QuestionInput @submit="handleQuery" :loading="isQuerying" />
            </div>
          </div>

          <!-- Right Text "決議" -->
          <div class="header-right">
            <div class="cyan-line"></div>
            <div class="header-title">決議</div>
            <div class="cyan-line"></div>
            <div class="status-box-container">
              <div class="status-box">
                <span v-if="currentConversation && !currentVote">審議中</span>
                <span v-else-if="currentVote">終結</span>
                <span v-else>待機中</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Center Panels Section -->
        <div class="magi-panels">
          <div class="panels-container">
            <!-- Top Shape Panel -->
            <div class="panel-box panel-top" :class="{ 'resolving-flash-1': currentPhase === 3 }">
              <svg class="panel-svg" viewBox="0 0 450 300" preserveAspectRatio="none">
                <polygon points="2,2 448,2 448,250 400,298 50,298 2,250" class="panel-polygon" />
              </svg>
              <div class="panel-inner-content">
                <div class="panel-label">MELCHIOR - 1</div>
                <div class="ai-output" v-if="currentPhase1?.MELCHIOR">
                  {{ currentPhase1.MELCHIOR }}
                </div>
              </div>
            </div>

            <!-- Bottom Row Panels -->
            <div class="panels-bottom-row">
              <!-- Bottom Left (BALTHASAR) -->
              <div class="panel-box panel-bl" :class="{ 'resolving-flash-2': currentPhase === 3 }">
                <svg class="panel-svg" viewBox="0 0 400 250" preserveAspectRatio="none">
                  <!-- Start TopLeft -> TopRight(flat) -> Slant -> BottomRight -> BottomLeft -->
                  <polygon points="2,2 350,2 398,50 398,248 2,248" class="panel-polygon" />
                </svg>
                <div class="panel-inner-content">
                  <div class="panel-label">BALTHASAR - 2</div>
                  <div class="ai-output" v-if="currentPhase1?.BALTHASAR">
                    {{ currentPhase1.BALTHASAR }}
                  </div>
                </div>
              </div>

              <!-- Connecting visual Y shapes -->
              <div class="connections-wrapper">
                <div class="y-line y-left"></div>
                <div class="y-line y-right"></div>
                <div class="y-line y-bottom"></div>
                <div class="y-h-line-left"></div>
                <div class="y-h-line-right"></div>
                <div class="magi-logo-text">MAGI</div>
              </div>

              <!-- Bottom Right (CASPER) -->
              <div class="panel-box panel-br" :class="{ 'resolving-flash-3': currentPhase === 3 }">
                <svg class="panel-svg" viewBox="0 0 400 250" preserveAspectRatio="none">
                  <!-- Start TopLeft(slant) -> TopRight -> BottomRight -> BottomLeft -> Slant -->
                  <polygon points="50,2 398,2 398,248 2,248 2,50" class="panel-polygon" />
                </svg>
                <div class="panel-inner-content">
                  <div class="panel-label">CASPER - 3</div>
                  <div class="ai-output" v-if="currentPhase1?.CASPER">
                    {{ currentPhase1.CASPER }}
                  </div>
                </div>
              </div>
            </div> <!-- end bottom row -->

          </div>
        </div> 
        
      </div> 
    </div> 

    <!-- AI 回答详情窗口面板（点击按钮显示） -->
    <div v-if="showAiWindows" class="ai-windows-overlay">
      <div class="ai-windows-content">
        <button class="close-btn" @click="showAiWindows = false" title="关闭">✕</button>
        <div class="windows-grid">
          <div v-for="ai in aiAgents" :key="ai.name" class="ai-window-container">
            <AIWindow
              :name="ai.name"
              :title="ai.title"
              :color="ai.color"
              :phase1="currentPhase1 ? currentPhase1[ai.name] : ''"
              :phase2="currentPhase2 ? currentPhase2[ai.name] : ''"
              :vote="currentVote ? currentVote[ai.name] : null"
              :isLoading="isQuerying && !currentPhase1?.[ai.name]"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录面板（点击按钮显示） -->
    <div v-if="showHistory" class="history-overlay">
      <div class="history-content">
        <button class="close-btn history-close" @click="showHistory = false" title="关闭">✕</button>
        <HistoryPanel @close="showHistory = false" />
      </div>
    </div>


    <!-- 最终决议结果展示弹出窗口 -->
    <div v-if="showResult" class="result-overlay">
      <div class="result-content magi-panel-shadow">
        <button class="close-btn result-close" @click="showResult = false" title="关闭">✕</button>
        <div class="result-header">
          <div class="cyan-line"></div>
          <div class="result-title">FINAL RESOLUTION</div>
          <div class="cyan-line"></div>
        </div>
        <div class="result-process">
          <div class="process-title">PHASE 3 共识形成</div>

          <div class="process-sides">
            <div class="process-card">
              <div class="process-agent">BALTHASAR</div>
              <div class="process-content">
                <AnimatedMarkdownText :text="phase3ByAgent.BALTHASAR" :speed="12" />
              </div>
            </div>
            <div class="process-card">
              <div class="process-agent">CASPER</div>
              <div class="process-content">
                <AnimatedMarkdownText :text="phase3ByAgent.CASPER" :speed="12" />
              </div>
            </div>
          </div>

          <div class="process-main">
            <div class="process-card">
              <div class="process-agent">MELCHIOR</div>
              <div class="process-content">
                <AnimatedMarkdownText :text="phase3ByAgent.MELCHIOR" :speed="12" />
              </div>
            </div>
          </div>
        </div>
        <div class="result-footer" v-if="currentConversation && currentConversation.votes">
          <div class="vote-summary">
            <span class="vote-label">MELCHIOR:</span>
            <span :class="currentConversation.votes.MELCHIOR ? 'vote-approve' : 'vote-reject'">
              {{ currentConversation.votes.MELCHIOR ? 'AGREE' : 'DENY' }}
            </span>
          </div>
          <div class="vote-summary">
            <span class="vote-label">BALTHASAR:</span>
            <span :class="currentConversation.votes.BALTHASAR ? 'vote-approve' : 'vote-reject'">
              {{ currentConversation.votes.BALTHASAR ? 'AGREE' : 'DENY' }}
            </span>
          </div>
          <div class="vote-summary">
            <span class="vote-label">CASPER:</span>
            <span :class="currentConversation.votes.CASPER ? 'vote-approve' : 'vote-reject'">
              {{ currentConversation.votes.CASPER ? 'AGREE' : 'DENY' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div> <!-- end of magi-interface-v2 -->
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import QuestionInput from './QuestionInput.vue'
import AIWindow from './AIWindow.vue'
import AnimatedMarkdownText from './AnimatedMarkdownText.vue'
import HistoryPanel from './HistoryPanel.vue'

const wsStatus = ref('disconnected')
const isQuerying = ref(false)
const currentPhase = ref(0)
const currentConversation = ref(null)
const currentPhase1 = ref(null)
const currentPhase2 = ref(null)
const currentPhase3 = ref(null)
const currentVote = ref(null)

const showHistory = ref(false)
const showAiWindows = ref(false)
const showResult = ref(false)

const aiAgents = [
  { name: 'BALTHASAR', title: '理性分析者', color: '#00e5ff' },
  { name: 'CASPER', title: '道德考量者', color: '#ff00ff' },
  { name: 'MELCHIOR', title: '创新者', color: '#ffaa00' }
]

const phase3ByAgent = computed(() => {
  return {
    BALTHASAR: currentPhase3.value?.BALTHASAR || '',
    CASPER: currentPhase3.value?.CASPER || '',
    MELCHIOR: currentPhase3.value?.MELCHIOR || ''
  }
})

let ws = null
let phase3FinalizeTimer = null

function clearPhase3FinalizeTimer() {
  if (phase3FinalizeTimer) {
    clearTimeout(phase3FinalizeTimer)
    phase3FinalizeTimer = null
  }
}

function normalizeAgentName(name) {
  const normalized = (name || '').toString().trim().toUpperCase()
  if (normalized === 'BALTHASAR' || normalized === 'CASPER' || normalized === 'MELCHIOR') {
    return normalized
  }
  return 'MELCHIOR'
}

function appendPhase3Chunk(aiName, chunk) {
  const safeChunk = typeof chunk === 'string' ? chunk : ''
  if (!safeChunk) return

  const agentName = normalizeAgentName(aiName)
  if (!currentPhase3.value) currentPhase3.value = {}
  currentPhase3.value[agentName] = (currentPhase3.value[agentName] || '') + safeChunk
}

function finalizeToResult(payload = {}) {
  isQuerying.value = false
  currentPhase.value = 0

  if (payload.votes) {
    currentVote.value = payload.votes
  }

  const fallbackConsensus =
    payload.consensus ||
    currentPhase3.value?.MELCHIOR ||
    currentPhase3.value?.BALTHASAR ||
    currentPhase3.value?.CASPER ||
    ''

  if (!currentConversation.value) {
    currentConversation.value = {
      consensus: fallbackConsensus,
      votes: payload.votes || currentVote.value || {}
    }
  } else {
    currentConversation.value = {
      ...currentConversation.value,
      consensus: currentConversation.value.consensus || fallbackConsensus,
      votes: payload.votes || currentConversation.value.votes || currentVote.value || {}
    }
  }

  showAiWindows.value = false
  showResult.value = true
}

function schedulePhase3FinalizeFallback() {
  clearPhase3FinalizeTimer()
  phase3FinalizeTimer = setTimeout(() => {
    // 若处于第三阶段且已有第三阶段内容，认为流式输出已结束，执行兜底收敛
    const hasPhase3Content =
      !!currentPhase3.value?.MELCHIOR ||
      !!currentPhase3.value?.BALTHASAR ||
      !!currentPhase3.value?.CASPER

    if (currentPhase.value === 3 && hasPhase3Content) {
      finalizeToResult()
    }
  }, 6000)
}

onMounted(() => {
  initWebSocket()
})

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${window.location.host}/ws`)

  ws.onopen = () => {
    wsStatus.value = 'connected'
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    handleWebSocketMessage(data)
  }

  ws.onclose = () => {
    wsStatus.value = 'disconnected'
    setTimeout(initWebSocket, 3000)
  }
}

function handleWebSocketMessage(data) {
  const { type } = data
  if (import.meta.env.DEV) {
    console.debug('[MAGI WS]', type, data.phase ? `phase=${data.phase}` : '')
  }
  switch (type) {
    case 'phase_start':
      currentPhase.value = data.phase
      // 如果进入了阶段分析，也可以自动弹开详情面板
      if(data.phase === 1) showAiWindows.value = true
      if (data.phase === 3) {
        clearPhase3FinalizeTimer()
        showAiWindows.value = false
        showResult.value = true
      }
      break
    case 'ai_stream':
      if (data.phase === 1) {
        if (!currentPhase1.value) currentPhase1.value = {}
        currentPhase1.value[data.ai] = (currentPhase1.value[data.ai] || '') + data.chunk
      } else if (data.phase === 2) {
        if (!currentPhase2.value) currentPhase2.value = {}
        currentPhase2.value[data.ai] = (currentPhase2.value[data.ai] || '') + data.chunk
      } else if (data.phase === 3) {
        appendPhase3Chunk(data.ai, data.chunk)
        schedulePhase3FinalizeFallback()
      }
      break
    case 'phase_complete':
      // 兜底：即使丢失 conversation_complete，也在 Phase 3 结束时自动切换到结果窗口
      if (data.phase === 3) {
        clearPhase3FinalizeTimer()
        finalizeToResult({ votes: data.votes })
      }
      break
    case 'consensus_reached':
      // 兜底：提前收到共识摘要时，也允许先展示结果窗口
      clearPhase3FinalizeTimer()
      finalizeToResult({
        consensus: data.consensus,
        votes: currentVote.value || currentConversation.value?.votes || {}
      })
      break
    case 'conversation_complete':
      clearPhase3FinalizeTimer()
      currentConversation.value = data
      currentVote.value = data.votes
      isQuerying.value = false
      currentPhase.value = 0
      showAiWindows.value = false // 隐藏 AI 思考面板
      showResult.value = true     // 自动弹开最终结果窗口
      break
    case 'error':
      isQuerying.value = false
      currentPhase.value = 0
      break
  }
}

function handleQuery(question) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  clearPhase3FinalizeTimer()
  isQuerying.value = true
  currentPhase.value = 0
  currentPhase1.value = {}
  currentPhase2.value = {}
  currentPhase3.value = {}
  currentConversation.value = null
  currentVote.value = null
  showAiWindows.value = true
  showResult.value = false

  ws.send(JSON.stringify({ type: 'query', question }))
}
</script>

<style scoped>

.magi-interface-v2 {
  width: 100vw;
  height: 100vh;
  background-color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2vw;
  box-sizing: border-box;
  color: #ff8c00;
  user-select: none;
  position: relative;
}

.magi-outer-border {
  width: 100%;
  height: 100%;
  border: 3px solid #E17814;
  padding: 15px;
  box-sizing: border-box;
}

.magi-inner-border {
  width: 100%;
  height: 100%;
  border: 1.5px solid #E17814;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Header Area */
.magi-header {
  display: flex;
  justify-content: space-between;
  padding: 40px 100px 0 100px;
  height: auto;
}

.header-left, .header-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 350px;
}

.header-space {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 40px;
}

.global-input-wrapper {
  width: 100%;
  max-width: 800px;
  z-index: 10;
}

.cyan-line {
  height: 4px;
  background-color: #00A0A0;
  margin: 8px 0;
  box-shadow: 0 0 3px #00A0A0;
}

.header-title {
  font-family: var(--font-serif);
  font-size: 110px;
  font-weight: 900;
  text-align: center;
  color: #E17814;
  line-height: 1;
  text-shadow: 0 0 5px rgba(225, 120, 20, 0.5);
  letter-spacing: 10px;
}

/* Button Controls */
.panel-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  height: 45px;
}

.control-btn {
  flex: 1;
  background: rgba(225, 120, 20, 0.1);
  border: 1px solid #E17814;
  color: #E17814;
  padding: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 4px;
}

.control-btn:hover {
  background: rgba(225, 120, 20, 0.3);
}

.control-btn.active {
  background: #E17814;
  color: #000;
}

.status-box-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15px;
  height: 45px;
}

.status-box {
  border: 2px solid #E17814;
  padding: 6px 12px;
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: bold;
  letter-spacing: 3px;
  color: #E17814;
}

/* Panels Area */
.magi-panels {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translateY(-20px);
}

.panels-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.panel-box {
  position: relative;
  background-color: transparent;
}

.panel-svg {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 1;
  pointer-events: none;
}

.panel-polygon {
  fill: transparent;
  stroke: #E17814;
  stroke-width: 4;
}

.panel-inner-content {
  position: relative;
  z-index: 2;
  padding: 30px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  color: #E17814;
}

.panel-top {
  width: 450px;
  height: 300px;
  margin-bottom: 5px;
  z-index: 3;
}

.panels-bottom-row {
  display: flex;
  justify-content: center;
  position: relative;
}

.panel-bl {
  width: 400px;
  height: 250px;
  margin-right: 50px;
}

.panel-br {
  width: 400px;
  height: 250px;
  margin-left: 50px;
}

.panel-label {
  font-family: var(--font-mono);
  font-weight: bold;
  font-size: 16px;
  text-align: center;
  border-bottom: 1px solid #E17814;
  padding-bottom: 5px;
  margin-bottom: 15px;
}

.ai-output {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  flex: 1;
  overflow-y: auto;
  font-family: var(--font-mono);
}

.connections-wrapper {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 120px;
  z-index: 2;
}

.y-line {
  position: absolute;
  background-color: #E17814;
}

.y-left {
  width: 6px;
  height: 40px;
  top: 15px;
  left: 31px;
  transform: rotate(-45deg);
}

.y-right {
  width: 6px;
  height: 40px;
  top: 15px;
  right: 31px;
  transform: rotate(45deg);
}

.y-h-line-left {
  position: absolute;
  width: 25px;
  height: 6px;
  background-color: #E17814;
  top: 48px;
  left: -20px;
}

.y-h-line-right {
  position: absolute;
  width: 25px;
  height: 6px;
  background-color: #E17814;
  top: 48px;
  right: -20px;
}

.y-bottom {
  width: 6px;
  height: 25px;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
}

.magi-logo-text {
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 900;
  color: #E17814;
  position: absolute;
  top: 55px;
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: 2px;
}

/* Modals Overlay CSS */
.ai-windows-overlay, .history-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
}

.ai-windows-content, .history-content {
  width: 90vw;
  height: 85vh;
  position: relative;
  background: #050810;
  border: 2px solid #E17814;
  padding: 20px;
  box-shadow: 0 0 30px rgba(225, 120, 20, 0.3);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: sticky;
  top: -5px;
  align-self: flex-end;
  margin-top: -5px;
  margin-bottom: -36px;
  background: rgba(10, 5, 0, 0.8);
  color: #E17814;
  border: 1px solid #E17814;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #E17814;
  color: #000;
  box-shadow: 0 0 10px #E17814;
}

.windows-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  height: 100%;
  flex: 1;
  min-height: 0; /* allows shrinking if needed */
}

.ai-window-container {
  height: 100%;
}
/* RESOLVING FLASH ANIMATION */
.resolving-flash-1 .panel-polygon {
  animation: magi-blink-fill 1.5s infinite;
  animation-delay: 0s;
}
.resolving-flash-2 .panel-polygon {
  animation: magi-blink-fill 1.5s infinite;
  animation-delay: 0.5s;
}
.resolving-flash-3 .panel-polygon {
  animation: magi-blink-fill 1.5s infinite;
  animation-delay: 1.0s;
}
@keyframes magi-blink-fill {
  0%, 15% {
    fill: rgb(122, 255, 168);
    stroke: rgb(122, 255, 168);
  }
  20%, 100% {
    fill: transparent;
    stroke: #E17814;
  }
}

/* Result Overlay Styles */
.result-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(5px);
}

.result-content {
  width: 80%;
  max-width: 900px;
  max-height: 80vh;
  overflow-y: auto;
  background: rgba(10, 10, 10, 0.95);
  border: 2px solid #E17814;
  box-shadow: 0 0 30px rgba(225, 120, 20, 0.3), inset 0 0 20px rgba(225, 120, 20, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  padding: 30px;
}

.result-close {
  /* same sticky trick as the main modal */
  position: sticky;
  top: -15px;
  align-self: flex-end;
  margin-top: -15px;
  margin-bottom: -21px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 25px;
}

.result-title {
  color: #E17814;
  font-family: var(--font-sans);
  font-size: 28px;
  letter-spacing: 8px;
  font-weight: 900;
  text-shadow: 0 0 10px #E17814;
}

.result-process {
  margin-top: 6px;
  border: 1px solid rgba(225, 120, 20, 0.25);
  background: rgba(10, 8, 2, 0.35);
  padding: 12px;
}

.process-title {
  color: #E17814;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 2px;
  margin-bottom: 10px;
  text-shadow: 0 0 8px rgba(225, 120, 20, 0.6);
}

.process-sides {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.process-main {
  margin-bottom: 10px;
}

.process-card {
  border: 1px solid rgba(225, 120, 20, 0.35);
  background: rgba(0, 0, 0, 0.45);
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.process-agent {
  color: #E17814;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 1px;
  border-bottom: 1px dashed rgba(225, 120, 20, 0.4);
  padding: 6px 8px;
}

.process-content {
  padding: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: rgb(122, 255, 168);
  max-height: 180px;
  overflow-y: auto;
}

.process-content :deep(*) {
  color: inherit !important;
}

@media (max-width: 960px) {
  .process-sides {
    grid-template-columns: 1fr;
  }
}

.result-footer {
  margin-top: 25px;
  display: flex;
  justify-content: space-around;
  border-top: 1px dashed rgba(225, 120, 20, 0.5);
  padding-top: 20px;
}

.vote-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.vote-label {
  color: #E17814;
  font-size: 14px;
  letter-spacing: 2px;
}

.vote-approve {
  color: rgb(122, 255, 168);
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 10px rgb(122, 255, 168);
  letter-spacing: 4px;
}

.vote-reject {
  color: #ff3333;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 10px #ff3333;
  letter-spacing: 4px;
}
</style>
