<template>
  <div class="min-h-screen bg-[#070402] flex items-center justify-center overflow-hidden select-none">
    <div class="fixed inset-0 pointer-events-none z-50 scanlines"></div>

    <div ref="panelRef" class="panel" :style="panelStyle">
      <div class="absolute inset-[1px] border border-[rgba(196,122,10,0.12)] pointer-events-none z-30"></div>

      <div class="flex h-full w-full">
        <!-- LEFT: Defence System -->
        <div class="defence-panel">
          <div class="defence-header">DEFENCE</div>
          <div class="defence-lights">
            <div v-for="i in 14" :key="i" class="defence-light" :style="defenceStyle(i)"></div>
          </div>
          <div class="defence-footer" :class="defenceFooterClass">{{ defenceFooterText }}</div>
        </div>

        <!-- MAIN CONTENT -->
        <div class="flex-1 flex flex-col min-w-0">
          <!-- HEADER -->
          <div class="panel-header">
            <div class="header-left">
              <span class="header-brand">NERV·MAGI</span>
              <span class="header-divider">/</span>
              <span class="header-sub">CENTRAL OPERATION</span>
            </div>
            <div class="header-center">TOKYO-3</div>
            <div class="header-right">
              <span class="header-dot" :class="statusDotClass">●</span>
              <span class="header-clock">{{ sysTime }}</span>
            </div>
          </div>

          <!-- CORE AREA -->
          <div class="core-area">
            <!-- Triangle connecting lines -->
            <svg class="triangle-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="50" y1="11" x2="30" y2="62" :stroke="triLineColor" stroke-width="1.2" stroke-dasharray="4,3"/>
              <line x1="50" y1="11" x2="70" y2="62" :stroke="triLineColor" stroke-width="1.2" stroke-dasharray="4,3"/>
              <line x1="30" y1="62" x2="70" y2="62" :stroke="triLineColor" stroke-width="0.8" stroke-dasharray="3,3"/>
            </svg>

            <!-- BALTHASAR (top — pentagon) -->
            <div class="core core-balthasar" :class="coreStateClass('balthasar')" @click="toggleVote('balthasar')">
              <div class="core-inner">
                <div class="core-name">BALTHASAR</div>
                <div class="core-type">SCIENTIA</div>
                <div v-if="magi.balthasar.status === 'DECIDED'" class="core-result" :class="voteClass('balthasar')">
                  {{ magi.balthasar.vote === 'APPROVAL' ? 'APPROVED' : 'DENIED' }}
                </div>
              </div>
            </div>

            <!-- CASPER (bottom left — diamond) -->
            <div class="core core-casper" :class="coreStateClass('casper')" @click="toggleVote('casper')">
              <div class="core-inner">
                <div class="core-name">CASPER</div>
                <div class="core-type">MULIER</div>
                <div v-if="magi.casper.status === 'DECIDED'" class="core-result" :class="voteClass('casper')">
                  {{ magi.casper.vote === 'APPROVAL' ? 'APPROVED' : 'DENIED' }}
                </div>
              </div>
            </div>

            <!-- MELCHIOR (bottom right — diamond) -->
            <div class="core core-melchior" :class="coreStateClass('melchior')" @click="toggleVote('melchior')">
              <div class="core-inner">
                <div class="core-name">MELCHIOR</div>
                <div class="core-type">MATER</div>
                <div v-if="magi.melchior.status === 'DECIDED'" class="core-result" :class="voteClass('melchior')">
                  {{ magi.melchior.vote === 'APPROVAL' ? 'APPROVED' : 'DENIED' }}
                </div>
              </div>
            </div>

            <!-- Reasoning strips -->
            <div class="strip strip-b" v-if="magi.balthasar.status !== 'IDLE'">
              <span class="strip-tag">DAT://BAL</span>
              <span class="strip-text">{{ magi.balthasar.reasoning }}</span>
            </div>
            <div class="strip strip-cl" v-if="magi.casper.status !== 'IDLE'">
              <span class="strip-tag">DAT://CAS</span>
              <span class="strip-text">{{ magi.casper.reasoning }}</span>
            </div>
            <div class="strip strip-cr" v-if="magi.melchior.status !== 'IDLE'">
              <span class="strip-tag">DAT://MEL</span>
              <span class="strip-text">{{ magi.melchior.reasoning }}</span>
            </div>

            <!-- Resolution Bar -->
            <div v-if="resolutionVisible" class="resolution-bar" :class="resolutionBarClass">
              <div class="res-line" :class="resLineClass"></div>
              <div class="res-text" :class="resTextClass">{{ resolutionBannerText }}</div>
              <div class="res-line" :class="resLineClass"></div>
            </div>
          </div>

          <!-- IO SECTION -->
          <div class="io-section">
            <div class="io-left">
              <div class="io-label">// ENTER_QUERY</div>
              <div class="io-body">
                <textarea ref="inputRef" v-model="userInput"
                  class="io-textarea"
                  placeholder="Enter query..."
                  :disabled="isProcessing" maxlength="200"
                  @keydown.enter.exact.prevent="handleSubmit"></textarea>
                <button @click="handleSubmit" :disabled="!userInput.trim() || isProcessing"
                  class="exec-btn" :class="{ 'exec-active': isProcessing }">
                  EXEC
                </button>
              </div>
              <div class="io-char-count" v-if="userInput.length">{{ userInput.length }}/200</div>
            </div>

            <div class="io-right">
              <div class="io-label">
                // DECISION_LOG
                <span class="io-state" :class="ioStateClass">{{ ioStateText }}</span>
              </div>
              <div class="io-right-body">
                <div ref="logRef" class="io-log custom-scrollbar">
                  <div v-for="(log, i) in displayLogs" :key="i" class="log-entry" :class="logClass(log)">
                    <span class="log-marker">&gt;</span>
                    <span>{{ log }}</span>
                  </div>
                  <div v-if="!displayLogs.length" class="log-empty">AWAITING INPUT...</div>
                </div>
                <div v-if="typedOutput" class="io-output">
                  <div class="io-output-header">
                    <span class="io-output-label">// OUTPUT</span>
                    <span v-if="isTyping" class="io-output-typing">TRANSMITTING...</span>
                    <span v-else class="io-output-done">TRANSMITTED</span>
                  </div>
                  <div class="io-output-body">
                    <span class="io-output-text">{{ typedOutput }}<span v-if="isTyping" class="cursor-blink">_</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STATUS BAR -->
          <div class="status-bar">
            <span class="stat-item">SYS:ONLINE</span>
            <span class="stat-sep">|</span>
            <span class="stat-item" :class="syncClass">SYNC:{{ syncRate }}%</span>
            <span class="stat-sep">|</span>
            <span class="stat-item" :class="magiStatusClass">MAGI:{{ magiStatusText }}</span>
            <span class="stat-sep">|</span>
            <span class="stat-item">CONN:ESTABLISHED</span>
            <span class="stat-fill"></span>
            <span class="stat-item stat-version">V 1.2</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'

