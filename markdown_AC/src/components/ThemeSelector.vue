<template>
  <div class="theme-selector">
    <!-- 主题切换按钮 -->
    <button 
      class="theme-toggle-btn"
      @click="toggleThemePanel"
      :class="{ active: showPanel }"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    </button>

    <!-- 主题面板 -->
    <transition name="theme-panel">
      <div v-if="showPanel" class="theme-panel" @click.stop>
        <div class="panel-header">
          <h3>主题设置</h3>
          <button class="btn-close" @click="showPanel = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- 预设主题 -->
        <div class="preset-themes">
          <h4>预设主题</h4>
          <div class="theme-grid">
            <div 
              v-for="theme in presetThemes" 
              :key="theme.name"
              class="theme-item"
              :class="{ active: currentTheme === theme.name }"
              @click="selectTheme(theme.name)"
              @touchstart="handleTouchStart"
              @touchend="handleTouchEnd"
            >
              <div class="theme-preview" :style="{ background: theme.gradient }">
                <div class="preview-content">
                  <div class="preview-header" :style="{ background: theme.headerBg }"></div>
                  <div class="preview-sidebar" :style="{ background: theme.sidebarBg }"></div>
                  <div class="preview-main" :style="{ background: theme.mainBg }"></div>
                </div>
              </div>
              <span class="theme-name">{{ theme.label }}</span>
            </div>
          </div>
        </div>

        <!-- 自定义调色板 -->
        <div class="custom-theme">
          <h4>自定义主题</h4>
          <div class="color-controls">
            <div class="color-group">
              <label>主色调</label>
              <input 
                type="color" 
                v-model="customColors.primary" 
                @change="updateCustomTheme"
                class="color-picker"
              >
            </div>
            <div class="color-group">
              <label>次色调</label>
              <input 
                type="color" 
                v-model="customColors.secondary" 
                @change="updateCustomTheme"
                class="color-picker"
              >
            </div>
            <div class="color-group">
              <label>背景色</label>
              <input 
                type="color" 
                v-model="customColors.background" 
                @change="updateCustomTheme"
                class="color-picker"
              >
            </div>
            <div class="color-group">
              <label>文字色</label>
              <input 
                type="color" 
                v-model="customColors.text" 
                @change="updateCustomTheme"
                class="color-picker"
              >
            </div>
          </div>
          <button class="btn-apply-custom" @click="applyCustomTheme">
            应用自定义主题
          </button>
        </div>
      </div>
    </transition>

    <!-- 遮罩层 -->
    <div v-if="showPanel" class="theme-overlay" @click="showPanel = false"></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'

const showPanel = ref(false)
const currentTheme = ref('dark-green')
const touchStartTime = ref(0)

// 预设主题
const presetThemes = [
  {
    name: 'dark-green',
    label: '深色护眼',
    gradient: 'linear-gradient(135deg, #2d3748, #1a202c)',
    headerBg: 'rgba(45, 55, 72, 0.95)',
    sidebarBg: 'rgba(26, 32, 44, 0.95)',
    mainBg: 'rgba(45, 55, 72, 0.8)',
    colors: {
      primary: '#68d391',
      secondary: '#4fd1c7',
      background: '#1a202c',
      text: '#e2e8f0',
      surface: '#2d3748'
    }
  },
  {
    name: 'light',
    label: '明亮白色',
    gradient: 'linear-gradient(135deg, #ffffff, #f7fafc)',
    headerBg: 'rgba(255, 255, 255, 0.95)',
    sidebarBg: 'rgba(247, 250, 252, 0.95)',
    mainBg: 'rgba(255, 255, 255, 0.8)',
    colors: {
      primary: '#3182ce',
      secondary: '#805ad5',
      background: '#ffffff',
      text: '#2d3748',
      surface: '#f7fafc'
    }
  },
  {
    name: 'dark',
    label: '深色模式',
    gradient: 'linear-gradient(135deg, #1a1a1a, #000000)',
    headerBg: 'rgba(26, 26, 26, 0.95)',
    sidebarBg: 'rgba(0, 0, 0, 0.95)',
    mainBg: 'rgba(26, 26, 26, 0.8)',
    colors: {
      primary: '#60a5fa',
      secondary: '#a78bfa',
      background: '#000000',
      text: '#f8fafc',
      surface: '#1a1a1a'
    }
  },
  {
    name: 'gray',
    label: '优雅灰色',
    gradient: 'linear-gradient(135deg, #718096, #4a5568)',
    headerBg: 'rgba(113, 128, 150, 0.95)',
    sidebarBg: 'rgba(74, 85, 104, 0.95)',
    mainBg: 'rgba(113, 128, 150, 0.8)',
    colors: {
      primary: '#ed8936',
      secondary: '#38b2ac',
      background: '#4a5568',
      text: '#f7fafc',
      surface: '#718096'
    }
  },
  {
    name: 'blue',
    label: '海洋蓝色',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    headerBg: 'rgba(102, 126, 234, 0.95)',
    sidebarBg: 'rgba(118, 75, 162, 0.95)',
    mainBg: 'rgba(102, 126, 234, 0.8)',
    colors: {
      primary: '#fbb6ce',
      secondary: '#fed7d7',
      background: '#764ba2',
      text: '#ffffff',
      surface: '#667eea'
    }
  }
]

