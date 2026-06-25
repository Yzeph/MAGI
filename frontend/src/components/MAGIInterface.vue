<template>
  <div
    class="magi-app"
    :data-loading="loading ? 'true' : null"
    :data-status="pageStatus"
    :data-vote-status="finalVoteStatus"
  >
    <h2 class="magi-logo">MAGI</h2>

    <div class="magi-box" @click="handleBoxClick">
      <!-- HEADER -->
      <header>
        <h1>提訴</h1>
        <h1>決議</h1>
      </header>

      <!-- CONFIG BOX -->
      <div class="config-box">
        <h4>Code: <b class="code">{{ randomCode }}</b></h4>
        <p>File: <b class="file">MAGI_SYS</b></p>
        <p>Volume: <b class="volume" :data-text="volume"></b></p>
        <p>EX_MODE: <b class="ex-mode" data-text="OFF"></b></p>
        <p>Priority: <b class="priority" data-text="AAA"></b></p>
        <p>Sound: <b class="sound" data-text="ON"></b></p>
        <b class="reset" @click.stop="handleReset">RESET</b>
      </div>

      <!-- VOTE STATUS -->
      <div class="final-vote-status" :data-status="finalVoteStatus"></div>

      <!-- THREE CORES -->
      <div class="magi-list">
        <div class="magi-item melchior" :data-status="getCoreStatus('MELCHIOR')">
          <h3>MELCHIOR</h3>
          <h2></h2>
        </div>
        <div class="magi-item malthasar" :data-status="getCoreStatus('BALTHASAR')">
          <h2></h2>
          <h3>BALTHASAR</h3>
        </div>
        <div class="magi-item casper" :data-status="getCoreStatus('CASPER')">
          <h3>CASPER</h3>
          <h2></h2>
        </div>
      </div>

      <!-- QUESTION INPUT -->
      <div class="query-bar">
        <div class="qb-label">QUESTION</div>
        <div class="qb-row">
          <textarea
            v-model="question" class="qb-input"
            placeholder="电车难题，牺牲少数拯救多数。"
            @keydown.enter.exact="handleQuery" @click.stop
            :disabled="isQuerying" rows="1"
          ></textarea>
          <button class="qb-btn" @click.stop="handleQuery" :disabled="!question.trim() || isQuerying">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- FOOTER -->
      <footer>
        <a @click.stop="showHistory = true">LOG</a>
        <span>·</span>
        <span>MAGI v2.0</span>
        <span>·</span>
        <span class="ft-status" :class="{ active: wsStatus === 'connected' }">
          {{ wsStatus === 'connected' ? 'ONLINE' : 'OFFLINE' }}
        </span>
      </footer>
    </div>

    <!-- OVERLAY -->
    <div v-if="showHistory" class="history-overlay" @click.self="showHistory = false">
      <div class="ho-box">
        <div class="ho-header">
          <span>SYSTEM LOG</span>
          <b class="reset" @click="showHistory = false">CLOSE</b>
        </div>
        <HistoryPanel @close="showHistory = false" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import HistoryPanel from './HistoryPanel.vue'
import { useWebSocket } from '../composables/useWebSocket.js'
import { useDebate } from '../composables/useDebate.js'

const showHistory = ref(false)
const question = ref('')
const loading = ref(true)
const randomCode = ref(264)
const volume = ref(66)

const {
  isQuerying, currentPhase, currentConversation,
  currentPhase1, currentPhase2, currentPhase3,
  currentVote, phase3ByAgent, handleWebSocketMessage,
  submitQuestion, reset, finalizeToResult,
} = useDebate()

const { status: wsStatus, connect, send } = useWebSocket({
  onMessage: (data) => { handleWebSocketMessage(data) }
})

onMounted(() => {
  connect()
  randomCode.value = 100 + Math.floor(Math.random() * 600)
  setTimeout(() => { loading.value = false }, 1000)
})

const pageStatus = computed(() => {
  if (isQuerying.value) return 'voting'
  if (currentVote.value && Object.keys(currentVote.value).length > 0) return 'voted'
  return null
})

const finalVoteStatus = computed(() => {
  if (!currentVote.value) return ''
  const votes = Object.values(currentVote.value)
  const yes = votes.filter(v => v === true).length
  const no = votes.filter(v => v === false).length
  if (yes >= 2) return 'resolve'
  if (no >= 2) return 'reject'
  return ''
})

