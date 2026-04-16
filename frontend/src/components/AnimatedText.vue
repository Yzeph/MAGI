<template>
  <div class="animated-text">
    <span v-if="displayedText">{{ displayedText }}</span>
    <span v-if="isAnimating" class="cursor">▌</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  speed: {
    type: Number,
    default: 30 // 毫秒 per 字符
  }
})

const displayedText = ref('')
const isAnimating = ref(false)
let animationTimer = null

function startAnimation(newText) {
  if (animationTimer) clearTimeout(animationTimer)

  isAnimating.value = true
  displayedText.value = ''
  let currentIndex = 0

  const animate = () => {
    if (currentIndex < newText.length) {
      displayedText.value += newText[currentIndex]
      currentIndex++
      animationTimer = setTimeout(animate, props.speed)
    } else {
      isAnimating.value = false
    }
  }

  animate()
}

watch(
  () => props.text,
  (newText) => {
    if (newText) {
      startAnimation(newText)
    }
  }
)
</script>

<style scoped>
.animated-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: inherit;
}

.cursor {
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