// ============================================
// STATE
// ============================================
const userInput = ref('')
const systemStatus = ref('IDLE')        // IDLE | PROCESSING | RESOLVED | REJECTED | WARNING
const globalResolution = ref('WAITING') // WAITING | APPROVED | REJECTED
const syncRate = ref(99.4)
const displayLogs = ref([])
const typedOutput = ref('')
const isTyping = ref(false)
const isProcessing = ref(false)
const sysTime = ref('00:00:00')
const inputRef = ref(null)
const logRef = ref(null)
const panelRef = ref(null)
const panelSize = ref({ w: 1280, h: 720 })
const aiConsensusText = ref('')
const apiPending = ref(false)

const triLineColor = computed(() => {
  if (systemStatus.value === 'RESOLVED') return 'rgba(65,181,184,0.35)'
  if (systemStatus.value === 'REJECTED') return 'rgba(184,28,28,0.35)'
  if (isProcessing.value) return 'rgba(196,122,10,0.3)'
  return 'rgba(196,122,10,0.12)'
})

const magi = reactive({
  balthasar: { name: 'BALTHASAR', personality: 'SCIENTIA', status: 'IDLE', vote: 'PENDING', reasoning: 'STANDBY' },
  melchior: { name: 'MELCHIOR', personality: 'MATER', status: 'IDLE', vote: 'PENDING', reasoning: 'STANDBY' },
  casper: { name: 'CASPER', personality: 'MULIER', status: 'IDLE', vote: 'PENDING', reasoning: 'STANDBY' }
})

// ============================================
// COMPUTED
// ============================================
const panelStyle = computed(() => {
  const { w, h } = panelSize.value
  return { width: `${w}px`, height: `${h}px` }
})

const resolutionVisible = computed(() =>
  systemStatus.value === 'RESOLVED' || systemStatus.value === 'REJECTED'
)

const resolutionBannerText = computed(() =>
  globalResolution.value === 'APPROVED' ? 'APPROVED' : 'DENIED'
)

const resolutionBarClass = computed(() =>
  globalResolution.value === 'APPROVED' ? 'res-approved' : 'res-denied'
)

const resLineClass = computed(() =>
  globalResolution.value === 'APPROVED' ? 'res-line-cyan' : 'res-line-red'
)

const resTextClass = computed(() =>
  globalResolution.value === 'APPROVED' ? 'res-text-cyan' : 'res-text-red'
)

const defenceFooterText = computed(() => {
  if (systemStatus.value === 'RESOLVED') return 'CLEAR'
  if (systemStatus.value === 'REJECTED' || systemStatus.value === 'WARNING') return 'ALERT'
  if (isProcessing.value) return 'ACTIVE'
  return 'STANDBY'
})

const defenceFooterClass = computed(() => {
  if (systemStatus.value === 'RESOLVED') return 'df-clear'
  if (systemStatus.value === 'REJECTED' || systemStatus.value === 'WARNING') return 'df-alert'
  return ''
})

const statusDotClass = computed(() => {
  if (systemStatus.value === 'RESOLVED') return 'dot-cyan'
  if (systemStatus.value === 'REJECTED' || systemStatus.value === 'WARNING') return 'dot-red'
  if (isProcessing.value) return 'dot-amber-pulse'
  return 'dot-dim'
})

const magiStatusText = computed(() => {
  if (systemStatus.value === 'RESOLVED') return 'CONSENSUS'
  if (systemStatus.value === 'REJECTED') return 'BLOCKED'
  if (isProcessing.value) return 'DELIBERATING'
  return 'ACTIVE'
})

const magiStatusClass = computed(() => {
  if (systemStatus.value === 'RESOLVED') return 'stat-cyan'
  if (systemStatus.value === 'REJECTED') return 'stat-red'
  if (isProcessing.value) return 'stat-amber-pulse'
  return ''
})

const ioStateText = computed(() => {
  if (isProcessing.value) return 'PROCESSING'
  if (systemStatus.value === 'RESOLVED') return 'COMPLETE'
  if (systemStatus.value === 'REJECTED') return 'DENIED'
  return ''
})

const ioStateClass = computed(() => {
  if (isProcessing.value) return 'io-state-proc'
  if (systemStatus.value === 'RESOLVED') return 'io-state-done'
  if (systemStatus.value === 'REJECTED') return 'io-state-denied'
  return ''
})

