<template>
  <div class="voting-panel" v-if="conversation">
    <div class="voting-title">投票</div>

    <div class="votes-container">
      <div
        v-for="(vote, aiName) in conversation.votes"
        :key="aiName"
        class="vote-item"
        :class="vote ? 'vote-agree' : 'vote-disagree'"
      >
        <span class="vote-ai">{{ aiName }}</span>
        <span class="vote-result">{{ vote ? '✓' : '✗' }}</span>
      </div>
    </div>

    <div class="user-vote-section">
      <div class="vote-prompt">您的投票</div>
      <div class="user-vote-buttons">
        <button
          class="vote-btn agree"
          @click="submitVote(true)"
          :disabled="hasVoted"
        >
          ✓ 同意
        </button>
        <button
          class="vote-btn disagree"
          @click="submitVote(false)"
          :disabled="hasVoted"
        >
          ✗ 反对
        </button>
      </div>
      <div v-if="hasVoted" class="vote-status">
        已投票
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  }
})

const hasVoted = ref(false)

async function submitVote(choice) {
  try {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversationId: props.conversation.conversationId,
        userId: `user_${Date.now()}`,
        voteChoice: choice
      })
    })

    if (response.ok) {
      hasVoted.value = true
      console.log('✅ 投票已提交')
    }
  } catch (error) {
    console.error('❌ 投票提交失败:', error)
  }
}
</script>

<style scoped>
.voting-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.voting-title {
  color: var(--neon-cyan);
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--neon-cyan);
}

.votes-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vote-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.vote-item.vote-agree {
  background: rgba(0, 255, 136, 0.15);
  color: var(--neon-green);
  border-left: 2px solid var(--neon-green);
}

.vote-item.vote-disagree {
  background: rgba(255, 0, 85, 0.15);
  color: var(--neon-red);
  border-left: 2px solid var(--neon-red);
}

.vote-ai {
  min-width: 60px;
  font-family: var(--font-mono);
}

.vote-result {
  text-shadow: 0 0 5px currentColor;
  font-size: 11px;
}

/* 用户投票区 */
.user-vote-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(0, 229, 255, 0.2);
}

.vote-prompt {
  color: var(--neon-gold);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: bold;
}

.user-vote-buttons {
  display: flex;
  gap: 6px;
}

.vote-btn {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid;
  border-radius: 2px;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: var(--font-mono);
}

.vote-btn.agree {
  border-color: var(--neon-green);
  color: var(--neon-green);
  background: rgba(0, 255, 136, 0.1);
}

.vote-btn.agree:hover:not(:disabled) {
  background: rgba(0, 255, 136, 0.2);
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
}

.vote-btn.disagree {
  border-color: var(--neon-red);
  color: var(--neon-red);
  background: rgba(255, 0, 85, 0.1);
}

.vote-btn.disagree:hover:not(:disabled) {
  background: rgba(255, 0, 85, 0.2);
  box-shadow: 0 0 10px rgba(255, 0, 85, 0.3);
}

.vote-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vote-status {
  color: var(--neon-green);
  font-size: 10px;
  text-align: center;
  padding: 4px;
  background: rgba(0, 255, 136, 0.1);
  border-radius: 2px;
  text-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
  border: 1px solid var(--neon-green);
}
</style>
