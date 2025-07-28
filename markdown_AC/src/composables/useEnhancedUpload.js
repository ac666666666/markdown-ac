import { ref, reactive, computed } from 'vue'
import { openDB } from 'idb'

// 数据库配置
const DB_NAME = 'FileUploadDB'
const DB_VERSION = 1
const CHUNK_STORE = 'chunks'
const FILE_STORE = 'files'

// 切片大小
const DEFAULT_CHUNK_SIZE = 1024 * 1024 // 1MB
const DEFAULT_CONCURRENT = 3

// 文件状态
const FILE_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  PAUSED: 'paused',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled'
}

// Web Worker 代码（内联）
const workerCode = `
self.onmessage = function(e) {
  const { file, chunkSize, fileId } = e.data
  const chunks = []
  let start = 0
  let index = 0
  
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)
    
    chunks.push({
      index,
      start,
      end,
      size: chunk.size,
      blob: chunk,
      fileId,
      hash: fileId + '-' + index
    })
    
    start = end
    index++
  }
  
  self.postMessage({ chunks, totalChunks: chunks.length })
}
`

export function useEnhancedUpload(options = {}) {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    concurrent = DEFAULT_CONCURRENT,
    maxSize = 1024 * 1024 * 1024, // 1GB
    onProgress = () => {},
    onSuccess = () => {},
    onError = () => {},
    onPaused = () => {},
    onResumed = () => {}
  } = options

  // 响应式状态
  const uploadedFiles = ref([])
  const isUploading = computed(() => 
    uploadedFiles.value.some(file => file.status === FILE_STATUS.UPLOADING)
  )
  
  // 数据库实例
  let db = null
  
  // Worker 池
  const workerPool = []
  const maxWorkers = navigator.hardwareConcurrency || 4
  
  // 初始化数据库
  const initDB = async () => {
    if (db) return db
    
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 创建切片存储
        if (!db.objectStoreNames.contains(CHUNK_STORE)) {
          const chunkStore = db.createObjectStore(CHUNK_STORE, { keyPath: 'hash' })
          chunkStore.createIndex('fileId', 'fileId', { unique: false })
        }
        
        // 创建文件存储
        if (!db.objectStoreNames.contains(FILE_STORE)) {
          const fileStore = db.createObjectStore(FILE_STORE, { keyPath: 'id' })
        }
      }
    })
    
    return db
  }
  
  // 创建 Worker
  const createWorker = () => {
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)
    return new Worker(workerUrl)
  }
  
  // 获取 Worker
  const getWorker = () => {
    if (workerPool.length > 0) {
      return workerPool.pop()
    }
    return createWorker()
  }
  
  // 释放 Worker
  const releaseWorker = (worker) => {
    if (workerPool.length < maxWorkers) {
      workerPool.push(worker)
    } else {
      worker.terminate()
    }
  }
  
  // 生成文件 ID
  const generateFileId = (file) => {
    return `${file.name}-${file.size}-${file.lastModified}`
  }
  
  // 生成文件哈希
  const generateFileHash = async (file) => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer.slice(0, 1024 * 1024)) // 只取前1MB计算哈希
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  // 切片文件
  const sliceFile = async (file) => {
    return new Promise((resolve, reject) => {
      const worker = getWorker()
      const fileId = generateFileId(file)
      
      worker.onmessage = (e) => {
        const { chunks, totalChunks } = e.data
        releaseWorker(worker)
        resolve({ chunks, totalChunks })
      }
      
      worker.onerror = (error) => {
        releaseWorker(worker)
        reject(error)
      }
      
      worker.postMessage({ file, chunkSize, fileId })
    })
  }
  
  // 保存切片到 IndexedDB
  const saveChunkToDB = async (chunk) => {
    const db = await initDB()
    const tx = db.transaction(CHUNK_STORE, 'readwrite')
    await tx.objectStore(CHUNK_STORE).put({
      hash: chunk.hash,
      fileId: chunk.fileId,
      index: chunk.index,
      blob: chunk.blob,
      uploaded: false,
      size: chunk.size
    })
    await tx.done
  }
  
  // 保存文件信息到 IndexedDB
  const saveFileToDB = async (fileInfo) => {
    const db = await initDB()
    const tx = db.transaction(FILE_STORE, 'readwrite')
    await tx.objectStore(FILE_STORE).put(fileInfo)
    await tx.done
  }
  
  // 从 IndexedDB 获取文件信息
  const getFileFromDB = async (fileId) => {
    const db = await initDB()
    const tx = db.transaction(FILE_STORE, 'readonly')
    return await tx.objectStore(FILE_STORE).get(fileId)
  }
  
  // 从 IndexedDB 获取切片
  const getChunksFromDB = async (fileId) => {
    const db = await initDB()
    const tx = db.transaction(CHUNK_STORE, 'readonly')
    const index = tx.objectStore(CHUNK_STORE).index('fileId')
    return await index.getAll(fileId)
  }
  
  // 标记切片为已上传
  const markChunkUploaded = async (chunkHash) => {
    const db = await initDB()
    const tx = db.transaction(CHUNK_STORE, 'readwrite')
    const store = tx.objectStore(CHUNK_STORE)
    const chunk = await store.get(chunkHash)
    if (chunk) {
      chunk.uploaded = true
      await store.put(chunk)
    }
    await tx.done
  }
  
  // 删除文件相关数据
  const deleteFileData = async (fileId) => {
    const db = await initDB()
    
    // 删除切片
    const chunkTx = db.transaction(CHUNK_STORE, 'readwrite')
    const chunkStore = chunkTx.objectStore(CHUNK_STORE)
    const chunkIndex = chunkStore.index('fileId')
    const chunks = await chunkIndex.getAll(fileId)
    
    for (const chunk of chunks) {
      await chunkStore.delete(chunk.hash)
    }
    await chunkTx.done
    
    // 删除文件信息
    const fileTx = db.transaction(FILE_STORE, 'readwrite')
    await fileTx.objectStore(FILE_STORE).delete(fileId)
    await fileTx.done
  }
  
  // 上传单个切片
  const uploadChunk = async (chunk, fileInfo) => {
    const formData = new FormData()
    formData.append('chunk', chunk.blob)
    formData.append('hash', chunk.hash)
    formData.append('index', chunk.index)
    formData.append('fileId', chunk.fileId)
    formData.append('fileName', fileInfo.name)
    formData.append('totalChunks', fileInfo.totalChunks)
    
    const response = await fetch('/api/upload/chunk', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`上传失败: ${response.statusText}`)
    }
    
    return await response.json()
  }
  
  // 检查切片是否已存在
  const checkChunkExists = async (chunkHash) => {
    try {
      const response = await fetch(`/api/upload/check/${chunkHash}`)
      if (response.ok) {
        const result = await response.json()
        return result.exists
      }
    } catch (error) {
      console.warn('检查切片失败:', error)
    }
    return false
  }
  
  // 合并文件
  const mergeFile = async (fileInfo) => {
    const response = await fetch('/api/upload/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId: fileInfo.id,
        fileName: fileInfo.name,
        totalChunks: fileInfo.totalChunks,
        fileSize: fileInfo.size
      })
    })
    
    if (!response.ok) {
      throw new Error(`合并失败: ${response.statusText}`)
    }
    
    return await response.json()
  }
  
  // 上传文件
  const uploadFile = async (fileInfo) => {
    const file = uploadedFiles.value.find(f => f.id === fileInfo.id)
    if (!file || file.status !== FILE_STATUS.UPLOADING) {
      return
    }
    
    try {
      // 获取切片
      const chunks = await getChunksFromDB(fileInfo.id)
      const unuploadedChunks = []
      
      // 检查哪些切片需要上传
      for (const chunk of chunks) {
        if (!chunk.uploaded) {
          const exists = await checkChunkExists(chunk.hash)
          if (exists) {
            await markChunkUploaded(chunk.hash)
            file.uploadedChunks++
          } else {
            unuploadedChunks.push(chunk)
          }
        } else {
          file.uploadedChunks++
        }
      }
      
      // 更新进度
      file.progress = (file.uploadedChunks / file.totalChunks) * 100
      onProgress(file, file.progress)
      
      // 如果所有切片都已上传，直接合并
      if (unuploadedChunks.length === 0) {
        const result = await mergeFile(fileInfo)
        file.status = FILE_STATUS.SUCCESS
        file.progress = 100
        onSuccess(file, result)
        await deleteFileData(fileInfo.id)
        return
      }
      
      // 并发上传切片
      const uploadPromises = []
      const semaphore = new Array(concurrent).fill(null)
      
      let chunkIndex = 0
      const startTime = Date.now()
      let lastProgressTime = startTime
      let lastUploadedBytes = file.uploadedChunks * chunkSize
      
      const uploadNextChunk = async () => {
        if (chunkIndex >= unuploadedChunks.length || file.status !== FILE_STATUS.UPLOADING) {
          return
        }
        
        const chunk = unuploadedChunks[chunkIndex++]
        
        try {
          await uploadChunk(chunk, fileInfo)
          await markChunkUploaded(chunk.hash)
          
          file.uploadedChunks++
          file.progress = (file.uploadedChunks / file.totalChunks) * 100
          
          // 计算上传速度和剩余时间
          const now = Date.now()
          const timeDiff = (now - lastProgressTime) / 1000
          
          if (timeDiff >= 1) { // 每秒更新一次速度
            const uploadedBytes = file.uploadedChunks * chunkSize
            const bytesDiff = uploadedBytes - lastUploadedBytes
            file.speed = bytesDiff / timeDiff
            
            const remainingBytes = (file.totalChunks - file.uploadedChunks) * chunkSize
            file.remainingTime = file.speed > 0 ? remainingBytes / file.speed : Infinity
            
            lastProgressTime = now
            lastUploadedBytes = uploadedBytes
          }
          
          onProgress(file, file.progress)
          
          // 继续上传下一个切片
          await uploadNextChunk()
        } catch (error) {
          console.error('切片上传失败:', error)
          // 重试机制
          chunkIndex-- // 重新上传这个切片
          await new Promise(resolve => setTimeout(resolve, 1000)) // 等待1秒后重试
          await uploadNextChunk()
        }
      }
      
      // 启动并发上传
      for (let i = 0; i < concurrent && i < unuploadedChunks.length; i++) {
        uploadPromises.push(uploadNextChunk())
      }
      
      await Promise.all(uploadPromises)
      
      // 检查是否所有切片都已上传
      if (file.status === FILE_STATUS.UPLOADING && file.uploadedChunks === file.totalChunks) {
        const result = await mergeFile(fileInfo)
        file.status = FILE_STATUS.SUCCESS
        file.progress = 100
        file.speed = 0
        file.remainingTime = 0
        onSuccess(file, result)
        await deleteFileData(fileInfo.id)
      }
    } catch (error) {
      file.status = FILE_STATUS.ERROR
      file.error = error.message
      onError(file, error)
    }
  }
  
  // 添加文件
  const addFiles = async (files, autoUpload = true) => {
    await initDB()
    
    for (const file of files) {
      const fileId = generateFileId(file)
      
      // 检查是否已存在
      const existingFile = uploadedFiles.value.find(f => f.id === fileId)
      if (existingFile) {
        continue
      }
      
      // 创建文件信息
      const fileInfo = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: FILE_STATUS.PENDING,
        progress: 0,
        uploadedChunks: 0,
        totalChunks: 0,
        speed: 0,
        remainingTime: 0,
        error: null,
        addedAt: new Date()
      }
      
      uploadedFiles.value.push(fileInfo)
      
      try {
        // 切片文件
        const { chunks, totalChunks } = await sliceFile(file)
        fileInfo.totalChunks = totalChunks
        
        // 保存切片到数据库
        for (const chunk of chunks) {
          await saveChunkToDB(chunk)
        }
        
        // 保存文件信息
        await saveFileToDB(fileInfo)
        
        // 检查是否有已上传的切片
        const dbChunks = await getChunksFromDB(fileId)
        fileInfo.uploadedChunks = dbChunks.filter(chunk => chunk.uploaded).length
        fileInfo.progress = (fileInfo.uploadedChunks / fileInfo.totalChunks) * 100
        
        if (autoUpload) {
          fileInfo.status = FILE_STATUS.UPLOADING
          uploadFile(fileInfo)
        }
      } catch (error) {
        fileInfo.status = FILE_STATUS.ERROR
        fileInfo.error = error.message
        onError(fileInfo, error)
      }
    }
  }
  
  // 暂停上传
  const pauseUpload = async (fileId) => {
    const file = uploadedFiles.value.find(f => f.id === fileId)
    if (file && file.status === FILE_STATUS.UPLOADING) {
      file.status = FILE_STATUS.PAUSED
      onPaused(file)
    }
  }
  
  // 恢复上传
  const resumeUpload = async (fileId) => {
    const file = uploadedFiles.value.find(f => f.id === fileId)
    if (file && file.status === FILE_STATUS.PAUSED) {
      file.status = FILE_STATUS.UPLOADING
      onResumed(file)
      await uploadFile(file)
    }
  }
  
  // 删除文件
  const removeFile = async (fileId) => {
    const index = uploadedFiles.value.findIndex(f => f.id === fileId)
    if (index !== -1) {
      const file = uploadedFiles.value[index]
      
      // 如果正在上传，先暂停
      if (file.status === FILE_STATUS.UPLOADING) {
        file.status = FILE_STATUS.CANCELLED
      }
      
      // 删除数据库中的数据
      await deleteFileData(fileId)
      
      // 从列表中移除
      uploadedFiles.value.splice(index, 1)
    }
  }
  
  // 清空所有文件
  const clearAll = async () => {
    // 暂停所有上传
    for (const file of uploadedFiles.value) {
      if (file.status === FILE_STATUS.UPLOADING) {
        file.status = FILE_STATUS.CANCELLED
      }
    }
    
    // 清空数据库
    const db = await initDB()
    const chunkTx = db.transaction(CHUNK_STORE, 'readwrite')
    await chunkTx.objectStore(CHUNK_STORE).clear()
    await chunkTx.done
    
    const fileTx = db.transaction(FILE_STORE, 'readwrite')
    await fileTx.objectStore(FILE_STORE).clear()
    await fileTx.done
    
    // 清空列表
    uploadedFiles.value = []
  }
  
  // 恢复未完成的上传
  const restoreUploads = async () => {
    await initDB()
    
    const db = await initDB()
    const tx = db.transaction(FILE_STORE, 'readonly')
    const files = await tx.objectStore(FILE_STORE).getAll()
    
    for (const fileInfo of files) {
      if (fileInfo.status === FILE_STATUS.UPLOADING) {
        fileInfo.status = FILE_STATUS.PAUSED
      }
      
      // 重新计算进度
      const chunks = await getChunksFromDB(fileInfo.id)
      fileInfo.uploadedChunks = chunks.filter(chunk => chunk.uploaded).length
      fileInfo.progress = (fileInfo.uploadedChunks / fileInfo.totalChunks) * 100
      
      uploadedFiles.value.push(fileInfo)
    }
  }
  
  // 初始化时恢复上传
  restoreUploads()
  
  return {
    uploadedFiles,
    isUploading,
    addFiles,
    pauseUpload,
    resumeUpload,
    removeFile,
    clearAll,
    restoreUploads
  }
}