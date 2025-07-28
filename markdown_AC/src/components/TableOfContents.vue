<template>
  <div class="toc-wrapper" v-if="tocItems.length > 0">
    <div class="toc-header">
      <h3 class="toc-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M3 12h18M3 18h18"></path>
        </svg>
        目录
      </h3>
      <button 
        class="toc-toggle" 
        @click="toggleToc" 
        :class="{ active: isExpanded }"
        :title="isExpanded ? '收起目录' : '展开目录'"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline :points="isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"></polyline>
        </svg>
      </button>
    </div>
    
    <transition name="toc-content">
      <div class="toc-content" v-show="isExpanded">
        <nav class="toc-nav">
          <ul class="toc-list">
            <li 
              v-for="item in tocItems" 
              :key="item.id"
              class="toc-item"
              :class="`toc-level-${item.level}`"
            >
              <a 
                :href="`#${item.id}`"
                class="toc-link"
                :class="{ active: activeId === item.id }"
                @click="scrollToHeading(item.id, $event)"
              >
                <span class="toc-text">{{ item.text }}</span>
                <span class="toc-level-indicator">{{ 'H' + item.level }}</span>
              </a>
            </li>
          </ul>
        </nav>
        
        <div class="toc-stats" v-if="showStats">
          <div class="stat-item">
            <span class="stat-label">章节</span>
            <span class="stat-value">{{ tocItems.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">层级</span>
            <span class="stat-value">{{ maxLevel }}</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  tocItems: {
    type: Array,
    default: () => []
  },
  showStats: {
    type: Boolean,
    default: true
  },
  autoCollapse: {
    type: Boolean,
    default: false
  }
})

const isExpanded = ref(true)
const activeId = ref('')

const maxLevel = computed(() => {
  return Math.max(...props.tocItems.map(item => item.level), 0)
})

const toggleToc = () => {
  isExpanded.value = !isExpanded.value
}

const scrollToHeading = (id, event) => {
  event.preventDefault()
  
  const element = document.getElementById(id)
  if (element) {
    const offset = 80 // 顶部偏移量
    
    // 获取元素相对于视口的位置
    const rect = element.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const elementPosition = rect.top + scrollTop - offset
    
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    })
    
    // 更新活跃状态
    activeId.value = id
    
    // 移动端自动收起目录
    if (props.autoCollapse && window.innerWidth <= 768) {
      setTimeout(() => {
        isExpanded.value = false
      }, 500)
    }
  }
}

const updateActiveHeading = () => {
  const headings = props.tocItems.map(item => {
    const element = document.getElementById(item.id)
    if (!element) return null
    
    const rect = element.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    
    return {
      id: item.id,
      element,
      top: rect.top + scrollTop
    }
  }).filter(item => item !== null)
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const offset = 100
  
  let currentId = ''
  
  for (let i = headings.length - 1; i >= 0; i--) {
    if (scrollTop >= headings[i].top - offset) {
      currentId = headings[i].id
      break
    }
  }
  
  activeId.value = currentId
}

const handleScroll = () => {
  updateActiveHeading()
}

watch(() => props.tocItems, () => {
  // 当目录项更新时，重新计算活跃状态
  setTimeout(updateActiveHeading, 100)
}, { deep: true })

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  // 初始化活跃状态
  setTimeout(updateActiveHeading, 100)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.toc-wrapper {
  background: var(--theme-surface, #fff);
  border: 1px solid var(--theme-border, #e1e5e9);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--theme-background, #f8f9fa);
  border-bottom: 1px solid var(--theme-border, #e1e5e9);
}

.toc-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--theme-text, #495057);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toc-title svg {
  width: 1rem;
  height: 1rem;
  color: var(--theme-secondary, #6c757d);
}

.toc-toggle {
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--theme-secondary, #6c757d);
}

.toc-toggle:hover {
  background: var(--theme-hover, #e9ecef);
  color: var(--theme-primary, #007bff);
}

.toc-toggle svg {
  width: 0.875rem;
  height: 0.875rem;
  transition: transform 0.15s ease;
}

.toc-content-enter-active,
.toc-content-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.toc-content-enter-from,
.toc-content-leave-to {
  max-height: 0;
  opacity: 0;
}

.toc-content-enter-to,
.toc-content-leave-from {
  max-height: 30rem;
  opacity: 1;
}

.toc-content {
  max-height: 30rem;
  overflow-y: auto;
}

.toc-nav {
  padding: 0.5rem 0;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-item {
  margin: 0;
}

.toc-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 1rem;
  text-decoration: none;
  color: var(--theme-text, #495057);
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
}

.toc-link:hover {
  background: var(--theme-background, #f8f9fa);
  color: var(--theme-primary, #007bff);
}

.toc-link.active {
  background: var(--theme-primary-light, #e3f2fd);
  color: var(--theme-primary-dark, #1976d2);
  border-left-color: var(--theme-primary-dark, #1976d2);
}

.toc-text {
  flex: 1;
  font-size: 0.8125rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toc-level-indicator {
  font-size: 0.6875rem;
  color: var(--theme-secondary, #6c757d);
  background: var(--theme-hover, #e9ecef);
  padding: 0.125rem 0.25rem;
  border-radius: 0.1875rem;
  font-weight: 500;
  margin-left: 0.5rem;
}

/* 不同层级的缩进 */
.toc-level-1 .toc-link {
  padding-left: 1rem;
}

.toc-level-2 .toc-link {
  padding-left: 1.5rem;
}

.toc-level-3 .toc-link {
  padding-left: 2rem;
}

.toc-level-4 .toc-link {
  padding-left: 2.5rem;
}

.toc-level-5 .toc-link {
  padding-left: 3rem;
}

.toc-level-6 .toc-link {
  padding-left: 3.5rem;
}

.toc-stats {
  display: flex;
  justify-content: space-around;
  padding: 0.5rem 1rem;
  background: var(--theme-background, #f8f9fa);
  border-top: 1px solid var(--theme-border, #e1e5e9);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--theme-secondary, #6c757d);
  font-weight: 500;
}

.stat-value {
  font-size: 0.875rem;
  color: var(--theme-text, #495057);
  font-weight: 600;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .toc-header {
    padding: 0.5rem 0.75rem;
  }
  
  .toc-title {
    font-size: 0.8125rem;
  }
  
  .toc-title svg {
    width: 0.875rem;
    height: 0.875rem;
  }
  
  .toc-link {
    padding: 0.25rem 0.75rem;
  }
  
  .toc-text {
    font-size: 0.75rem;
  }
  
  .toc-level-indicator {
    font-size: 0.625rem;
    padding: 0.0625rem 0.1875rem;
  }
  
  /* 移动端减少缩进 */
  .toc-level-1 .toc-link {
    padding-left: 0.75rem;
  }
  
  .toc-level-2 .toc-link {
    padding-left: 1rem;
  }
  
  .toc-level-3 .toc-link {
    padding-left: 1.25rem;
  }
  
  .toc-level-4 .toc-link {
    padding-left: 1.5rem;
  }
  
  .toc-level-5 .toc-link {
    padding-left: 1.75rem;
  }
  
  .toc-level-6 .toc-link {
    padding-left: 2rem;
  }
  
  .toc-stats {
    padding: 0.375rem 0.75rem;
  }
  
  .stat-label {
    font-size: 0.625rem;
  }
  
  .stat-value {
    font-size: 0.8125rem;
  }
}
</style>