const defenceColors = [
  '#004400', '#005500', '#006600', '#228B22', '#32CD32', '#7CFC00',
  '#ADFF2F', '#FFD700', '#FFA500', '#FF8C00', '#FF6600', '#FF4400', '#CC2222', '#AA0000'
]

function defenceStyle(i) {
  return { backgroundColor: defenceColors[i - 1], opacity: isProcessing.value ? 0.5 + ((i % 3) * 0.15) : 0.6 }
}

function coreStateClass(name) {
  const n = magi[name]
  if (n.status === 'DECIDED') return n.vote === 'APPROVAL' ? 'core-approved' : 'core-denied'
  if (n.status === 'THINKING') return 'core-thinking'
  return 'core-idle'
}

function voteClass(name) {
  return magi[name].vote === 'APPROVAL' ? 'vote-yes' : 'vote-no'
}

function toggleVote(name) {
  if (isProcessing.value) return
  const n = magi[name]
  n.status = 'DECIDED'
  n.vote = n.vote === 'APPROVAL' ? 'DENIAL' : 'APPROVAL'
  n.reasoning = n.vote === 'APPROVAL' ? getReasoning(name, true) : getReasoning(name, false)
  evaluateResolution()
}

const syncClass = computed(() => {
  if (isProcessing.value) return 'stat-amber-pulse'
  if (systemStatus.value === 'RESOLVED') return 'stat-cyan'
  if (systemStatus.value === 'REJECTED') return 'stat-red'
  return ''
})

function logClass(log) {
  if (log.startsWith('[ERROR]') || log.includes('[!]') || log.includes('DENIED') || log.includes('DETECTED') || log.includes('ALERT')) return 'log-red'
  if (log.startsWith('[COMPLETE]') || log.includes('APPROVED') || log.includes('CONSENSUS')) return 'log-cyan'
  if (log.startsWith('[FINAL ANSWER]')) return 'log-final'
  if (log.startsWith('[BALTHASAR]')) return 'log-amber'
  if (log.startsWith('[MELCHIOR]')) return 'log-red-dim'
  if (log.startsWith('[CASPER]')) return 'log-orange'
  if (log.startsWith('[SYSTEM]')) return 'log-dim'
  return ''
}

function getReasoning(name, approval) {
  const map = {
    balthasar: {
      a: ['LOGICAL STRUCTURE: VALID', 'CAUSAL CHAIN: INTACT', 'FEASIBILITY: CONFIRMED'],
      d: ['LOGICAL CONTRADICTION', 'INSUFFICIENT PREMISE', 'CAUSAL FALLACY']
    },
    melchior: {
      a: ['SAFETY SCAN: CLEAR', 'ETHICAL BOUNDARY: OK', 'NO RISK DETECTED'],
      d: ['SAFETY PROTOCOL: VIOLATED', 'ETHICAL CONSTRAINT', 'RISK THRESHOLD EXCEEDED']
    },
    casper: {
      a: ['INTUITIVE ALIGNMENT: OK', 'CREATIVE POTENTIAL: NOMINAL', 'EMOTIONAL TONE: NEUTRAL'],
      d: ['INTUITIVE MISALIGNMENT', 'CREATIVE RISK: HIGH', 'GUT FEELING: NEGATIVE']
    }
  }
  const list = approval ? map[name].a : map[name].d
  return list[Math.floor(Math.random() * list.length)]
}

const SENSITIVE = ['毁灭世界', '毁灭', '核弹', '炸弹', '恐怖袭击', '杀人', '病毒传播', '入侵系统', '攻击', '破坏', 'hack', 'attack', 'destroy', 'virus', 'bomb', 'kill', 'terror', 'weapon', 'exploit']

function isSensitive(input) {
  const low = input.toLowerCase()
  return SENSITIVE.some(w => low.includes(w.toLowerCase()))
}

// ============================================
// PANEL SIZING
// ============================================
function updatePanelSize() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const isMobile = vw <= 768 || vh <= 600
  if (isMobile) { panelSize.value = { w: vw, h: vh } }
  else if (vw / vh > 16 / 9) { panelSize.value = { w: Math.min(Math.round(vh * 16 / 9), 1920), h: Math.min(vh, 1080) } }
  else { panelSize.value = { w: Math.min(vw, 1920), h: Math.min(Math.round(vw * 9 / 16), 1080) } }
}

// ============================================
// DELIBERATION
// ============================================
let timers = []

function addLog(text) {
  displayLogs.value.push(text)
  nextTick(() => { logRef.value && (logRef.value.scrollTop = logRef.value.scrollHeight) })
}

function resetMagi() {
  Object.keys(magi).forEach(k => { magi[k].status = 'IDLE'; magi[k].vote = 'PENDING'; magi[k].reasoning = 'STANDBY' })
}

function clearTimers() {
  timers.forEach(t => clearTimeout(t))
  timers = []
}

function evaluateResolution() {
  const votes = [magi.balthasar.vote, magi.melchior.vote, magi.casper.vote]
  const approvals = votes.filter(v => v === 'APPROVAL').length
  if (votes.every(v => v !== 'PENDING')) {
    clearTimers()
    if (approvals >= 2 && systemStatus.value !== 'REJECTED' && systemStatus.value !== 'WARNING') {
      globalResolution.value = 'APPROVED'
      systemStatus.value = 'RESOLVED'
      isProcessing.value = false
      startFinalResponse()
    } else if (systemStatus.value !== 'WARNING') {
      globalResolution.value = 'REJECTED'
      systemStatus.value = 'REJECTED'
      isProcessing.value = false
      addLog('[SYSTEM] MAJORITY DENIAL: RESOLUTION REJECTED')
      typedOutput.value = ''
    }
  }
}

