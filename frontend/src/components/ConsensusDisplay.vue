<template>
  <div class="consensus-display" v-if="conversation">
    <div class="consensus-container">
      <div class="consensus-header">
        <span class="header-title">⬢ 共识</span>
      </div>

      <div class="consensus-content">
        <AnimatedMarkdownText :text="conversation.consensus" :speed="20" />
      </div>

      <div class="consensus-footer">
        <div class="voting-stats">
          <span class="stat-item" :class="getVoteClass('agreement')">
            {{ getAgreementCount() }}/3
          </span>
          <span class="stat-item">•</span>
          <span class="stat-item" :class="getVoteClass('percentage')">
            {{ getConsensusPercentage() }}%
          </span>
        </div>

        <VotingPanel :conversation="conversation" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AnimatedMarkdownText from './AnimatedMarkdownText.vue'
import VotingPanel from './VotingPanel.vue'

const props = defineProps({
  conversation: {
    type: Object,
    default: null
  }
})

const conversation = computed(() => props.conversation)

function getAgreementCount() {
  if (!conversation.value) return 0
  const votes = conversation.value.votes || {}
  return Object.values(votes).filter(v => v === true).length
}

function getConsensusPercentage() {
  if (!conversation.value) return 0
  const agreement = getAgreementCount()
  return Math.round((agreement / 3) * 100)
}

function getVoteClass(type) {
  if (type === 'agreement') {
    const count = getAgreementCount()
    return count >= 2 ? 'success' : count === 1 ? 'warning' : 'danger'
  } else if (type === 'percentage') {
    const percentage = getConsensusPercentage()
    return percentage >= 67 ? 'success' : percentage >= 33 ? 'warning' : 'danger'
  }
  return ''
}
</script>

<style scoped>
.consensus-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 200px;
}

.consensus-container {
  border: 2px solid var(--neon-cyan);
  border-radius: 0;
  background: rgba(0, 229, 255, 0.05);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.15);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.consensus-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-bottom: 1px solid var(--neon-cyan);
  background: rgba(0, 229, 255, 0.1);
}

.header-title {
  color: var(--neon-cyan);
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
  text-shadow: 0 0 8px var(--neon-cyan);
}

.consensus-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  color: var(--neon-green);
  line-height: 1.6;
  font-size: 11px;
  font-family: var(--font-mono);
}

.consensus-footer {
  padding: 8px;
  border-top: 1px solid rgba(0, 229, 255, 0.3);
  background: rgba(0, 229, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.voting-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  font-weight: bold;
}

.stat-item {
  padding: 3px 6px;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-item.success {
  color: var(--neon-green);
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid var(--neon-green);
}

.stat-item.warning {
  color: var(--neon-gold);
  background: rgba(255, 170, 0, 0.1);
  border: 1px solid var(--neon-gold);
}

.stat-item.danger {
  color: var(--neon-red);
  background: rgba(255, 0, 85, 0.1);
  border: 1px solid var(--neon-red);
}

/* 滚动条 */
.consensus-content::-webkit-scrollbar {
  width: 4px;
}

.consensus-content::-webkit-scrollbar-track {
  background: rgba(0, 229, 255, 0.1);
}

.consensus-content::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.3);
  border-radius: 2px;
}

.consensus-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 229, 255, 0.5);
}
</style>
