<template>
  <div class="question-input-container">
    <div class="input-wrapper">
      <textarea
        v-model="question"
        placeholder="输入您的问题... (Ctrl+Enter 发送)"
        class="input-field cyber-input"
        @keydown.ctrl.enter="submitQuestion"
        :disabled="loading"
      ></textarea>
      <div class="input-footer">
        <span class="char-count">{{ question.length }} / 1000</span>
        <button
          class="submit-btn cyber-button"
          @click="submitQuestion"
          :disabled="!question.trim() || loading"
        >
          {{ loading ? '⏳ 处理中...' : '➤ 提交' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit'])
const question = ref('')

function submitQuestion() {
  if (question.value.trim() && !props.loading) {
    emit('submit', question.value)
    question.value = ''
  }
}
</script>

<style scoped>
.question-input-container {
  width: 100%;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid var(--neon-gold);
  padding: 12px;
  box-shadow: 0 0 15px rgba(255, 170, 0, 0.2);
}

.input-field {
  width: 100%;
  height: 80px;
  padding: 10px;
  border: 1px solid var(--neon-cyan);
  border-radius: 0;
  background: rgba(5, 8, 16, 0.8);
  color: var(--neon-green);
  font-family: var(--font-mono);
  font-size: 12px;
  resize: none;
  outline: none;
  transition: all 0.3s ease;
}

.input-field:focus {
  border-color: var(--neon-green);
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
  background: rgba(5, 8, 16, 0.95);
}

.input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-field::placeholder {
  color: rgba(0, 255, 136, 0.3);
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.char-count {
  color: rgba(0, 255, 136, 0.5);
  font-family: var(--font-mono);
}

.submit-btn {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 1px solid var(--neon-gold);
  background: rgba(255, 170, 0, 0.15);
  color: var(--neon-gold);
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: rgba(255, 170, 0, 0.25);
  box-shadow: 0 0 15px rgba(255, 170, 0, 0.4);
  transform: translateY(-2px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