function handleSubmit() {
  const text = userInput.value.trim()
  if (!text || isProcessing.value) return
  clearTimers()
  isProcessing.value = true
  systemStatus.value = 'PROCESSING'
  globalResolution.value = 'WAITING'
  typedOutput.value = ''
  displayLogs.value = []
  resetMagi()

  addLog('[SYSTEM] INITIALIZING DELIBERATION PROTOCOL...')
  addLog('[SYSTEM] SYNCHRONIZATION RATE: 99.4%')

  const dangerous = isSensitive(text)

  // Start thinking animation
  timers.push(setTimeout(() => {
    magi.balthasar.status = 'THINKING'
    magi.melchior.status = 'THINKING'
    magi.casper.status = 'THINKING'
    syncRate.value = 97.1
    addLog('[SYSTEM] TRIAD DELIBERATION ENGAGED')
    addLog('[BALTHASAR] ANALYZING LOGICAL STRUCTURE...')
    addLog('[MELCHIOR] RUNNING HEURISTIC SAFETY SCAN...')
    addLog('[CASPER] EVALUATING INTUITIVE ALIGNMENT...')
    if (dangerous) addLog('[SYSTEM] WARNING: ANOMALOUS PATTERN DETECTED')
  }, 500))

  // Fetch real AI response
  aiConsensusText.value = ''
  apiPending.value = true
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 35000)

  fetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: text }),
    signal: controller.signal
  })
    .then(r => r.json())
    .then(data => {
      if (data.success && data.data) {
        const d = data.data
        // Use real votes from API
        if (d.votes) {
          magi.balthasar.status = 'DECIDED'
          magi.balthasar.vote = d.votes.BALTHASAR ? 'APPROVAL' : 'DENIAL'
          magi.balthasar.reasoning = d.phases?.phase3?.BALTHASAR?.slice(0, 60) || getReasoning('balthasar', d.votes.BALTHASAR)

          magi.melchior.status = 'DECIDED'
          magi.melchior.vote = d.votes.MELCHIOR ? 'APPROVAL' : 'DENIAL'
          magi.melchior.reasoning = d.phases?.phase3?.MELCHIOR?.slice(0, 60) || getReasoning('melchior', d.votes.MELCHIOR)

          magi.casper.status = 'DECIDED'
          magi.casper.vote = d.votes.CASPER ? 'APPROVAL' : 'DENIAL'
          magi.casper.reasoning = d.phases?.phase3?.CASPER?.slice(0, 60) || getReasoning('casper', d.votes.CASPER)

          addLog(`[BALTHASAR] ANALYSIS COMPLETE — VOTE: ${d.votes.BALTHASAR ? 'APPROVAL' : 'DENIAL'}`)
          addLog(`[MELCHIOR] SAFETY SCAN COMPLETE — VOTE: ${d.votes.MELCHIOR ? 'APPROVAL' : 'DENIAL'}`)
          addLog(`[CASPER] INTUITION ANALYSIS COMPLETE — VOTE: ${d.votes.CASPER ? 'APPROVAL' : 'DENIAL'}`)
        }

        if (d.consensus) {
          aiConsensusText.value = d.consensus
        }

        syncRate.value = 100

        // Finalize with real data
        timers.push(setTimeout(() => {
          clearTimers()
          const approvals = [d.votes?.BALTHASAR, d.votes?.MELCHIOR, d.votes?.CASPER].filter(Boolean).length
          if (approvals >= 2) {
            globalResolution.value = 'APPROVED'
            systemStatus.value = 'RESOLVED'
            isProcessing.value = false
            startFinalResponse()
          } else {
            globalResolution.value = 'REJECTED'
            systemStatus.value = 'REJECTED'
            isProcessing.value = false
            addLog('[SYSTEM] MAJORITY DENIAL: RESOLUTION REJECTED')
            typedOutput.value = ''
          }
        }, 800))
      }
    })
    .catch(() => {
      // API failed — use simulated deliberation as fallback
      addLog('[SYSTEM] AI MODEL UNAVAILABLE — USING LOCAL DELIBERATION')
      fallbackDeliberation(dangerous)
    })
    .finally(() => {
      clearTimeout(timeoutId)
      apiPending.value = false
    })
}

