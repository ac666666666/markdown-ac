<template>
  <div class="markdown-editor" :class="{ 'mobile-mode': isMobile }">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-section">
        <button 
          class="toolbar-btn"
          @click="insertText('**', '**')"
          title="粗体"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </button>
        
        <button 
          class="toolbar-btn"
          @click="insertText('*', '*')"
          title="斜体"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </button>
        
        <button 
          class="toolbar-btn"
          @click="insertText('`', '`')"
          title="行内代码"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16,18 22,12 16,6"></polyline>
            <polyline points="8,6 2,12 8,18"></polyline>
          </svg>
        </button>
        
        <div class="toolbar-divider"></div>
        
        <button 
          class="toolbar-btn"
          @click="insertHeading(1)"
          title="标题 1"
        >
          H1
        </button>
        
        <button 
          class="toolbar-btn"
          @click="insertHeading(2)"
          title="标题 2"
        >
          H2
        </button>
        
        <button 
          class="toolbar-btn"
          @click="insertHeading(3)"
          title="标题 3"
        >
          H3
        </button>
        
        <div class="toolbar-divider"></div>
        
        <button 
          class="toolbar-btn"
          @click="insertList('- ')"
          title="无序列表"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>
        
        <button 
          class="toolbar-btn"
          @click="insertList('1. ')"
          title="有序列表"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4"></path>
            <path d="M4 10h2"></path>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
        </button>
        
        <button 
          class="toolbar-btn"
          @click="insertLink"
          title="链接"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
          </svg>
        </button>
        
        <button 
          class="toolbar-btn"
          @click="insertImage"
          title="图片"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21,15 16,10 5,21"></polyline>
          </svg>
        </button>
      </div>
      
      <div class="toolbar-section">
        <button 
          class="toolbar-btn"
          @click="togglePreview"
          :class="{ active: showPreview }"
          title="预览"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        
        <button 
          class="toolbar-btn"
          @click="toggleFullscreen"
          :class="{ active: isFullscreen }"
          title="全屏"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
        </button>
        
        <div class="word-count">
          <span class="count-item">{{ wordCount }} 词</span>
          <span class="count-item">{{ charCount }} 字符</span>
        </div>
      </div>
    </div>
    
    <!-- 编辑器主体 -->
    <div class="editor-body" :class="{ 'split-view': showPreview && !isMobile, 'preview-only': showPreview && isMobile }">
      <!-- 编辑区域 -->
      <div class="editor-pane" v-show="!showPreview || !isMobile">
        <textarea 
          ref="textareaRef"
          v-model="content"
          class="editor-textarea"
          placeholder="开始编写你的 Markdown 文档..."
          @input="handleInput"
          @scroll="handleEditorScroll"
          @keydown="handleKeydown"
        ></textarea>
        
        <!-- 行号 -->
        <div class="line-numbers" v-if="showLineNumbers">
          <div 
            v-for="n in lineCount" 
            :key="n"
            class="line-number"
          >
            {{ n }}
          </div>
        </div>
      </div>
      
      <!-- 预览区域 -->
      <div class="preview-pane" v-show="showPreview">
        <div 
          class="preview-content markdown-content"
          v-html="renderedContent"
          ref="previewRef"
        ></div>
      </div>
    </div>
    
    <!-- 状态栏 -->
    <div class="editor-status">
      <div class="status-left">
        <span class="status-item">行 {{ currentLine }}</span>
        <span class="status-item">列 {{ currentColumn }}</span>
        <span class="status-item">{{ lineCount }} 行</span>
      </div>
      
      <div class="status-right">
        <span class="status-item">Markdown</span>
        <span class="status-item" :class="{ 'status-saved': isSaved, 'status-unsaved': !isSaved }">
          {{ isSaved ? '已保存' : '未保存' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { parseMarkdown } from '../utils/markdown.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  showLineNumbers: {
    type: Boolean,
    default: true
  },
  autoSave: {
    type: Boolean,
    default: true
  },
  autoSaveInterval: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'change'])

const textareaRef = ref(null)
const previewRef = ref(null)
const content = ref(props.modelValue)
const showPreview = ref(false)
const isFullscreen = ref(false)
const isMobile = ref(false)
const isSaved = ref(true)
const currentLine = ref(1)
const currentColumn = ref(1)
const autoSaveTimer = ref(null)

