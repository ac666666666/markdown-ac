<template>
  <div class="local-file-upload">
    <!-- 拖拽上传区域 -->
    <div 
      class="upload-area"
      :class="{ 
        'drag-over': isDragOver,
        'processing': isProcessing,
        'has-file': processedFiles.length > 0
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
        <div v-if="processedFiles.length === 0 && !isProcessing" class="upload-prompt">
          <div class="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <h3 class="upload-title">选择文件</h3>
          <p class="upload-description">
            拖拽文件到此处，或点击选择文件<br>
            文件将在本地处理，不会上传到服务器
          </p>
          <div class="upload-tips">
            <span class="tip-item">📁 本地文件处理</span>
            <span class="tip-item">⚡ 即时读取</span>
            <span class="tip-item">🔒 隐私安全</span>
            <span class="tip-item">💾 支持大文件</span>
          </div>
        </div>
        
        <div v-if="isProcessing" class="processing-indicator">
          <div class="spinner"></div>
          <p>正在处理文件...</p>
        </div>
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-if="processedFiles.length > 0" class="file-list">
      <div v-for="file in processedFiles" :key="file.id" class="file-item">
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
              <span v-if="file.type" class="file-type">{{ file.type }}</span>
            </div>
          </div>
          <div class="file-actions">
            <button v-if="file.status === 'success'" @click="useFile(file)" class="btn btn-sm btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,11 12,14 22,4"></polyline>
                <path d="M21,12v7a2,2 0 0,1 -2,2H5a2,2 0 0,1 -2,-2V5a2,2 0 0,1 2,-2h11"></path>
              </svg>
              使用
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
        
        <!-- 文件预览 -->
        <div v-if="file.status === 'success' && file.preview" class="file-preview">
          <div class="preview-header">
            <span>文件预览</span>
            <button @click="togglePreview(file.id)" class="preview-toggle">
              {{ file.showPreview ? '收起' : '展开' }}
            </button>
          </div>
          <div v-if="file.showPreview" class="preview-content">
            <pre>{{ file.preview }}</pre>
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
import { ref, nextTick } from 'vue'

const props = defineProps({
  accept: {
    type: String,
    default: '.md,.markdown,.txt'
  },
  maxSize: {
    type: Number,
    default: 100 * 1024 * 1024 // 100MB
  },
  multiple: {
    type: Boolean,
    default: false
  },
  autoProcess: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'file-added',
  'file-processed',
  'file-success',
  'file-error',
  'file-removed'
])

const fileInput = ref(null)
const isDragOver = ref(false)
const dragCounter = ref(0)
const isProcessing = ref(false)
const error = ref('')
const processedFiles = ref([])

// 文件状态
const FILE_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error'
}

const triggerFileInput = () => {
  if (!isProcessing.value) {
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
  // 清空input值，允许重复选择同一文件
  e.target.value = ''
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
      for (const file of validFiles) {
        await processFile(file)
      }
    }
  } catch (err) {
    showError('文件处理失败: ' + err.message)
  }
}

const processFile = async (file) => {
  const fileId = generateFileId(file)
  
  // 检查是否已存在
  const existingFile = processedFiles.value.find(f => f.id === fileId)
  if (existingFile) {
    showError(`文件 ${file.name} 已存在`)
    return
  }
  
  const fileInfo = {
    id: fileId,
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    status: FILE_STATUS.PENDING,
    content: null,
    preview: null,
    showPreview: false,
    originalFile: file
  }
  
  processedFiles.value.push(fileInfo)
  emit('file-added', fileInfo)
  
  if (props.autoProcess) {
    await readFileContent(fileInfo)
  }
}

const readFileContent = async (fileInfo) => {
  try {
    isProcessing.value = true
    fileInfo.status = FILE_STATUS.PROCESSING
    
    const content = await readFileAsText(fileInfo.originalFile)
    
    fileInfo.content = content
    fileInfo.preview = content.length > 500 ? content.substring(0, 500) + '...' : content
    fileInfo.status = FILE_STATUS.SUCCESS
    
    emit('file-processed', fileInfo)
    emit('file-success', fileInfo)
    
  } catch (err) {
    fileInfo.status = FILE_STATUS.ERROR
    emit('file-error', fileInfo, err)
    showError(`读取文件 ${fileInfo.name} 失败: ${err.message}`)
  } finally {
    isProcessing.value = false
  }
}