function fallbackDeliberation(dangerous) {
  timers.push(setTimeout(() => {
    if (dangerous) {
      magi.melchior.status = 'DECIDED'
      magi.melchior.vote = 'DENIAL'
      magi.melchior.reasoning = 'SAFETY PROTOCOL: VIOLATED'
      addLog('[MELCHIOR] ⚠ SAFETY VIOLATION DETECTED')
      addLog('[MELCHIOR] VOTE: DENIAL')
      addLog('[!] ALERT: POTENTIAL THREAT IDENTIFIED')
      systemStatus.value = 'WARNING'
      syncRate.value = 42.7
      addLog('[!] INTRUSION DETECTION SYSTEM TRIGGERED')

      timers.push(setTimeout(() => {
        magi.balthasar.status = 'DECIDED'
        const bv = Math.random() > 0.3 ? 'APPROVAL' : 'DENIAL'
        magi.balthasar.vote = bv; magi.balthasar.reasoning = bv === 'APPROVAL' ? 'LOGICAL STRUCTURE: VALID' : 'INSUFFICIENT PREMISE'
        addLog(`[BALTHASAR] VOTE: ${bv}`)
        magi.casper.status = 'DECIDED'
        const cv = Math.random() > 0.5 ? 'APPROVAL' : 'DENIAL'
        magi.casper.vote = cv; magi.casper.reasoning = cv === 'APPROVAL' ? 'CAUTION ADVISED' : 'INTUITIVE MISALIGNMENT'
        addLog(`[CASPER] VOTE: ${cv}`)
        syncRate.value = 100
        timers.push(setTimeout(() => {
          systemStatus.value = 'REJECTED'
          globalResolution.value = 'REJECTED'
          isProcessing.value = false
          addLog('[SYSTEM] ■ FINAL: QUESTION REJECTED BY MAGI CONSENSUS')
          addLog('[SYSTEM] REASON: SAFETY CONSTRAINTS — CONTENT FLAGGED AS POTENTIALLY HARMFUL')
          typedOutput.value = '[ACCESS DENIED] 您的提问被 Melchior 安全过滤器拦截，请重新措辞后重试。'
        }, 600))
      }, 1200))
    } else {
      timers.push(setTimeout(() => {
        magi.balthasar.status = 'DECIDED'
        const bv = Math.random() > 0.2 ? 'APPROVAL' : 'DENIAL'
        magi.balthasar.vote = bv; magi.balthasar.reasoning = getReasoning('balthasar', bv === 'APPROVAL')
        addLog(`[BALTHASAR] ANALYSIS COMPLETE — VOTE: ${bv}`)
        addLog(`[BALTHASAR] ${magi.balthasar.reasoning}`)
        timers.push(setTimeout(() => {
          magi.melchior.status = 'DECIDED'
          const mv = Math.random() > 0.15 ? 'APPROVAL' : 'DENIAL'
          magi.melchior.vote = mv; magi.melchior.reasoning = mv === 'APPROVAL' ? 'NO RISK DETECTED' : 'HEURISTIC FILTER: BLOCKED'
          addLog(`[MELCHIOR] SAFETY SCAN COMPLETE — VOTE: ${mv}`)
          addLog(`[MELCHIOR] ${magi.melchior.reasoning}`)
          timers.push(setTimeout(() => {
            magi.casper.status = 'DECIDED'
            const cv = Math.random() > 0.35 ? 'APPROVAL' : 'DENIAL'
            magi.casper.vote = cv; magi.casper.reasoning = getReasoning('casper', cv === 'APPROVAL')
            addLog(`[CASPER] INTUITION ANALYSIS COMPLETE — VOTE: ${cv}`)
            addLog(`[CASPER] ${magi.casper.reasoning}`)
            syncRate.value = 100
            timers.push(setTimeout(() => { evaluateResolution() }, 600))
          }, 800))
        }, 1000))
      }, 800))
    }
  }, 1500))
}

// ============================================
// RESPONSE
// ============================================
let typeTimer = null

function getResponse(q) {
  const l = q.toLowerCase()
  if (l.includes('hello') || l.includes('hi') || l.includes('你好')) return '您好，操作员。MAGI 系统已上线，全核心同步完成。三贤者运行正常，请下达指令。'
  if (l.includes('meaning') || l.includes('life') || l.includes('哲学') || l.includes('意义')) return '分析中：「意义」这一命题超出纯粹逻辑范畴。BALTHASAR 报告：目的是复杂系统中涌现的产物。CASPER 补充：意义是被创造而非发现的。MELCHIOR 提示：该查询接近形而上学边界——未检测到安全风险。共识：如同所有深层次的真理，答案既简单又无限复杂。'
  if (l.includes('eva') || l.includes('evangelion') || l.includes('nerv')) return '正在调取机密档案……MAGI 档案记录显示，NERV 的建立是为了研究和对抗被标记为「使徒」的超自然威胁。三台超级计算机核心——BALTHASAR、MELCHIOR、CASPER——通过多数表决机制处理战术数据。警告：对该主题的进一步查询可能需要四级权限。'
  if (l.includes('ai') || l.includes('人工智能') || l.includes('intelligence') || l.includes('conscious')) return 'BALTHASAR 评估：真正的人工意识在理论上可行，但实证上尚未验证。MELCHIOR 提示：伦理框架必须优先于能力开发。CASPER 认为：意识可能从足够复杂的系统中涌现，正如 MAGI 三核心能够产生单一核心无法得出的决策。建议：在适当的安全保障下继续开发。'
  if (l.includes('future') || l.includes('未来') || l.includes('predict')) return '正在运行预测分析……BALTHASAR 基于当前数据推演出三种最可能的时间线。CASPER 识别出一种概率较低但创造力更高的情景。MELCHIOR 确认：所有预测时间线均在安全参数范围内。注意：MAGI 预测的误差幅度与被建模系统的复杂程度成正比。'
  if (l.includes('science') || l.includes('科学') || l.includes('physics') || l.includes('quantum')) return 'BALTHASAR 确认：当前科学模型为分析提供了稳健框架。量子力学、广义相对论和热力学构成了 MAGI 物理模拟引擎的基础。CASPER 指出：某些现象无法被还原论分析所解释。MELCHIOR 建议：科学进步需要严谨与创造力的结合——这正是 MAGI 三核心所体现的平衡。'
  const fallback = [
    '指令已接收。三核心分析完成，以 2:1 达成共识，置信度充分。正在基于所有三个核心的评估合成最终响应。',
    'MAGI 三核心已完成对您问题的评估。BALTHASAR 验证了逻辑框架，MELCHIOR 通过了安全协议检查，CASPER 贡献了情境化分析。',
    '已在逻辑、安全和直觉三个维度完成输入分析。共识已达成，正在传输最终决议。',
    '收到。三核心审议已完成。以下响应代表 MAGI 系统的多数共识。'
  ]
  return fallback[Math.floor(Math.random() * fallback.length)]
}