// 自定义颜色
const customColors = reactive({
  primary: '#68d391',
  secondary: '#4fd1c7',
  background: '#1a202c',
  text: '#e2e8f0'
})

// 切换主题面板
const toggleThemePanel = () => {
  showPanel.value = !showPanel.value
}

// 选择主题
const selectTheme = (themeName) => {
  currentTheme.value = themeName
  applyTheme(themeName)
  showPanel.value = false
}

// 应用主题
const applyTheme = (themeName) => {
  const theme = presetThemes.find(t => t.name === themeName)
  if (theme) {
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value)
    })
    
    // 保存到本地存储
    localStorage.setItem('selectedTheme', themeName)
  }
}

// 更新自定义主题
const updateCustomTheme = () => {
  const root = document.documentElement
  Object.entries(customColors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value)
  })
}

// 应用自定义主题
const applyCustomTheme = () => {
  currentTheme.value = 'custom'
  updateCustomTheme()
  localStorage.setItem('selectedTheme', 'custom')
  localStorage.setItem('customColors', JSON.stringify(customColors))
  showPanel.value = false
}

// 触摸事件处理（移动端动画）
const handleTouchStart = (event) => {
  touchStartTime.value = Date.now()
  event.target.style.transform = 'scale(0.95)'
  event.target.style.transition = 'transform 0.1s ease'
}

const handleTouchEnd = (event) => {
  const touchDuration = Date.now() - touchStartTime.value
  if (touchDuration < 200) {
    // 短按动画
    event.target.style.transform = 'scale(1.05)'
    setTimeout(() => {
      event.target.style.transform = 'scale(1)'
    }, 150)
  } else {
    event.target.style.transform = 'scale(1)'
  }
}

// 初始化主题
onMounted(() => {
  const savedTheme = localStorage.getItem('selectedTheme') || 'dark-green'
  const savedCustomColors = localStorage.getItem('customColors')
  
  if (savedCustomColors) {
    Object.assign(customColors, JSON.parse(savedCustomColors))
  }
  
  if (savedTheme === 'custom') {
    applyCustomTheme()
  } else {
    selectTheme(savedTheme)
  }
})
</script>

<style scoped>
.theme-selector {
  position: relative;
}

.theme-toggle-btn {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--theme-text, #6c757d);
  position: relative;
  overflow: hidden;
}

.theme-toggle-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.theme-toggle-btn:hover::before {
  left: 100%;
}

.theme-toggle-btn:hover,
.theme-toggle-btn.active {
  background: var(--theme-primary, #667eea);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.theme-toggle-btn svg {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.3s ease;
}

.theme-toggle-btn:hover svg {
  transform: scale(1.1) rotate(180deg);
}

.theme-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.theme-panel {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 320px;
  max-width: 90vw;
  background: var(--theme-surface, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--theme-text, #2c3e50);
}

.btn-close {
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--theme-text, #6c757d);
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--theme-primary, #007bff);
}

.btn-close svg {
  width: 1rem;
  height: 1rem;
}

.preset-themes {
  padding: 1.5rem;
}

.preset-themes h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--theme-text, #6c757d);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.75rem;
}

.theme-item {
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.theme-item:hover {
  transform: translateY(-2px);
}

.theme-item.active .theme-preview {
  border: 2px solid var(--theme-primary, #007bff);
  box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.2);
}

.theme-preview {
  width: 100%;
  height: 60px;
  border-radius: 8px;
  border: 2px solid transparent;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
}

.preview-content {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar main";
  grid-template-rows: 20% 80%;
  grid-template-columns: 30% 70%;
}

.preview-header {
  grid-area: header;
  opacity: 0.9;
}

.preview-sidebar {
  grid-area: sidebar;
  opacity: 0.8;
}

.preview-main {
  grid-area: main;
  opacity: 0.7;
}

.theme-name {
  font-size: 0.75rem;
  color: var(--theme-text, #6c757d);
  font-weight: 500;
}

.custom-theme {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-theme h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--theme-text, #6c757d);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.color-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.color-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-group label {
  font-size: 0.75rem;
  color: var(--theme-text, #6c757d);
  font-weight: 500;
}

.color-picker {
  width: 100%;
  height: 2.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-picker:hover {
  transform: scale(1.05);
}

.btn-apply-custom {
  width: 100%;
  padding: 0.75rem;
  border: none;
  background: var(--theme-primary, #007bff);
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-apply-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
}

/* 动画 */
.theme-panel-enter-active,
.theme-panel-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-panel-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.theme-panel-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .theme-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .theme-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .color-controls {
    grid-template-columns: 1fr;
  }
  
  /* 移动端触摸反馈 */
  .theme-item:active {
    transform: scale(0.95);
  }
  
  .btn-apply-custom:active {
    transform: scale(0.98);
  }
}
</style>