function getCoreStatus(name) {
  const v = currentVote.value?.[name]
  if (v === true) return 'resolve'
  if (v === false) return 'reject'
  return ''
}

function handleBoxClick() {}

function handleQuery() {
  if (!question.value.trim() || isQuerying.value) return
  const sent = send(submitQuestion(question.value))
  if (sent) question.value = ''
}

function handleReset() { reset() }
</script>

<style scoped>
/* ============================================
   MAGI System — faithful to itorr/magi
   Base: 2em = 32px (matches html{font-size:2em})
   Sizing uses em/rem, scales via font-size
   ============================================ */

/* ---- Root / Variables ---- */
.magi-app {
  --color-orange: #FF8C00;
  --color-yellow: #FFFF00;
  --color-green: #7FFF00;
  --color-black: #000;
  --color-red: #CC0000;
  --body-padding: 20px;
  --app-height: 100vh;
  --flash-time: 0.4s;

  font-size: 2em;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-weight: 900;
  font-family: 'Playfair Display', 'Noto Serif SC', 'Georgia', serif;
  background: var(--color-black);
  color: var(--color-orange);
  text-align: center;
  position: relative;
  box-sizing: border-box;
  -webkit-text-size-adjust: none;
}

/* ---- Inset Border ---- */
.magi-app::before {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 100;
  box-shadow: 0 0 0 var(--body-padding) var(--color-orange) inset;
  transition: color 1s ease, box-shadow 1s ease;
}

.magi-app[data-loading="true"]::before {
  box-shadow: 0 0 0 0 var(--color-orange) inset;
}

.magi-app[data-vote-status="resolve"]::before {
  box-shadow: 0 0 0 var(--body-padding) var(--color-green) inset;
}

.magi-app[data-vote-status="reject"]::before {
  box-shadow: 0 0 0 var(--body-padding) var(--color-red) inset;
}

h1, h2, h3, h4, p { margin: 0; }
a { color: currentColor; text-decoration: none; }
::selection { background: none; }

/* ---- MAGI Logo (absolutely centered) ---- */
.magi-logo {
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  margin: auto;
  width: 8em;
  height: 8em;
  line-height: 8em;
  border-radius: 9em;
  font-size: 2em;
  box-shadow: 0 0 0 .18em currentColor;
  pointer-events: none;
  z-index: 1;
  transition: top 1s ease, transform 1s ease;
}

.magi-app[data-loading="true"] .magi-logo {
  top: 0;
  transform: scale(4);
  transition: transform .3s ease;
}

/* ---- magi-box ---- */
.magi-box {
  margin: var(--body-padding);
  padding: var(--body-padding);
  position: relative;
  box-sizing: border-box;
  height: calc(100% - var(--body-padding) * 2);
  cursor: pointer;
  z-index: 2;
  transition: transform 1.4s ease-out, opacity .5s ease;
}

.magi-app[data-loading="true"] .magi-box {
  transform: scale(.9);
  opacity: 0;
}

/* ---- Header: 提訴 / 決議 ---- */
header::after {
  content: '';
  display: block;
  clear: both;
}

header h1 {
  font-size: 4em;
  display: inline-block;
  transform: scale(1, .8);
  position: relative;
  padding: 0 .1em;
  margin: 0 .05em;
  letter-spacing: .1em;
}

header h1:nth-child(1) { float: left; }
header h1:nth-child(2) { float: right; }

header h1::before,
header h1::after {
  content: '';
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  border-radius: .5px;
}

header h1::before {
  top: 0;
  box-shadow:
    0 0 0 2px currentColor,
    0 -8px 0 .5px var(--color-black),
    0 -8px 0 2px currentColor;
}

header h1::after {
  bottom: 0;
  box-shadow:
    0 0 0 2px currentColor,
    0 8px 0 .5px var(--color-black),
    0 8px 0 2px currentColor;
}

/* ---- Config Box ---- */
.config-box {
  font-weight: 200;
  font-family: 'Courier New', 'Noto Sans SC', monospace;
  font-size: .8em;
  text-align: left;
  padding: 2em .3em;
  text-transform: uppercase;
}