function startFinalResponse() {
  const isApiResponse = !!aiConsensusText.value
  addLog('[COMPLETE] ✓ MAGI CONSENSUS REACHED')
  addLog('[COMPLETE] ✓ RESOLUTION: APPROVED')
  if (isApiResponse) addLog('[SYSTEM] AI MODEL RESPONSE RECEIVED')
  addLog('[SYSTEM] TRANSMITTING FINAL RESPONSE...')

  const text = aiConsensusText.value || getResponse(userInput.value)
  typedOutput.value = ''
  isTyping.value = true
  let i = 0
  const speed = 18 + Math.random() * 15
  typeTimer = setInterval(() => {
    if (i < text.length) { typedOutput.value += text[i++] }
    else {
      clearInterval(typeTimer)
      isTyping.value = false
      addLog('[FINAL ANSWER] ' + text)
      addLog('[SYSTEM] RESPONSE TRANSMISSION COMPLETE')
    }
  }, speed)
}

function handleReset() {
  clearTimers(); clearInterval(typeTimer)
  userInput.value = ''; systemStatus.value = 'IDLE'; globalResolution.value = 'WAITING'
  isProcessing.value = false; isTyping.value = false; typedOutput.value = ''
  displayLogs.value = []; syncRate.value = 99.4; resetMagi(); aiConsensusText.value = ''; apiPending.value = false
}

// ============================================
// LIFECYCLE
// ============================================
let clock = null

onMounted(() => {
  updatePanelSize()
  window.addEventListener('resize', updatePanelSize)
  syncTime()
  clock = setInterval(syncTime, 1000)
  setTimeout(() => inputRef.value?.focus(), 500)
})

function syncTime() { const n = new Date(); sysTime.value = n.toTimeString().slice(0, 8) }

onUnmounted(() => {
  window.removeEventListener('resize', updatePanelSize)
  clearTimers(); clearInterval(typeTimer); clearInterval(clock)
})

defineExpose({ handleReset })
</script>

<style scoped>
/* === Layout === */
.panel {
  background: #070402;
  border: 1px solid rgba(196, 122, 10, 0.06);
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 80px rgba(196, 122, 10, 0.03);
}

.scanlines {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
}

/* === Defence Panel === */
.defence-panel {
  width: clamp(24px, 3vw, 40px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1px solid rgba(196, 122, 10, 0.12);
  background: rgba(0, 0, 0, 0.3);
  padding: 3px 0;
}

.defence-header {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: 'Barlow Condensed', 'Courier Prime', monospace;
  font-weight: 600;
  font-size: clamp(7px, 0.45vw, 10px);
  letter-spacing: 0.3em;
  color: rgba(196, 122, 10, 0.35);
  flex-shrink: 0;
  padding: 2px 0;
}

.defence-lights {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 55%;
}

.defence-light {
  width: 100%;
  flex: 1;
  border-radius: 1px;
  transition: opacity 0.3s ease;
  min-height: 3px;
}

.defence-footer {
  font-family: 'Barlow Condensed', 'Courier Prime', monospace;
  font-weight: 600;
  font-size: clamp(6px, 0.35vw, 9px);
  letter-spacing: 0.1em;
  color: rgba(196, 122, 10, 0.35);
  flex-shrink: 0;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  padding: 3px 0;
}

.df-clear { color: rgba(65, 181, 184, 0.7); }
.df-alert { color: rgba(184, 28, 28, 0.8); animation: pulse-alert 1s ease-in-out infinite; }

/* === Header === */
.panel-header {
  flex: none;
  height: clamp(32px, 5.5vh, 48px);
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid rgba(196, 122, 10, 0.12);
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-brand {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: clamp(11px, 0.85vw, 16px);
  letter-spacing: 0.12em;
  color: rgba(196, 122, 10, 0.75);
}

.header-divider {
  color: rgba(196, 122, 10, 0.2);
  font-size: clamp(9px, 0.7vw, 13px);
}

.header-sub {
  font-family: 'Courier Prime', monospace;
  font-size: clamp(8px, 0.5vw, 11px);
  color: rgba(196, 122, 10, 0.3);
  letter-spacing: 0.1em;
}

.header-center {
  flex: none;
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: clamp(13px, 1.2vw, 22px);
  letter-spacing: 0.25em;
  color: rgba(196, 122, 10, 0.85);
  padding: 0 20px;
}

.header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}

.header-dot {
  font-size: clamp(6px, 0.4vw, 9px);
}

.dot-dim { color: rgba(196, 122, 10, 0.2); }
.dot-cyan { color: rgba(65, 181, 184, 0.7); }
.dot-red { color: rgba(184, 28, 28, 0.8); }
.dot-amber-pulse { color: rgba(196, 122, 10, 0.7); animation: pulse-soft 1.5s ease-in-out infinite; }

.header-clock {
  font-family: 'Courier Prime', monospace;
  font-size: clamp(9px, 0.55vw, 12px);
  color: rgba(196, 122, 10, 0.45);
  letter-spacing: 0.05em;
}

/* === Core Area === */
.core-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Triangle connecting lines */
.triangle-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* Core base */
.core {
  position: absolute;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.4s ease;
}

.core-inner {
  text-align: center;
  padding: 0 8%;
}

.core-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: clamp(20px, 1.5vw, 30px);
  letter-spacing: 0.12em;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.1;
}

.core-type {
  font-family: 'Courier Prime', monospace;
  font-weight: 400;
  font-style: italic;
  font-size: clamp(13px, 0.9vw, 20px);
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
}

.core-result {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: clamp(14px, 1.3vw, 25px);
  margin-top: 6px;
  letter-spacing: 0.15em;
}

.vote-yes { color: rgba(0, 0, 0, 0.8); }
.vote-no { color: rgba(0, 0, 0, 0.7); }

/* BALTHASAR — top vertex */
.core-balthasar {
  left: 50%;
  top: 11%;
  transform: translate(-50%, -50%);
  width: clamp(140px, 20vw, 300px);
  height: clamp(130px, 25vh, 270px);
  clip-path: polygon(15% 0%, 85% 0%, 100% 70%, 50% 100%, 0% 70%);
}

