<template>
  <div class="code-block-wrapper">
    <div class="code-header">
      <span class="language-label">{{ language || 'text' }}</span>
      <div class="code-actions">
        <button 
          class="btn-copy" 
          @click="copyCode" 
          :class="{ copied: isCopied }"
          :title="isCopied ? '已复制' : '复制代码'"
        >
          <svg v-if="!isCopied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </button>
        <button 
          class="btn-expand" 
          @click="toggleExpand" 
          v-if="isLongCode"
          :title="isExpanded ? '收起' : '展开'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline :points="isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"></polyline>
          </svg>
        </button>
      </div>
    </div>
    <div class="code-content" :class="{ expanded: isExpanded, collapsed: !isExpanded && isLongCode }">
      <pre><code :class="`language-${language}`" ref="codeRef"><slot></slot></code></pre>
    </div>
    <div class="code-info" v-if="showInfo">
      <span class="line-count">{{ lineCount }} 行</span>
      <span class="char-count">{{ charCount }} 字符</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

const props = defineProps({
  language: {
    type: String,
    default: 'text'
  },
  showInfo: {
    type: Boolean,
    default: false
  },
  maxHeight: {
    type: String,
    default: '20rem'
  }
})

const codeRef = ref(null)
const isCopied = ref(false)
const isExpanded = ref(false)
const isLongCode = ref(false)

const lineCount = computed(() => {
  if (!codeRef.value) return 0
  return (codeRef.value.textContent || '').split('\n').length
})

const charCount = computed(() => {
  if (!codeRef.value) return 0
  return (codeRef.value.textContent || '').length
})

const copyCode = async () => {
  if (!codeRef.value) return
  
  const code = codeRef.value.textContent || codeRef.value.innerText
  
  try {
    await navigator.clipboard.writeText(code)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
    // 降级方案：选中文本
    const range = document.createRange()
    range.selectNode(codeRef.value)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
  }
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const checkCodeLength = () => {
  if (!codeRef.value) return
  
  nextTick(() => {
    const height = codeRef.value.parentElement.scrollHeight
    const maxHeightPx = parseFloat(props.maxHeight) * 16 // 转换 rem 到 px
    isLongCode.value = height > maxHeightPx
  })
}

onMounted(() => {
  checkCodeLength()
})
</script>

<style scoped>
.code-block-wrapper {
  margin: 1rem 0;
  border: 1px solid var(--theme-border, #e1e5e9);
  border-radius: 0.75rem;
  overflow: hidden;
  background: var(--theme-surface, #f8f9fa);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--theme-background, #fff);
  border-bottom: 1px solid var(--theme-border, #e1e5e9);
}

.language-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--theme-primary, #007bff);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.code-actions {
  display: flex;
  gap: 0.25rem;
}

.btn-copy,
.btn-expand {
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: none;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--theme-secondary, #6c757d);
  position: relative;
  overflow: hidden;
}

.btn-copy::before,
.btn-expand::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-copy:hover,
.btn-expand:hover {
  background: var(--theme-hover, #f8f9fa);
  color: var(--theme-primary, #007bff);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-copy:hover::before,
.btn-expand:hover::before {
  left: 100%;
}

.btn-copy.copied {
  color: var(--theme-success, #28a745);
}

.btn-copy svg,
.btn-expand svg {
  width: 1rem;
  height: 1rem;
}

.code-content {
  position: relative;
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: var(--theme-code-bg, #f6f8fa);
}

.code-content.collapsed {
  max-height: 20rem;
}

.code-content.expanded {
  max-height: none;
}

.code-content pre {
  margin: 0;
  padding: 1rem;
  background: transparent;
  overflow-x: auto;
  font-family: 'Fira Code', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.code-content code {
  background: none;
  padding: 0;
  border-radius: 0;
  color: var(--theme-code-text, inherit);
}

.code-info {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 1rem;
  background: var(--theme-background, #fff);
  border-top: 1px solid var(--theme-border, #e1e5e9);
  font-size: 0.75rem;
  color: var(--theme-secondary, #6c757d);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .code-block-wrapper {
    border-radius: 0.625rem;
  }
  
  .code-header {
    padding: 0.375rem 0.75rem;
  }
  
  .language-label {
    font-size: 0.6875rem;
  }
  
  .btn-copy,
  .btn-expand {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.3125rem;
  }
  
  .btn-copy:active,
  .btn-expand:active {
    transform: scale(0.95);
  }
  
  .btn-copy svg,
  .btn-expand svg {
    width: 0.875rem;
    height: 0.875rem;
  }
  
  .code-content pre {
    padding: 0.75rem;
    font-size: 0.8125rem;
  }
  
  .code-info {
    padding: 0.25rem 0.75rem;
    font-size: 0.6875rem;
  }
}
</style>