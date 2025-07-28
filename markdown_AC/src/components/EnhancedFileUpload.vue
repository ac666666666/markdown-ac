<template>
  <div class="enhanced-file-upload">
    <!-- 拖拽上传区域 -->
    <div 
      class="upload-area"
      :class="{ 
        'drag-over': isDragOver,
        'uploading': isUploading,
        'has-file': uploadedFiles.length > 0
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @click="triggerFileInput"
    >
      <input 
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        @change="handleFileSelect"
        style="display: none;"
      />
      
      <!-- 上传状态显示 -->
      <div class="upload-content">
        <div v-if="uploadedFiles.length === 0 && !isUploading" class="upload-prompt">
          <div class="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <h3 class="upload-title">上传文件</h3>
          <p class="upload-description">
            拖拽文件到此处，或点击选择文件<br>
            支持大文件上传，自动断点续传
          </p>
          <div class="upload-tips">
            <span class="tip-item">🚀 支持大文件切片上传</span>
            <span class="tip-item">⚡ 断点续传功能</span>
            <span class="tip-item">💾 本地存储进度</span>
            <span class="tip-item">🔄 自动重试机制</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-if="uploadedFiles.length > 0" class="file-list">
      <div v-for="file in uploadedFiles" :key="file.id" class="file-item">
        <div class="file-info">
          <div class="file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
            </svg>
          </div>
          <div class="file-details">
            <h4 class="file-name">{{ file.name }}</h4>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-status" :class="file.status">{{ getStatusText(file.status) }}</span>
            </div>
          </div>
          <div class="file-actions">
            <button v-if="file.status === 'paused'" @click="resumeUpload(file.id)" class="btn btn-sm btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5,3 19,12 5,21"></polygon>
              </svg>
              继续
            </button>
            <button v-if="file.status === 'uploading'" @click="pauseUpload(file.id)" class="btn btn-sm btn-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
              暂停
            </button>
            <button @click="removeFile(file.id)" class="btn btn-sm btn-danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              </svg>
              删除
            </button>
          </div>
        </div>
        
        <!-- 进度条 -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: file.progress + '%' }"></div>
          </div>
          <span class="progress-text">{{ file.progress.toFixed(1) }}%</span>
        </div>
        
        <!-- 上传详情 -->
        <div v-if="file.status === 'uploading' || file.status === 'paused'" class="upload-details">
          <div class="detail-item">
            <span>已上传:</span>
            <span>{{ file.uploadedChunks }}/{{ file.totalChunks }} 块</span>
          </div>
          <div class="detail-item">
            <span>上传速度:</span>
            <span>{{ formatSpeed(file.speed) }}</span>
          </div>
          <div class="detail-item">
            <span>剩余时间:</span>
            <span>{{ formatTime(file.remainingTime) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <span>{{ error }}</span>
      <button @click="clearError" class="error-close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useEnhancedUpload } from '../composables/useEnhancedUpload.js'

const props = defineProps({
  accept: {
    type: String,
    default: '.md,.markdown,.txt'
  },
  maxSize: {
    type: Number,
    default: 1024 * 1024 * 1024 // 1GB
  },
  multiple: {
    type: Boolean,
    default: false
  },
  autoUpload: {
    type: Boolean,
    default: true
  },
  chunkSize: {
    type: Number,
    default: 1024 * 1024 // 1MB
  },
  concurrent: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits([
  'file-added',
  'file-progress',
  'file-success',
  'file-error',
  'file-paused',
  'file-resumed',
  'file-removed'
])

const fileInput = ref(null)
const isDragOver = ref(false)
const dragCounter = ref(0)
const error = ref('')

const {
  uploadedFiles,
  isUploading,
  addFiles,
  pauseUpload,
  resumeUpload,
  removeFile,
  clearAll
} = useEnhancedUpload({
  chunkSize: props.chunkSize,
  concurrent: props.concurrent,
  maxSize: props.maxSize,
  onProgress: (file, progress) => emit('file-progress', file, progress),
  onSuccess: (file, response) => emit('file-success', file, response),
  onError: (file, error) => emit('file-error', file, error),
  onPaused: (file) => emit('file-paused', file),
  onResumed: (file) => emit('file-resumed', file)
})

const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

const handleDragEnter = (e) => {
  e.preventDefault()
  dragCounter.value++
  isDragOver.value = true
}

const handleDragOver = (e) => {
  e.preventDefault()
}

const handleDragLeave = (e) => {
  e.preventDefault()
  dragCounter.value--
  if (dragCounter.value === 0) {
    isDragOver.value = false
  }
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragOver.value = false
  dragCounter.value = 0
  
  const files = Array.from(e.dataTransfer.files)
  handleFiles(files)
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  handleFiles(files)
}

const handleFiles = async (files) => {
  try {
    // 验证文件
    const validFiles = files.filter(file => {
      if (props.accept) {
        const acceptedTypes = props.accept.split(',')
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
        if (!acceptedTypes.some(type => type.trim() === fileExtension)) {
          showError(`文件 ${file.name} 格式不支持`)
          return false
        }
      }
      
      if (file.size > props.maxSize) {
        showError(`文件 ${file.name} 大小超过限制`)
        return false
      }
      
      return true
    })
    
    if (validFiles.length > 0) {
      await addFiles(validFiles, props.autoUpload)
      validFiles.forEach(file => emit('file-added', file))
    }
  } catch (err) {
    showError('文件处理失败: ' + err.message)
  }
}

const showError = (message) => {
  error.value = message
  setTimeout(() => {
    error.value = ''
  }, 5000)
}

const clearError = () => {
  error.value = ''
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatSpeed = (bytesPerSecond) => {
  if (!bytesPerSecond) return '0 B/s'
  return formatFileSize(bytesPerSecond) + '/s'
}

const formatTime = (seconds) => {
  if (!seconds || seconds === Infinity) return '--'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '等待中',
    'uploading': '上传中',
    'paused': '已暂停',
    'success': '上传成功',
    'error': '上传失败',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

// 页面卸载时暂停所有上传
onUnmounted(() => {
  uploadedFiles.value.forEach(file => {
    if (file.status === 'uploading') {
      pauseUpload(file.id)
    }
  })
})
</script>

<style scoped>
.enhanced-file-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed var(--theme-border, #d1d5db);
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--theme-background-secondary, #fafafa);
  min-height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: var(--theme-primary, #007bff);
  background: var(--theme-background-hover, #f8f9ff);
}

.upload-area.drag-over {
  border-color: var(--theme-primary, #007bff);
  background: var(--theme-background-active, #e3f2fd);
  transform: scale(1.02);
}

.upload-area.uploading {
  border-color: var(--theme-warning, #ffc107);
  background: var(--theme-background-warning, #fffbf0);
  cursor: not-allowed;
}

.upload-area.has-file {
  border-color: var(--theme-success, #28a745);
  background: var(--theme-background-success, #f8fff9);
  cursor: default;
}

.upload-content {
  width: 100%;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  color: var(--theme-text-secondary, #6c757d);
  margin-bottom: 0.5rem;
}

.upload-icon svg {
  width: 100%;
  height: 100%;
}

.upload-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--theme-text-primary, #495057);
}

.upload-description {
  margin: 0;
  color: var(--theme-text-secondary, #6c757d);
  line-height: 1.5;
}

.upload-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.tip-item {
  font-size: 0.8125rem;
  color: var(--theme-text-secondary, #6c757d);
  background: var(--theme-background-tertiary, #e9ecef);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.file-list {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-item {
  background: var(--theme-background, #ffffff);
  border: 1px solid var(--theme-border, #e1e5e9);
  border-radius: 0.5rem;
  padding: 1rem;
  transition: all 0.3s ease;
}

.file-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.file-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--theme-primary, #007bff);
  flex-shrink: 0;
}

.file-icon svg {
  width: 100%;
  height: 100%;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--theme-text-primary, #495057);
  word-break: break-all;
}

.file-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.8125rem;
  color: var(--theme-text-secondary, #6c757d);
}

.file-status {
  font-weight: 500;
}

.file-status.uploading {
  color: var(--theme-primary, #007bff);
}

.file-status.success {
  color: var(--theme-success, #28a745);
}

.file-status.error {
  color: var(--theme-danger, #dc3545);
}

.file-status.paused {
  color: var(--theme-warning, #ffc107);
}

.file-actions {
  display: flex;
  gap: 0.5rem;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 0.5rem;
  background: var(--theme-background-tertiary, #e9ecef);
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-primary, #007bff), var(--theme-primary-light, #66b3ff));
  transition: width 0.3s ease;
  border-radius: 0.25rem;
}

.progress-text {
  font-size: 0.8125rem;
  color: var(--theme-text-secondary, #6c757d);
  font-weight: 500;
  min-width: 3rem;
  text-align: right;
}

.upload-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--theme-background-secondary, #f8f9fa);
  border-radius: 0.375rem;
  font-size: 0.8125rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item span:first-child {
  color: var(--theme-text-secondary, #6c757d);
}

.detail-item span:last-child {
  color: var(--theme-text-primary, #495057);
  font-weight: 500;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}

.btn svg {
  width: 0.875rem;
  height: 0.875rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
}

.btn-primary {
  background: var(--theme-primary, #007bff);
  color: white;
}

.btn-primary:hover {
  background: var(--theme-primary-dark, #0056b3);
}

.btn-warning {
  background: var(--theme-warning, #ffc107);
  color: var(--theme-text-primary, #212529);
}

.btn-warning:hover {
  background: var(--theme-warning-dark, #e0a800);
}

.btn-danger {
  background: var(--theme-danger, #dc3545);
  color: white;
}

.btn-danger:hover {
  background: var(--theme-danger-dark, #c82333);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  background: var(--theme-background-error, #f8d7da);
  color: var(--theme-text-error, #721c24);
  border: 1px solid var(--theme-border-error, #f5c6cb);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.error-message svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.error-close {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.125rem;
  border-radius: 0.1875rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.error-close svg {
  width: 0.875rem;
  height: 0.875rem;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .upload-area {
    padding: 1.5rem 1rem;
    min-height: 10rem;
  }
  
  .upload-icon {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .upload-title {
    font-size: 1.125rem;
  }
  
  .upload-description {
    font-size: 0.875rem;
  }
  
  .upload-tips {
    gap: 0.5rem;
  }
  
  .tip-item {
    font-size: 0.75rem;
    padding: 0.1875rem 0.375rem;
  }
  
  .file-info {
    gap: 0.75rem;
  }
  
  .file-icon {
    width: 2rem;
    height: 2rem;
  }
  
  .file-name {
    font-size: 0.875rem;
  }
  
  .file-meta {
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.75rem;
  }
  
  .file-actions {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .btn {
    justify-content: center;
  }
  
  .upload-details {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}
</style>