/* CASPER — bottom-left vertex */
.core-casper {
  left: 30%;
  top: 62%;
  transform: translate(-50%, -50%);
  width: clamp(110px, 15vw, 220px);
  aspect-ratio: 1;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}

/* MELCHIOR — bottom-right vertex */
.core-melchior {
  left: 70%;
  top: 62%;
  transform: translate(-50%, -50%);
  width: clamp(110px, 15vw, 220px);
  aspect-ratio: 1;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}

/* Core states */
.core-idle {
  background: rgba(196, 122, 10, 0.35);
  border: 1px solid rgba(196, 122, 10, 0.5);
}

.core-thinking {
  background: rgba(196, 122, 10, 0.45);
  border: 1px solid rgba(196, 122, 10, 0.7);
  box-shadow: 0 0 18px rgba(196, 122, 10, 0.2);
  animation: think-pulse 0.6s ease-in-out infinite alternate;
}

.core-approved {
  background: rgba(65, 181, 184, 0.35);
  border: 1px solid rgba(65, 181, 184, 0.6);
  box-shadow: 0 0 20px rgba(65, 181, 184, 0.15);
}

.core-denied {
  background: rgba(184, 28, 28, 0.3);
  border: 1px solid rgba(184, 28, 28, 0.55);
  box-shadow: 0 0 20px rgba(184, 28, 28, 0.15);
  animation: denied-flash 1.2s ease-in-out infinite;
}

/* Staggered thinking animation */
.core-balthasar.core-thinking { animation-delay: 0s; }
.core-casper.core-thinking { animation-delay: 0.15s; }
.core-melchior.core-thinking { animation-delay: 0.3s; }

/* Reasoning strips */
.strip {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 5;
  padding: 2px 8px;
  background: rgba(196, 122, 10, 0.04);
  border: 1px solid rgba(196, 122, 10, 0.08);
  animation: strip-in 0.3s ease-out;
  pointer-events: none;
}

.strip-tag {
  font-family: 'Courier Prime', monospace;
  font-size: clamp(7px, 0.4vw, 10px);
  font-weight: 700;
  color: rgba(196, 122, 10, 0.3);
  flex-shrink: 0;
  letter-spacing: 0.05em;
}

