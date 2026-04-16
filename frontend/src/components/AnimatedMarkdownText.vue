<template>
  <div class="markdown-body magi-markdown" ref="container"></div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import MarkdownIt from 'markdown-it'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  speed: {
    type: Number,
    default: 20
  }
})

const container = ref(null)
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
})

// 将Markdown渲染为HTML
const renderedHtml = computed(() => {
  return md.render(props.text || '')
})

// 简单地直接更新innerHTML，保证Markdown渲染完整且无标签截断问题
// 如果原来使用了打字机逐字动画导致标签破碎，我们可以先用安全的完整输出+CSS打字机效果代替
watch(renderedHtml, (newHtml) => {
  if (container.value) {
    container.value.innerHTML = newHtml
  }
}, { immediate: true })
</script>

<style scoped>
/* 继承外部 AIWindow.vue 对 .phase-content 传进来的颜色 */
.magi-markdown {
  color: inherit !important;
  font-family: inherit !important;
  font-size: inherit !important;
}

.magi-markdown :deep(p) {
  margin-bottom: 1em;
  color: inherit;
}

.magi-markdown :deep(h1), 
.magi-markdown :deep(h2), 
.magi-markdown :deep(h3), 
.magi-markdown :deep(h4) {
  color: inherit;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: bold;
  border-bottom: 1px dotted rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;
}

.magi-markdown :deep(ul), 
.magi-markdown :deep(ol) {
  margin-left: 20px;
  margin-bottom: 1em;
  color: inherit;
}

.magi-markdown :deep(li) {
  margin-bottom: 4px;
  color: inherit;
}

.magi-markdown :deep(strong) {
  font-weight: 900;
  text-shadow: 0 0 5px currentColor;
  color: inherit;
}

.magi-markdown :deep(em) {
  font-style: italic;
  color: inherit;
}

.magi-markdown :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: var(--font-mono);
  color: inherit;
}
</style>