.config-box h4 {
  font-size: 3em;
  transform: scale(.6, 1);
  transform-origin: 0 0;
}

.config-box p {
  line-height: 1.4;
  transform: scale(1, 1.4);
}

[data-text]::before { content: attr(data-text); }
[data-text="ERR"] { pointer-events: none; }
.volume::after { content: '%'; }
.volume[data-text="1"]::before { content: '0.0000001'; }

.config-box .reset {
  visibility: hidden;
  display: inline-block;
  margin: 1em 0;
  padding: 0 .3em;
  line-height: 1.4;
  box-shadow: 0 0 0 .1em currentColor;
  cursor: pointer;
  font-family: inherit;
  font-weight: 700;
  font-size: 1em;
  background: none;
  color: currentColor;
  border: none;
}

.config-box .reset:hover {
  background: rgba(255, 140, 0, 0.1);
}

/* ---- Final Vote Status ---- */
.final-vote-status {
  position: absolute;
  font-size: 2.5em;
  top: 3.4em;
  right: .5em;
  line-height: 1;
  padding: .1em 0;
  visibility: hidden;
  box-shadow:
    0 0 0 .03em currentColor,
    0 0 0 .07em var(--color-black),
    0 0 0 .1em currentColor;
}

.final-vote-status::before {
  display: inline-block;
  transform: scale(.85, 1);
}

.final-vote-status[data-status="reject"] {
  color: var(--color-red);
}
.final-vote-status[data-status="reject"]::before {
  content: '否定';
}

.final-vote-status[data-status="resolve"] {
  color: var(--color-green);
}
.final-vote-status[data-status="resolve"]::before {
  content: '承認';
}

/* ---- Three Cores ---- */
.magi-list {
  position: relative;
  height: 100%;
}

.magi-item {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8em;
  height: 8em;
  display: inline-block;
  box-shadow:
    0 0 0 .1em var(--color-black),
    0 0 0 .4em currentColor,
    0 0 0 .5em var(--color-black);
  background: var(--color-green);
  text-align: center;
  padding: 0;
  font-family: 'Courier New', monospace;
  transition: background .4s, box-shadow .4s;
}

.magi-item h2 {
  font-size: 4em;
  font-weight: 900;
  transform: scale(1.2, 1);
  line-height: 1.5;
  color: var(--color-black);
}

.magi-item h3 {
  font-size: 1em;
  line-height: 2em;
  letter-spacing: .1em;
  color: var(--color-black);
}

.magi-item.melchior {
  transform: translate(35%, 10%) rotate(-57deg);
}
.magi-item.melchior h2::before { content: '1'; }

.magi-item.malthasar {
  transform: translate(-50%, -135%);
}
.magi-item.malthasar h2::before { content: '2'; }

.magi-item.casper {
  transform: translate(-35%, 10%) rotate(57deg);
}
.magi-item.casper h2::before { content: '3'; }

/* Core results */
.magi-item[data-status="resolve"] { background: var(--color-green); }

.magi-item[data-status="reject"] {
  background: var(--color-red);
  animation: red-flash 1s infinite ease;
}