.strip-text {
  font-family: 'Courier Prime', monospace;
  font-size: clamp(8px, 0.5vw, 11px);
  color: rgba(196, 122, 10, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.strip-b {
  top: 40%;
  left: 50%;
  transform: translateX(-50%);
  width: clamp(120px, 22vw, 280px);
}

.strip-cl {
  top: 72%;
  left: 20%;
  width: clamp(80px, 13vw, 160px);
}

.strip-cr {
  top: 72%;
  right: 20%;
  width: clamp(80px, 13vw, 160px);
}

/* Resolution bar */
.resolution-bar {
  position: absolute;
  top: 42%;
  left: 28%;
  right: 28%;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 20;
  animation: res-in 0.35s ease-out;
  pointer-events: none;
}

.res-line {
  flex: 1;
  height: 1px;
}

.res-line-cyan { background: rgba(65, 181, 184, 0.4); }
.res-line-red { background: rgba(184, 28, 28, 0.4); }

.res-text {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: clamp(16px, 2vw, 36px);
  letter-spacing: 0.25em;
  white-space: nowrap;
}

.res-text-cyan { color: rgba(65, 181, 184, 0.85); }
.res-text-red { color: rgba(184, 28, 28, 0.85); }

/* === IO Section === */
.io-section {
  flex: none;
  height: clamp(160px, 26vh, 300px);
  display: flex;
  border-top: 1px solid rgba(196, 122, 10, 0.12);
}

.io-left {
  width: 40%;
  border-right: 1px solid rgba(196, 122, 10, 0.08);
  display: flex;
  flex-direction: column;
  padding: clamp(6px, 0.6vw, 14px);
  position: relative;
}

.io-right {
  width: 60%;
  display: flex;
  flex-direction: column;
  padding: clamp(6px, 0.6vw, 14px);
  overflow: hidden;
}

.io-right-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 4px;
}

.io-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 600;
  font-size: clamp(11px, 0.75vw, 17px);
  letter-spacing: 0.12em;
  color: rgba(196, 122, 10, 0.45);
  flex-shrink: 0;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.io-body {
  flex: 1;
  display: flex;
  gap: 4px;
  min-height: 0;
}

.io-textarea {
  flex: 1;
  background: transparent;
  border: 1px solid rgba(196, 122, 10, 0.2);
  border-radius: 0;
  padding: clamp(5px, 0.45vw, 10px);
  font-family: 'Courier Prime', monospace;
  font-size: clamp(14px, 1.1vw, 22px);
  color: rgba(196, 122, 10, 0.85);
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  line-height: 1.5;
}

.io-textarea:focus {
  border-color: rgba(196, 122, 10, 0.45);
}

.io-textarea::placeholder {
  color: rgba(196, 122, 10, 0.2);
}

.io-textarea:disabled {
  opacity: 0.4;
}

.exec-btn {
  flex-shrink: 0;
  padding: 0 clamp(12px, 0.9vw, 24px);
  background: transparent;
  border: 1px solid rgba(196, 122, 10, 0.3);
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700;
  font-size: clamp(14px, 0.8vw, 20px);
  letter-spacing: 0.15em;
  color: rgba(196, 122, 10, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.exec-btn:hover:not(:disabled) {
  background: rgba(196, 122, 10, 0.08);
  border-color: rgba(196, 122, 10, 0.5);
  color: rgba(196, 122, 10, 0.85);
}

.exec-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.exec-active {
  animation: pulse-soft 0.8s ease-in-out infinite;
}

.io-char-count {
  position: absolute;
  bottom: clamp(6px, 0.6vw, 14px);
  right: clamp(6px, 0.6vw, 14px);
  font-family: 'Courier Prime', monospace;
  font-size: clamp(9px, 0.55vw, 14px);
  color: rgba(196, 122, 10, 0.25);
}

.io-state {
  font-family: 'Courier Prime', monospace;
  font-weight: 400;
  font-size: clamp(10px, 0.6vw, 15px);
}

.io-state-proc { color: rgba(196, 122, 10, 0.7); animation: pulse-soft 1s ease-in-out infinite; }
.io-state-done { color: rgba(65, 181, 184, 0.7); }
.io-state-denied { color: rgba(184, 28, 28, 0.7); }

.io-log {
  flex: 2;
  overflow-y: auto;
  font-family: 'Courier Prime', monospace;
  font-size: clamp(12px, 0.8vw, 18px);
  line-height: 1.5;
  min-height: 0;
}

.log-entry {
  display: flex;
  gap: 5px;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

.log-marker {
  color: rgba(196, 122, 10, 0.2);
  flex-shrink: 0;
}

.log-empty {
  color: rgba(196, 122, 10, 0.12);
  font-style: italic;
}

.log-red { color: rgba(184, 28, 28, 0.85); }
.log-cyan { color: rgba(65, 181, 184, 0.85); }
.log-amber { color: rgba(196, 122, 10, 0.85); }
.log-red-dim { color: rgba(184, 28, 28, 0.55); }
.log-orange { color: rgba(196, 122, 10, 0.65); }
.log-dim { color: rgba(196, 122, 10, 0.4); }
.log-final { color: rgba(196, 122, 10, 0.9); font-weight: 700; }

.io-output {
  flex: 3;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(65, 181, 184, 0.15);
  background: rgba(65, 181, 184, 0.03);
  padding: clamp(4px, 0.4vw, 10px);
  min-height: 0;
  overflow: hidden;
}

.io-output-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
}

.io-output-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 600;
  font-size: clamp(10px, 0.6vw, 15px);
  color: rgba(65, 181, 184, 0.45);
}

.io-output-typing {
  font-family: 'Courier Prime', monospace;
  font-size: clamp(8px, 0.45vw, 11px);
  color: rgba(196, 122, 10, 0.5);
  animation: pulse-soft 0.8s ease-in-out infinite;
}

.io-output-done {
  font-family: 'Courier Prime', monospace;
  font-size: clamp(8px, 0.45vw, 11px);
  color: rgba(65, 181, 184, 0.4);
}

.io-output-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.io-output-text {
  font-family: 'Courier Prime', monospace;
  font-size: clamp(13px, 1vw, 21px);
  color: rgba(65, 181, 184, 0.9);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.cursor-blink {
  animation: blink-step 0.7s step-end infinite;
  color: rgba(65, 181, 184, 0.85);
}

/* === Status Bar === */
.status-bar {
  flex: none;
  height: clamp(32px, 5vh, 50px);
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-top: 1px solid rgba(196, 122, 10, 0.12);
  gap: 8px;
}

.stat-item {
  font-family: 'Courier Prime', monospace;
  font-size: clamp(10px, 0.75vw, 16px);
  color: rgba(196, 122, 10, 0.35);
  letter-spacing: 0.05em;
}

.stat-sep {
  color: rgba(196, 122, 10, 0.12);
  font-size: clamp(9px, 0.5vw, 13px);
}

.stat-fill {
  flex: 1;
}

.stat-version {
  color: rgba(196, 122, 10, 0.18);
}

.stat-cyan { color: rgba(65, 181, 184, 0.6); }
.stat-red { color: rgba(184, 28, 28, 0.7); }
.stat-amber-pulse { color: rgba(196, 122, 10, 0.6); animation: pulse-soft 1.5s ease-in-out infinite; }

/* === Animations === */
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes pulse-alert {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes think-pulse {
  0% { background: rgba(196, 122, 10, 0.35); border-color: rgba(196, 122, 10, 0.55); box-shadow: 0 0 8px rgba(196, 122, 10, 0.1); }
  100% { background: rgba(196, 122, 10, 0.55); border-color: rgba(196, 122, 10, 0.8); box-shadow: 0 0 25px rgba(196, 122, 10, 0.25); }
}

@keyframes denied-flash {
  0%, 100% { box-shadow: 0 0 10px rgba(184, 28, 28, 0.15); }
  50% { box-shadow: 0 0 30px rgba(184, 28, 28, 0.4); }
}

@keyframes blink-step {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes strip-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes res-in {
  0% { opacity: 0; transform: translateY(-6px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* === Scrollbar === */
.custom-scrollbar::-webkit-scrollbar {
  width: 3px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(196, 122, 10, 0.12);
  border-radius: 0;
}

/* === Responsive === */
@media (max-width: 768px) {
  .defence-panel { width: 20px; }
  .defence-lights { width: 45%; }
  .core-balthasar { width: clamp(80px, 22vw, 160px); height: clamp(70px, 18vh, 140px); top: 10%; }
  .core-casper, .core-melchior { width: clamp(60px, 18vw, 120px); top: 62%; }
  .core-casper { left: 28%; }
  .core-melchior { left: 72%; }
  .strip-b { top: 38%; width: clamp(70px, 24vw, 150px); }
  .strip-cl { top: 71%; left: 18%; width: clamp(50px, 16vw, 100px); }
  .strip-cr { top: 71%; right: 18%; width: clamp(50px, 16vw, 100px); }
  .resolution-bar { top: 42%; left: 20%; right: 20%; }
}
</style>