// 计算属性
const lineCount = computed(() => {
  return content.value.split('\n').length
})

const wordCount = computed(() => {
  return content.value.trim().split(/\s+/).filter(word => word.length > 0).length
})

const charCount = computed(() => {
  return content.value.length
})

const renderedContent = computed(() => {
  return parseMarkdown(content.value)
})

// 监听内容变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue
  }
})

watch(content, (newValue) => {
  emit('update:modelValue', newValue)
  emit('change', newValue)
  isSaved.value = false
  
  // 自动保存
  if (props.autoSave) {
    clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = setTimeout(() => {
      save()
    }, props.autoSaveInterval)
  }
})

// 方法
const handleInput = () => {
  updateCursorPosition()
}

const handleKeydown = (e) => {
  // Tab 键插入空格
  if (e.key === 'Tab') {
    e.preventDefault()
    insertText('  ', '')
  }
  
  // Ctrl+S 保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    save()
  }
  
  // Ctrl+B 粗体
  if (e.ctrlKey && e.key === 'b') {
    e.preventDefault()
    insertText('**', '**')
  }
  
  // Ctrl+I 斜体
  if (e.ctrlKey && e.key === 'i') {
    e.preventDefault()
    insertText('*', '*')
  }
  
  // Enter 键自动列表
  if (e.key === 'Enter') {
    handleEnterKey(e)
  }
  
  updateCursorPosition()
}

const handleEnterKey = (e) => {
  const textarea = textareaRef.value
  const start = textarea.selectionStart
  const lines = content.value.substring(0, start).split('\n')
  const currentLineText = lines[lines.length - 1]
  
  // 检查是否是列表项
  const unorderedListMatch = currentLineText.match(/^(\s*)([-*+])\s/)
  const orderedListMatch = currentLineText.match(/^(\s*)(\d+)\.\s/)
  
  if (unorderedListMatch) {
    e.preventDefault()
    const indent = unorderedListMatch[1]
    const marker = unorderedListMatch[2]
    insertText(`\n${indent}${marker} `, '')
  } else if (orderedListMatch) {
    e.preventDefault()
    const indent = orderedListMatch[1]
    const number = parseInt(orderedListMatch[2]) + 1
    insertText(`\n${indent}${number}. `, '')
  }
}

const insertText = (before, after = '') => {
  const textarea = textareaRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)
  
  const newText = before + selectedText + after
  const newContent = content.value.substring(0, start) + newText + content.value.substring(end)
  
  content.value = newContent
  
  nextTick(() => {
    textarea.focus()
    const newCursorPos = start + before.length + selectedText.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  })
}

const insertHeading = (level) => {
  const prefix = '#'.repeat(level) + ' '
  insertText(prefix, '')
}

const insertList = (marker) => {
  const textarea = textareaRef.value
  const start = textarea.selectionStart
  const lines = content.value.substring(0, start).split('\n')
  const currentLineStart = content.value.lastIndexOf('\n', start - 1) + 1
  const currentLine = content.value.substring(currentLineStart, start)
  
  if (currentLine.trim() === '') {
    insertText(marker, '')
  } else {
    insertText('\n' + marker, '')
  }
}

const insertLink = () => {
  insertText('[', '](url)')
}

const insertImage = () => {
  insertText('![', '](url)')
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  if (isFullscreen.value) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const updateCursorPosition = () => {
  nextTick(() => {
    const textarea = textareaRef.value
    if (!textarea) return
    
    const start = textarea.selectionStart
    const lines = content.value.substring(0, start).split('\n')
    
    currentLine.value = lines.length
    currentColumn.value = lines[lines.length - 1].length + 1
  })
}

const handleEditorScroll = () => {
  // 同步滚动预览区域
  if (showPreview.value && previewRef.value) {
    const textarea = textareaRef.value
    const preview = previewRef.value
    
    const scrollPercentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight)
    preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight)
  }
}