@keyframes red-flash {
  70% { background: #BB0000; }
}

/* ---- Voting Animation ---- */
.magi-app[data-status="voting"] .magi-box > * { pointer-events: none; }

.magi-app[data-status="voting"] .magi-item {
  animation: magi-flash var(--flash-time) infinite step-end;
}

.magi-app[data-status="voting"] .magi-item h2::before {
  font-size: .6em;
  font-family: 'Playfair Display', serif;
  content: '承認';
  animation: value-flash var(--flash-time) infinite step-end;
}

.magi-app[data-status="voting"] .magi-item.melchior { animation-delay: .1s; }
.magi-app[data-status="voting"] .magi-item.malthasar { animation-delay: .2s; }
.magi-app[data-status="voting"] .magi-item.casper { animation-delay: .3s; }

@keyframes magi-flash {
  50% { background-color: var(--color-red); }
}

@keyframes value-flash {
  50% { content: '否定'; }
}

/* Vote status during voting */
.magi-app[data-status="voting"] .final-vote-status {
  visibility: visible;
  animation: vote-flash var(--flash-time) infinite step-end;
  color: var(--color-yellow);
}

.magi-app[data-status="voting"] .final-vote-status::before {
  content: '審議中';
}

@keyframes vote-flash {
  60% { visibility: hidden; }
}

/* Voted state */
.magi-app[data-status="voted"] .config-box .reset {
  visibility: visible;
}

.magi-app[data-status="voted"] .final-vote-status {
  visibility: visible;
  margin: 0 .5em;
}

.magi-app[data-status="voted"] .magi-item h2::before {
  font-size: .6em;
  font-family: 'Playfair Display', serif;
}

.magi-app[data-status="voted"] .magi-item[data-status="resolve"] h2::before {
  content: '承認';
}

.magi-app[data-status="voted"] .magi-item[data-status="reject"] h2::before {
  content: '否定';
}

/* ---- Query Bar ---- */
.query-bar {
  position: absolute;
  bottom: 2.2em;
  left: 0;
  right: 0;
  padding: 0 1em;
  z-index: 10;
}

.qb-label {
  font-family: 'Courier New', monospace;
  font-size: .25em;
  letter-spacing: .3em;
  text-transform: uppercase;
  opacity: .4;
  text-align: left;
  margin-bottom: .2em;
  font-weight: 400;
}

.qb-row {
  display: flex;
  align-items: center;
  gap: .3em;
}

.qb-input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 140, 0, 0.3);
  color: var(--color-orange);
  font-family: 'Courier New', monospace;
  font-size: .35em;
  padding: .2em 0;
  outline: none;
  resize: none;
  letter-spacing: .05em;
  line-height: 1.5;
  cursor: text;
}

.qb-input:focus { border-bottom-color: var(--color-orange); }
.qb-input::placeholder { color: rgba(255, 140, 0, 0.3); }
.qb-input:disabled { opacity: .4; }

.qb-btn {
  background: transparent;
  border: 1px solid rgba(255, 140, 0, 0.4);
  color: var(--color-orange);
  width: 1.6em;
  height: 1.4em;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s;
  flex-shrink: 0;
  padding: 0;
}

.qb-btn:hover:not(:disabled) {
  background: rgba(255, 140, 0, 0.15);
  border-color: var(--color-orange);
}
.qb-btn:disabled { opacity: .25; cursor: not-allowed; }

.qb-btn svg {
  width: .7em;
  height: .7em;
}

/* ---- Footer ---- */
footer {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: .25em;
  padding: .5em .7em;
  font-weight: 400;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: .05em;
  opacity: .6;
  transition: transform .3s ease, opacity .3s ease;
}

.magi-app[data-loading="true"] footer {
  opacity: 0;
  transform: translate(0, 10px);
}

footer a { cursor: pointer; }
footer a:hover { opacity: .8; }

.ft-status.active {
  color: var(--color-green);
  text-shadow: 0 0 6px rgba(127, 255, 0, 0.3);
}

/* ---- History Overlay ---- */
.history-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ho-box {
  width: min(85vw, 700px);
  height: min(75vh, 500px);
  background: #000;
  border: 1px solid var(--color-orange);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ho-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: .7em 1em;
  border-bottom: 1px solid rgba(255, 140, 0, 0.3);
  font-family: 'Courier New', monospace;
  font-size: .5em;
  text-transform: uppercase;
  letter-spacing: .15em;
}

.ho-header .reset {
  background: none;
  border: 1px solid rgba(255, 140, 0, 0.35);
  color: var(--color-orange);
  font-family: 'Courier New', monospace;
  font-size: .7em;
  padding: .2em .5em;
  cursor: pointer;
  letter-spacing: .15em;
}

.ho-header .reset:hover {
  background: rgba(255, 140, 0, 0.1);
}

/* ---- Responsive Breakpoints ---- */
/* Exact same breakpoints as itorr/magi */
@media (max-width: 1000px), (max-height: 800px) {
  .magi-app { font-size: 1.5em; }
}

@media (max-width: 700px), (max-height: 700px) {
  .magi-app { --body-padding: 15px; font-size: 1.2em; }
}

@media (max-width: 700px) {
  .magi-app .magi-logo { top: 20%; }
}

@media (max-width: 520px), (max-height: 520px) {
  .magi-app { --body-padding: 12px; font-size: .9em; }
}

@media (max-width: 400px), (max-height: 400px) {
  .magi-app { --body-padding: 10px; font-size: .8em; }
}
</style>
