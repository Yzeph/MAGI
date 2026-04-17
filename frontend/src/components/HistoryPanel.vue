<template>
  <div class="history-panel-v2">
    <!-- 主界面：左侧列表，右侧详情（如果有选中项） -->
    <div class="panel-layout" :class="{ 'has-selection': selectedItem }">
      
      <!-- 左侧：历史记录列表 -->
      <div class="history-list-container">
        <!-- 列表状态：加载中 -->
        <div v-if="loading" class="status-msg">
          <div class="loading-spinner"></div>
          <div>读取数据库中...</div>
        </div>

        <!-- 列表状态：空数据 -->
        <div v-else-if="!history || history.length === 0" class="status-msg">
          <div>无历史记录数据</div>
        </div>

        <!-- 列表状态：数据展示 -->
        <div v-else class="history-list">
          <div
            v-for="item in history"
            :key="item.id"
            class="history-item"
            :class="{ active: selectedItem && selectedItem.id === item.id }"
            @click="selectItem(item)"
          >
            <div class="item-question">{{ item.question }}</div>
            <div class="item-meta">
              <span class="time">{{ formatTime(item.created_at) }}</span>
              <span class="vote-badge" :class="getVoteClass(item)">
                {{ item.balthasar_vote ? '✓' : '✗' }}
                {{ item.casper_vote ? '✓' : '✗' }}
                {{ item.melchior_vote ? '✓' : '✗' }}
              </span>
            </div>
            <div class="item-id-tag">ID: {{ (item.id || '').substring(0, 8) }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧：详情面板（绝对居中/或占据右侧半屏） -->
      <div v-if="selectedItem" class="detail-panel">
        <div class="detail-header">
          <span class="detail-title">FILE_REF: {{ selectedItem.id }}</span>
        </div>
        <div class="detail-content">
          <div class="detail-section">
            <div class="detail-label">【 提 訴 内 容 】</div>
            <div class="detail-text question-text">
              <MarkdownRenderer :content="selectedItem.question" />
            </div>
          </div>
          
          <div class="detail-section consensus-section">
            <div class="detail-label">【 最 終 決 議 】</div>
            <div class="vote-result-large" :class="getVoteClass(selectedItem)">
              MAGI SYSTEM VOTE:
              <span class="v">[M: {{ selectedItem.melchior_vote ? '合' : '否' }}]</span>
              <span class="v">[B: {{ selectedItem.balthasar_vote ? '合' : '否' }}]</span>
              <span class="v">[C: {{ selectedItem.casper_vote ? '合' : '否' }}]</span>
            </div>
            <div class="detail-text consensus-text">
              <MarkdownRenderer :content="selectedItem.consensus || '未形成共识或记录丢失'" />
            </div>

            <!-- 三贤者独立看法区 -->
            <div class="magi-thoughts-section" v-if="selectedItem.balthasar_phase3 || selectedItem.casper_phase3">
              <div class="detail-label sub-label">【 附 议 反 馈 】</div>
              
              <div class="thought-block" v-if="selectedItem.balthasar_phase3">
                <div class="thought-header balthasar">BALTHASAR <span class="vote-result" :class="selectedItem.balthasar_vote ? 'success' : 'danger'">[{{ selectedItem.balthasar_vote ? '合' : '否' }}]</span></div>
                <div class="thought-content detail-text">
                  <MarkdownRenderer :content="selectedItem.balthasar_phase3" />
                </div>
              </div>

              <div class="thought-block" v-if="selectedItem.casper_phase3">
                <div class="thought-header casper">CASPER <span class="vote-result" :class="selectedItem.casper_vote ? 'success' : 'danger'">[{{ selectedItem.casper_vote ? '合' : '否' }}]</span></div>
                <div class="thought-content detail-text">
                  <MarkdownRenderer :content="selectedItem.casper_phase3" />
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      <!-- 如果没有选中，右侧显示一个MAGI的待机Logo -->
      <div v-else class="detail-placeholder">
        <div class="placeholder-logo">MAGI</div>
        <div class="placeholder-text">SELECT A RECORD TO VIEW DETAILS</div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MarkdownRenderer from './MarkdownRenderer.vue'

defineEmits(['close'])

const history = ref([])
const loading = ref(true)
const selectedItem = ref(null)

onMounted(async () => {
  try {
    const response = await fetch('/api/history?limit=50')
    const data = await response.json()
    history.value = data.data || []
  } catch (error) {
    console.error('获取历史记录失败:', error)
  } finally {
    loading.value = false
  }
})

function formatTime(dateStr) {
  if (!dateStr) return 'UNKNOWN_TIME'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getVoteClass(item) {
  const votes = [item.balthasar_vote, item.casper_vote, item.melchior_vote].filter(Boolean).length
  return votes >= 2 ? 'success' : votes === 1 ? 'warning' : 'danger'
}

function selectItem(item) {
  selectedItem.value = item
}
</script>

<style scoped>

.history-panel-v2 {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: transparent;
  color: #E17814;
}

.panel-layout {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 20px;
}

/* =========================================
   左侧：历史列表
   ========================================= */
.history-list-container {
  flex: 1;
  max-width: 35%;
  height: 100%;
  border-right: 2px dashed rgba(225, 120, 20, 0.4);
  display: flex;
  flex-direction: column;
  padding-right: 15px;
}

.status-msg {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 16px;
  color: rgba(225, 120, 20, 0.6);
  letter-spacing: 2px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(225, 120, 20, 0.3);
  border-top-color: #E17814;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin { 
  to { transform: rotate(360deg); } 
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 5px 10px 5px 0;
}

.history-item {
  position: relative;
  border: 1px solid rgba(225, 120, 20, 0.4);
  background: rgba(20, 10, 0, 0.4);
  padding: 15px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.history-item::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: transparent;
  transition: background 0.2s;
}

.history-item:hover {
  background: rgba(225, 120, 20, 0.1);
  border-color: rgba(225, 120, 20, 0.8);
  transform: translateX(5px);
}

.history-item.active {
  background: rgba(225, 120, 20, 0.15);
  border-color: #E17814;
}

.history-item.active::before {
  background: #E17814;
}

.item-question {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #ffaa44;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(225, 120, 20, 0.7);
}

.vote-badge {
  font-weight: bold;
  letter-spacing: 2px;
  padding: 2px 6px;
  background: rgba(0,0,0,0.5);
  border: 1px solid currentColor;
}

.vote-badge.success { color: #00ff88; }
.vote-badge.warning { color: #ffaa00; }
.vote-badge.danger  { color: #ff0055; }

.item-id-tag {
  position: absolute;
  top: 5px; right: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: rgba(225, 120, 20, 0.3);
}

/* =========================================
   右侧：详情面板 (居中效果)
   ========================================= */
.detail-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(10, 5, 0, 0.6);
  border: 2px solid #E17814;
  box-shadow: inset 0 0 30px rgba(225, 120, 20, 0.1);
  position: relative;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(225, 120, 20, 0.15);
  border-bottom: 2px solid #E17814;
}

.detail-title {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 2px;
}

.detail-close {
  background: none;
  border: 1px solid #E17814;
  color: #E17814;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;
}

.detail-close:hover {
  background: #E17814;
  color: #000;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-label {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 900;
  color: #E17814;
  border-bottom: 2px solid rgba(225, 120, 20, 0.3);
  padding-bottom: 10px;
  letter-spacing: 5px;
}

.detail-text {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(225, 120, 20, 0.3);
  padding: 25px;
  font-size: 16px;
  line-height: 1.8;
  color: #ffbd66;
  font-family: var(--font-mono);
}

.question-text {
  font-size: 18px;
  border-left: 4px solid #E17814;
}

.consensus-section {
  flex: 1;
}

.vote-result-large {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: bold;
  padding: 10px;
  text-align: center;
  background: rgba(0,0,0,0.8);
  border: 1px dashed currentColor;
  margin-bottom: 10px;
  letter-spacing: 2px;
}

.vote-result-large.success { color: #00A0A0; border-color: #00A0A0; }
.vote-result-large.warning { color: #ffaa00; border-color: #ffaa00; }
.vote-result-large.danger  { color: #ff0055; border-color: #ff0055; }

.v { margin: 0 10px; }

/* =========================================
   三贤者独立看法区 (Phase 3)
   ========================================= */
.magi-thoughts-section {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sub-label {
  font-size: 18px;
  color: #ffaa44;
  border-bottom: 1px dashed rgba(225, 120, 20, 0.3);
  margin-bottom: 5px;
}

.thought-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-left: 3px solid #E17814;
  padding: 10px 0 10px 15px;
}

.thought-header {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.thought-header.balthasar { color: #E17814; }
.thought-header.casper { color: #E17814; }

.vote-result {
  font-size: 14px;
}
.vote-result.success { color: #00ff88; }
.vote-result.danger { color: #ff0055; }

.thought-content.detail-text {
  padding: 15px;
  background: rgba(20, 10, 0, 0.3);
  border: 1px solid rgba(225, 120, 20, 0.2);
  margin-right: 15px;
  font-size: 14px;
}

/* =========================================
   右侧：无选中时的占位
   ========================================= */
.detail-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(10, 5, 0, 0.3);
  border: 2px dashed rgba(225, 120, 20, 0.2);
}

.placeholder-logo {
  font-family: var(--font-serif);
  font-size: 120px;
  font-weight: 900;
  color: rgba(225, 120, 20, 0.1);
  letter-spacing: 20px;
  margin-bottom: 20px;
}

.placeholder-text {
  font-family: var(--font-mono);
  font-size: 18px;
  color: rgba(225, 120, 20, 0.3);
  letter-spacing: 5px;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 定制滚动条 */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: rgba(20, 10, 0, 0.5);
  border-left: 1px solid rgba(225, 120, 20, 0.2);
}
::-webkit-scrollbar-thumb {
  background: rgba(225, 120, 20, 0.5);
}
::-webkit-scrollbar-thumb:hover {
  background: #E17814;
}
</style>