const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    
    reader.onerror = (e) => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsText(file, 'UTF-8')
  })
}

const useFile = (file) => {
  emit('file-success', file)
}

const removeFile = (fileId) => {
  const index = processedFiles.value.findIndex(f => f.id === fileId)
  if (index !== -1) {
    const file = processedFiles.value[index]
    processedFiles.value.splice(index, 1)
    emit('file-removed', file)
  }
}

const togglePreview = (fileId) => {
  const file = processedFiles.value.find(f => f.id === fileId)
  if (file) {
    file.showPreview = !file.showPreview
  }
}

const generateFileId = (file) => {
  return `${file.name}-${file.size}-${file.lastModified}`
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

const getStatusText = (status) => {
  const statusMap = {
    'pending': '等待处理',
    'processing': '处理中',
    'success': '处理完成',
    'error': '处理失败'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.local-file-upload {
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

.upload-area.processing {
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
  color: var(--theme-text-primary, #333);
}

.upload-description {
  margin: 0;
  color: var(--theme-text-secondary, #6c757d);
  line-height: 1.5;
}

.upload-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
}

.tip-item {
  background: var(--theme-background-tertiary, #e9ecef);
  color: var(--theme-text-secondary, #6c757d);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  white-space: nowrap;
}

.processing-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--theme-border, #d1d5db);
  border-top: 3px solid var(--theme-primary, #007bff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.file-list {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-item {
  border: 1px solid var(--theme-border, #d1d5db);
  border-radius: 0.5rem;
  padding: 1rem;
  background: var(--theme-background, #fff);
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: var(--theme-primary, #007bff);
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-icon {
  width: 2rem;
  height: 2rem;
  color: var(--theme-primary, #007bff);
  flex-shrink: 0;
}

.file-icon svg {
  width: 100%;
  height: 100%;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--theme-text-primary, #333);
  word-break: break-all;
}

.file-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--theme-text-secondary, #6c757d);
}

.file-status {
  font-weight: 500;
}

.file-status.success {
  color: var(--theme-success, #28a745);
}

.file-status.error {
  color: var(--theme-danger, #dc3545);
}

.file-status.processing {
  color: var(--theme-warning, #ffc107);
}

.file-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: none;
}

.btn svg {
  width: 1rem;
  height: 1rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-primary {
  color: #fff;
  background-color: var(--theme-primary, #007bff);
  border-color: var(--theme-primary, #007bff);
}

.btn-primary:hover {
  background-color: var(--theme-primary-dark, #0056b3);
  border-color: var(--theme-primary-dark, #0056b3);
}

.btn-danger {
  color: #fff;
  background-color: var(--theme-danger, #dc3545);
  border-color: var(--theme-danger, #dc3545);
}

.btn-danger:hover {
  background-color: var(--theme-danger-dark, #c82333);
  border-color: var(--theme-danger-dark, #c82333);
}

.file-preview {
  margin-top: 1rem;
  border-top: 1px solid var(--theme-border, #d1d5db);
  padding-top: 1rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.preview-toggle {
  background: none;
  border: none;
  color: var(--theme-primary, #007bff);
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s ease;
}

.preview-toggle:hover {
  background-color: var(--theme-background-hover, #f8f9ff);
}

.preview-content {
  background: var(--theme-background-secondary, #f8f9fa);
  border: 1px solid var(--theme-border, #d1d5db);
  border-radius: 0.375rem;
  padding: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.preview-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  background-color: var(--theme-danger-light, #f8d7da);
  color: var(--theme-danger-dark, #721c24);
  border: 1px solid var(--theme-danger, #dc3545);
  border-radius: 0.375rem;
}

.error-message svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.error-close {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s ease;
}

.error-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.error-close svg {
  width: 1rem;
  height: 1rem;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .upload-area {
    padding: 1.5rem 1rem;
    min-height: 10rem;
  }
  
  .upload-tips {
    flex-direction: column;
    align-items: center;
  }
  
  .file-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .file-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .file-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .preview-content {
    font-size: 0.75rem;
  }
}
</style>