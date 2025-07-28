<template>
  <div class="file-upload-wrapper">
    <!-- 拖拽上传区域 -->
    <div 
      class="upload-area"
      :class="{ 
        'drag-over': isDragOver,
        'uploading': isUploading,
        'has-file': uploadedFile
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
        accept=".md,.markdown,.txt"
        @change="handleFileSelect"
        style="display: none;"
      />
      
      <!-- 上传状态显示 -->
      <div class="upload-content">
        <div v-if="!uploadedFile && !isUploading" class="upload-prompt">
          <div class="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <h3 class="upload-title">上传 Markdown 文件</h3>
          <p class="upload-description">
            拖拽文件到此处，或点击选择文件<br>
            支持 .md、.markdown、.txt 格式
          </p>
          <div class="upload-tips">
            <span class="tip-item">📝 支持标准 Markdown 语法</span>
            <span class="tip-item">🎨 自动代码高亮</span>
            <span class="tip-item">📱 移动端优化</span>
          </div>
        </div>
        
        <div v-else-if="isUploading" class="upload-loading">
          <div class="loading-spinner"></div>
          <p class="loading-text">正在解析文件...</p>
        </div>
        
        <div v-else-if="uploadedFile" class="upload-success">
          <div class="file-info">
            <div class="file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
            </div>
            <div class="file-details">
              <h4 class="file-name">{{ uploadedFile.name }}</h4>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(uploadedFile.size) }}</span>
                <span class="file-type">{{ getFileExtension(uploadedFile.name) }}</span>
                <span class="upload-time">{{ formatUploadTime(uploadedFile.uploadTime) }}</span>
              </div>
            </div>
          </div>
          
          <div class="file-stats" v-if="fileStats">
            <div class="stat-item">
              <span class="stat-label">字符数</span>
              <span class="stat-value">{{ fileStats.characters }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">单词数</span>
              <span class="stat-value">{{ fileStats.words }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">段落数</span>
              <span class="stat-value">{{ fileStats.paragraphs }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">标题数</span>
              <span class="stat-value">{{ fileStats.headings }}</span>
            </div>
          </div>
          
          <div class="file-actions">
            <button class="btn btn-primary" @click="previewFile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              预览文档
            </button>
            <button class="btn btn-secondary" @click="clearFile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              </svg>
              重新上传
            </button>
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
import { ref, computed } from 'vue'
import { getMarkdownStats } from '../utils/markdown.js'

const emit = defineEmits(['file-uploaded', 'file-preview', 'file-cleared'])

const fileInput = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadedFile = ref(null)
const fileContent = ref('')
const fileStats = ref(null)
const error = ref('')

const dragCounter = ref(0)

const triggerFileInput = () => {
  if (!isUploading.value && !uploadedFile.value) {
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
  
  const files = e.dataTransfer.files
  if (files.length > 0) {
    handleFile(files[0])
  }
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) {
    handleFile(files[0])
  }
}

const handleFile = async (file) => {
  // 验证文件类型
  const validTypes = ['.md', '.markdown', '.txt']
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
  
  if (!validTypes.includes(fileExtension)) {
    showError('请选择有效的 Markdown 文件 (.md, .markdown, .txt)')
    return
  }
  
  // 验证文件大小 (最大 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showError('文件大小不能超过 10MB')
    return
  }
  
  isUploading.value = true
  error.value = ''
  
  try {
    const content = await readFileContent(file)
    
    // 计算文件统计信息
    const stats = getMarkdownStats(content)
    
    uploadedFile.value = {
      name: file.name,
      size: file.size,
      type: file.type,
      uploadTime: new Date()
    }
    
    fileContent.value = content
    fileStats.value = stats
    
    emit('file-uploaded', {
      file: uploadedFile.value,
      content,
      stats
    })
    
  } catch (err) {
    showError('文件读取失败，请重试')
    console.error('File reading error:', err)
  } finally {
    isUploading.value = false
  }
}

const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsText(file, 'UTF-8')
  })
}

const previewFile = () => {
  if (uploadedFile.value && fileContent.value) {
    emit('file-preview', {
      file: uploadedFile.value,
      content: fileContent.value,
      stats: fileStats.value
    })
  }
}

const clearFile = () => {
  uploadedFile.value = null
  fileContent.value = ''
  fileStats.value = null
  error.value = ''
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  
  emit('file-cleared')
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
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileExtension = (filename) => {
  return filename.split('.').pop().toUpperCase()
}

const formatUploadTime = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  
  return date.toLocaleDateString()
}
</script>

<style scoped>
.file-upload-wrapper {
  width: 100%;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  min-height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: #007bff;
  background: #f8f9ff;
}

.upload-area.drag-over {
  border-color: #007bff;
  background: #e3f2fd;
  transform: scale(1.02);
}

.upload-area.uploading {
  border-color: #ffc107;
  background: #fffbf0;
  cursor: not-allowed;
}

.upload-area.has-file {
  border-color: #28a745;
  background: #f8fff9;
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
  color: #6c757d;
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
  color: #495057;
}

.upload-description {
  margin: 0;
  color: #6c757d;
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
  color: #6c757d;
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.upload-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin: 0;
  color: #6c757d;
  font-weight: 500;
}

.upload-success {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #fff;
  border-radius: 0.5rem;
  border: 1px solid #e1e5e9;
}

.file-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #28a745;
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
  color: #495057;
  word-break: break-all;
}

.file-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.8125rem;
  color: #6c757d;
}

.file-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #fff;
  border-radius: 0.5rem;
  border: 1px solid #e1e5e9;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
}

.stat-value {
  font-size: 1.125rem;
  color: #495057;
  font-weight: 600;
}

.file-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-decoration: none;
}

.btn svg {
  width: 1rem;
  height: 1rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
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
    padding: 0.75rem;
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
  
  .file-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0.75rem;
  }
  
  .stat-label {
    font-size: 0.6875rem;
  }
  
  .stat-value {
    font-size: 1rem;
  }
  
  .file-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn {
    justify-content: center;
    padding: 0.75rem 1rem;
  }
}
</style>