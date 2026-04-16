<template>
  <div class="markdown-renderer" v-html="renderedMarkdown"></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

// 完整的Markdown渲染器，支持更多语法
const renderedMarkdown = computed(() => {
  let html = props.content || ''

  // 第1步：转义HTML特殊字符（防止XSS）
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 第2步：处理代码块（保护其内部的特殊字符，防止后续处理）
  const codeBlocks = []
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const index = codeBlocks.length
    codeBlocks.push(code)
    return `___CODE_BLOCK_${index}___`
  })

  // 第3步：处理行内代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  // 第4步：处理图片 ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img class="markdown-img" alt="$1" src="$2" />')

  // 第5步：处理链接 [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="markdown-link" href="$2" target="_blank">$1</a>')

  // 第6步：处理删除线 ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  // 第7步：处理标题 # ## ### #### ##### ######
  html = html.replace(/^###### (.*?)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.*?)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>')

  // 第8步：处理粗体 **text** 和 __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')

  // 第9步：处理斜体 *text* 和 _text_（避免与粗体冲突）
  html = html.replace(/(?<!\*)\*([^\*\n]+)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>')

  // 第10步：处理引用块 > quote
  html = html.replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>')
  html = html.replace(/(<blockquote>.*?<\/blockquote>)/s, '<div class="quote-block">$1</div>')

  // 第11步：处理有序列表 1. item
  html = html.replace(/^\d+\. (.*)$/gm, '<li class="ordered-item">$1</li>')

  // 第12步：处理无序列表 - item 和 * item
  html = html.replace(/^[\-\*] (.*)$/gm, '<li class="unordered-item">$1</li>')

  // 为列表项添加列表容器
  const listRegex = /<li[^>]*>.*?<\/li>/gs
  let lastWasUL = false
  html = html.split('\n').map((line, i, arr) => {
    const hasLi = /<li/.test(line)
    if (hasLi && !lastWasUL) {
      lastWasUL = true
      const isOrdered = /ordered-item/.test(line)
      return `<${isOrdered ? 'ol' : 'ul'} class="markdown-list">` + line
    } else if (hasLi && lastWasUL) {
      return line
    } else if (!hasLi && lastWasUL && i > 0 && /<li/.test(arr[i - 1])) {
      const isOrdered = /ordered-item/.test(arr[i - 1])
      lastWasUL = false
      return `</${isOrdered ? 'ol' : 'ul'}>` + line
    }
    return line
  }).join('\n')

  // 处理列表末尾
  if (lastWasUL) {
    const isOrdered = /ordered-item/.test(html)
    html += `</${isOrdered ? 'ol' : 'ul'}>`
  }

  // 第13步：处理分割线 ---
  html = html.replace(/^---$/gm, '<hr class="markdown-hr" />')

  // 第14步：恢复代码块
  codeBlocks.forEach((code, index) => {
    html = html.replace(`___CODE_BLOCK_${index}___`, `<pre><code class="code-block">${code}</code></pre>`)
  })

  // 第15步：处理换行符转换为 <br>
  html = html.replace(/\n/g, '<br />')

  return html
})
</script>

<style scoped>
.markdown-renderer {
  white-space: normal;
  word-break: break-word;
  line-height: 1.8;
  color: inherit;
  font-size: inherit;
}

.markdown-renderer h1 {
  font-size: 1.8em;
  font-weight: bold;
  margin: 0.5em 0;
  color: #00e5ff;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

.markdown-renderer h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.4em 0;
  color: #00ff88;
  text-shadow: 0 0 8px rgba(0, 255, 136, 0.4);
}

.markdown-renderer h3 {
  font-size: 1.2em;
  font-weight: bold;
  margin: 0.3em 0;
  color: #ffaa00;
  text-shadow: 0 0 6px rgba(255, 170, 0, 0.3);
}

.markdown-renderer h4 {
  font-size: 1.1em;
  font-weight: bold;
  margin: 0.3em 0;
  color: #ff6600;
  text-shadow: 0 0 6px rgba(255, 102, 0, 0.3);
}

.markdown-renderer h5 {
  font-size: 1em;
  font-weight: bold;
  margin: 0.25em 0;
  color: #ff8844;
}

.markdown-renderer h6 {
  font-size: 0.95em;
  font-weight: bold;
  margin: 0.2em 0;
  color: #ff9966;
}

.markdown-renderer strong {
  font-weight: bold;
  color: #00ff88;
}

.markdown-renderer em {
  font-style: italic;
  color: #00e5ff;
}

.markdown-renderer del {
  text-decoration: line-through;
  color: rgba(0, 255, 136, 0.5);
}

.markdown-renderer code {
  font-family: var(--font-mono);
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 2px;
  padding: 2px 4px;
  color: #00ff88;
}

.markdown-renderer .code-block {
  display: block;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 2px;
  padding: 8px;
  margin: 0.5em 0;
  overflow-x: auto;
  white-space: pre;
  line-height: 1.4;
}

.markdown-renderer pre {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 2px;
  padding: 8px;
  margin: 0.5em 0;
  overflow-x: auto;
}

.markdown-renderer pre code {
  background: none;
  border: none;
  padding: 0;
  color: #00ff88;
}

.markdown-renderer ul,
.markdown-renderer ol {
  list-style-position: inside;
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.markdown-renderer .markdown-list {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.markdown-renderer li {
  margin: 0.2em 0;
  color: #00ff88;
  list-style: none;
  position: relative;
}

.markdown-renderer .ordered-item {
  counter-increment: markdown-list-counter;
}

.markdown-renderer li:before {
  content: '▸ ';
  color: #00e5ff;
  margin-right: 0.5em;
  font-weight: bold;
}

.markdown-renderer .ordered-item:before {
  content: '';
  margin-right: 0;
}

.markdown-renderer a.markdown-link {
  color: #00e5ff;
  text-decoration: underline;
  cursor: pointer;
  text-shadow: 0 0 5px rgba(0, 229, 255, 0.3);
  transition: all 0.3s ease;
}

.markdown-renderer a.markdown-link:hover {
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

.markdown-renderer img.markdown-img {
  max-width: 100%;
  height: auto;
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 2px;
  margin: 0.5em 0;
}

.markdown-renderer blockquote {
  border-left: 3px solid #00e5ff;
  padding-left: 10px;
  margin-left: 0;
  color: rgba(0, 229, 255, 0.7);
  font-style: italic;
}

.markdown-renderer .quote-block {
  margin: 0.5em 0;
  padding: 8px 12px;
  background: rgba(0, 229, 255, 0.05);
  border-radius: 2px;
}

.markdown-renderer .quote-block blockquote {
  margin: 0;
  border-left: 3px solid #00e5ff;
}

.markdown-renderer hr,
.markdown-renderer .markdown-hr {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, #00ff88, transparent);
  margin: 1em 0;
}
</style>