const save = () => {
  emit('save', content.value)
  isSaved.value = true
  clearTimeout(autoSaveTimer.value)
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const handleResize = () => {
  checkMobile()
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  checkMobile()
  updateCursorPosition()
  
  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  clearTimeout(autoSaveTimer.value)
})
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border: 1px solid #e1e5e9;
  border-radius: 0.5rem;
  overflow: hidden;
}

.markdown-editor.mobile-mode {
  height: calc(100vh - 2rem);
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.toolbar-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #6c757d;
  font-size: 0.75rem;
  font-weight: 600;
}

.toolbar-btn:hover {
  background: #e9ecef;
  color: #007bff;
}

.toolbar-btn.active {
  background: #007bff;
  color: white;
}

.toolbar-btn svg {
  width: 1rem;
  height: 1rem;
}

.toolbar-divider {
  width: 1px;
  height: 1.5rem;
  background: #dee2e6;
  margin: 0 0.25rem;
}

.word-count {
  display: flex;
  gap: 0.5rem;
  margin-left: 0.5rem;
}

.count-item {
  font-size: 0.75rem;
  color: #6c757d;
  padding: 0.25rem 0.5rem;
  background: #e9ecef;
  border-radius: 0.1875rem;
}

.editor-body {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.editor-body.split-view {
  /* 分屏模式 */
}

.editor-body.preview-only .editor-pane {
  display: none;
}

.editor-pane {
  flex: 1;
  position: relative;
  display: flex;
}

.editor-pane.split-view {
  flex: 0.5;
  border-right: 1px solid #e1e5e9;
}

.editor-textarea {
  flex: 1;
  border: none;
  outline: none;
  padding: 1rem 3rem;
  font-family: 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  resize: none;
  background: #fff;
  color: #495057;
}

.line-numbers {
  position: absolute;
  left: 0;
  top: 0;
  width: 3rem;
  background: #f8f9fa;
  border-right: 1px solid #e1e5e9;
  padding: 1rem 0.5rem;
  font-family: 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.6;
  color: #6c757d;
  user-select: none;
  pointer-events: none;
}

.line-numbers + .editor-textarea {
  padding-left: 5.5rem;
}

.line-number {
  text-align: right;
  height: 1.4em;
}

.preview-pane {
  flex: 1;
  overflow-y: auto;
  background: #fff;
}

.split-view .preview-pane {
  flex: 0.5;
}

.preview-content {
  padding: 1rem;
  max-width: none;
}

.editor-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 1rem;
  background: #f8f9fa;
  border-top: 1px solid #e1e5e9;
  font-size: 0.75rem;
  color: #6c757d;
}

.status-left,
.status-right {
  display: flex;
  gap: 1rem;
}

.status-item {
  white-space: nowrap;
}

.status-saved {
  color: #28a745;
}

.status-unsaved {
  color: #dc3545;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .editor-toolbar {
    padding: 0.375rem 0.75rem;
    flex-wrap: wrap;
  }
  
  .toolbar-btn {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.6875rem;
  }
  
  .toolbar-btn svg {
    width: 0.875rem;
    height: 0.875rem;
  }
  
  .word-count {
    order: 3;
    width: 100%;
    justify-content: center;
    margin: 0.25rem 0 0 0;
  }
  
  .count-item {
    font-size: 0.6875rem;
    padding: 0.1875rem 0.375rem;
  }
  
  .editor-body.split-view {
    flex-direction: column;
  }
  
  .editor-pane,
  .preview-pane {
    flex: 1;
  }
  
  .split-view .editor-pane {
    border-right: none;
    border-bottom: 1px solid #e1e5e9;
  }
  
  .editor-textarea {
    padding: 0.75rem 2.6rem;
    font-size: 0.8125rem;
  }
  
  .line-numbers {
    width: 2.5rem;
    padding: 0.75rem 0.375rem;
    font-size: 0.6875rem;
  }
  
  .line-numbers + .editor-textarea {
    padding-left: 4.5rem;
  }
  
  .preview-content {
    padding: 0.75rem;
  }
  
  .editor-status {
    padding: 0.25rem 0.75rem;
    font-size: 0.6875rem;
  }
  
  .status-left,
  .status-right {
    gap: 0.5rem;
  }
}

/* 全屏模式 */
.markdown-editor:fullscreen {
  height: 100vh;
  border-radius: 0;
}
</style>