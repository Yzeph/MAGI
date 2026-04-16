/**
 * Markdown 渲染工具函数
 * 提供统一的 Markdown 到 HTML 的转换逻辑
 */

/**
 * 转义HTML特殊字符，防止XSS攻击
 * @param {string} text - 需要转义的文本
 * @returns {string} - 转义后的HTML
 */
export function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 将Markdown文本转换为HTML
 * @param {string} markdown - Markdown 文本
 * @returns {string} - 转换后的 HTML
 */
export function markdownToHtml(markdown) {
  if (!markdown) return ''

  let html = markdown

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
  const lines = html.split('\n')
  let inList = false
  let isOrderedList = false
  const processedLines = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const hasLi = /<li/.test(line)
    const isOrdered = /ordered-item/.test(line)

    if (hasLi && !inList) {
      inList = true
      isOrderedList = isOrdered
      processedLines.push(`<${isOrderedList ? 'ol' : 'ul'} class="markdown-list">`)
      processedLines.push(line)
    } else if (hasLi && inList) {
      if (isOrdered !== isOrderedList) {
        // 列表类型改变，关闭旧列表，开启新列表
        processedLines.push(`</${isOrderedList ? 'ol' : 'ul'}>`)
        isOrderedList = isOrdered
        processedLines.push(`<${isOrderedList ? 'ol' : 'ul'} class="markdown-list">`)
      }
      processedLines.push(line)
    } else if (!hasLi && inList && i > 0 && /<li/.test(lines[i - 1])) {
      inList = false
      processedLines.push(`</${isOrderedList ? 'ol' : 'ul'}>`)
      processedLines.push(line)
    } else {
      processedLines.push(line)
    }
  }

  if (inList) {
    processedLines.push(`</${isOrderedList ? 'ol' : 'ul'}>`)
  }

  html = processedLines.join('\n')

  // 第13步：处理分割线 ---
  html = html.replace(/^---$/gm, '<hr class="markdown-hr" />')

  // 第14步：恢复代码块
  codeBlocks.forEach((code, index) => {
    html = html.replace(`___CODE_BLOCK_${index}___`, `<pre><code class="code-block">${code}</code></pre>`)
  })

  // 第15步：处理换行符转换为 <br>
  html = html.replace(/\n/g, '<br />')

  return html
}

/**
 * 处理带有换行符的Markdown（用于动画文本）
 * @param {string} markdown - Markdown 文本
 * @returns {string} - 转换后的 HTML
 */
export function markdownToHtmlWithLineBreaks(markdown) {
  if (!markdown) return ''

  let html = markdown

  // 先转义HTML特殊字符
  html = escapeHtml(html)

  // 第1步：处理代码块（保护其内部的特殊字符）
  const codeBlocks = []
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const index = codeBlocks.length
    codeBlocks.push(code)
    return `___CODE_BLOCK_${index}___`
  })

  // 第2步：处理行内代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  // 第3步：处理图片 ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img class="markdown-img" alt="$1" src="$2" />')

  // 第4步：处理链接 [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="markdown-link" href="$2" target="_blank">$1</a>')

  // 第5步：处理删除线 ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  // 第6步：处理标题 # ## ### 等（注意换行符）
  html = html.replace(/^###### (.*?)(?=<br \/>|$)/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.*?)(?=<br \/>|$)/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.*?)(?=<br \/>|$)/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.*?)(?=<br \/>|$)/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*?)(?=<br \/>|$)/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*?)(?=<br \/>|$)/gm, '<h1>$1</h1>')

  // 第7步：处理粗体 **text** 和 __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')

  // 第8步：处理斜体 *text* 和 _text_（避免与粗体冲突）
  html = html.replace(/(?<!\*)\*((?!\*).*?)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>')

  // 第9步：处理引用块 > quote
  html = html.replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>')
  html = html.replace(/(<blockquote>.*?<\/blockquote>)/s, '<div class="quote-block">$1</div>')

  // 第10步：处理有序列表 1. item
  html = html.replace(/^\d+\. (.*)(?=<br \/>|$)/gm, '<li class="ordered-item">$1</li>')

  // 第11步：处理无序列表 - item 和 * item
  html = html.replace(/^[\-\*] (.*)(?=<br \/>|$)/gm, '<li class="unordered-item">$1</li>')

  // 第12步：处理分割线 ---
  html = html.replace(/^---$/gm, '<hr class="markdown-hr" />')

  // 第13步：恢复代码块
  codeBlocks.forEach((code, index) => {
    html = html.replace(`___CODE_BLOCK_${index}___`, `<pre><code class="code-block">${code}</code></pre>`)
  })

  // 第14步：转换新行为换行符
  html = html.replace(/\n/g, '<br />')

  return html
}
