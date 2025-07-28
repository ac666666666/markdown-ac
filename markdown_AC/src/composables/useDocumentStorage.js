import { ref, watch } from 'vue'

// 存储键名
const STORAGE_KEY = 'markdown_documents'
const CURRENT_DOC_KEY = 'current_document_id'

// 检测存储支持
const isLocalStorageSupported = () => {
  try {
    const test = 'test'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

// 使用 localStorage 或 sessionStorage 作为备选
const getStorage = () => {
  if (isLocalStorageSupported()) {
    return localStorage
  }
  return sessionStorage
}

export function useDocumentStorage() {
  const storage = getStorage()
  
  // 从存储中加载文档
  const loadDocuments = () => {
    try {
      const stored = storage.getItem(STORAGE_KEY)
      if (stored) {
        const documents = JSON.parse(stored)
        // 转换日期字符串回 Date 对象
        return documents.map(doc => ({
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt)
        }))
      }
    } catch (error) {
      console.error('加载文档失败:', error)
    }
    return []
  }
  
  // 保存文档到存储
  const saveDocuments = (documents) => {
    try {
      const documentsToSave = documents.map(doc => ({
        ...doc,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
      }))
      storage.setItem(STORAGE_KEY, JSON.stringify(documentsToSave))
      return true
    } catch (error) {
      console.error('保存文档失败:', error)
      // 如果存储空间不足，尝试清理旧数据
      if (error.name === 'QuotaExceededError') {
        try {
          // 只保留最近的50个文档
          const recentDocuments = documents
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 50)
          const documentsToSave = recentDocuments.map(doc => ({
            ...doc,
            createdAt: doc.createdAt.toISOString(),
            updatedAt: doc.updatedAt.toISOString()
          }))
          storage.setItem(STORAGE_KEY, JSON.stringify(documentsToSave))
          console.warn('存储空间不足，已清理旧文档，只保留最近50个')
          return true
        } catch (retryError) {
          console.error('清理后仍然保存失败:', retryError)
          return false
        }
      }
      return false
    }
  }
  
  // 保存当前文档ID
  const saveCurrentDocumentId = (docId) => {
    try {
      if (docId) {
        storage.setItem(CURRENT_DOC_KEY, docId.toString())
      } else {
        storage.removeItem(CURRENT_DOC_KEY)
      }
    } catch (error) {
      console.error('保存当前文档ID失败:', error)
    }
  }
  
  // 加载当前文档ID
  const loadCurrentDocumentId = () => {
    try {
      return storage.getItem(CURRENT_DOC_KEY)
    } catch (error) {
      console.error('加载当前文档ID失败:', error)
      return null
    }
  }
  
  // 添加文档
  const addDocument = (documents, newDoc) => {
    const updatedDocuments = [newDoc, ...documents.value]
    documents.value = updatedDocuments
    saveDocuments(updatedDocuments)
    return newDoc
  }
  
  // 更新文档
  const updateDocument = (documents, docId, updates) => {
    const index = documents.value.findIndex(doc => doc.id === docId)
    if (index !== -1) {
      const updatedDoc = {
        ...documents.value[index],
        ...updates,
        updatedAt: new Date()
      }
      documents.value[index] = updatedDoc
      saveDocuments(documents.value)
      return updatedDoc
    }
    return null
  }
  
  // 删除文档
  const deleteDocument = (documents, docId) => {
    const index = documents.value.findIndex(doc => doc.id === docId)
    if (index !== -1) {
      documents.value.splice(index, 1)
      saveDocuments(documents.value)
      return true
    }
    return false
  }
  
  // 清空所有文档
  const clearAllDocuments = (documents) => {
    documents.value = []
    try {
      storage.removeItem(STORAGE_KEY)
      storage.removeItem(CURRENT_DOC_KEY)
    } catch (error) {
      console.error('清空文档失败:', error)
    }
  }
  
  // 导出文档数据
  const exportDocuments = (documents) => {
    try {
      const dataStr = JSON.stringify(documents.value, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `markdown_documents_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('导出文档失败:', error)
      return false
    }
  }
  
  // 导入文档数据
  const importDocuments = (documents, file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          if (Array.isArray(importedData)) {
            const processedDocs = importedData.map(doc => ({
              ...doc,
              id: doc.id || Date.now() + Math.random(),
              createdAt: new Date(doc.createdAt || Date.now()),
              updatedAt: new Date(doc.updatedAt || Date.now()),
              tags: doc.tags || ['导入']
            }))
            documents.value = [...processedDocs, ...documents.value]
            saveDocuments(documents.value)
            resolve(processedDocs.length)
          } else {
            reject(new Error('导入文件格式不正确'))
          }
        } catch (error) {
          reject(new Error('解析导入文件失败: ' + error.message))
        }
      }
      reader.onerror = () => reject(new Error('读取导入文件失败'))
      reader.readAsText(file)
    })
  }
  
  // 获取存储使用情况
  const getStorageUsage = () => {
    try {
      const used = new Blob([storage.getItem(STORAGE_KEY) || '']).size
      const total = 5 * 1024 * 1024 // 假设 5MB 限制
      return {
        used,
        total,
        percentage: (used / total) * 100,
        remaining: total - used
      }
    } catch (error) {
      console.error('获取存储使用情况失败:', error)
      return {
        used: 0,
        total: 0,
        percentage: 0,
        remaining: 0
      }
    }
  }
  
  // 创建响应式文档管理器
  const createDocumentManager = (initialDocuments = []) => {
    // 先尝试从存储加载，如果没有则使用初始文档
    const storedDocuments = loadDocuments()
    const documents = ref(storedDocuments.length > 0 ? storedDocuments : initialDocuments)
    
    // 监听文档变化并自动保存
    watch(
      documents,
      (newDocuments) => {
        saveDocuments(newDocuments)
      },
      { deep: true }
    )
    
    return {
      documents,
      addDocument: (newDoc) => addDocument(documents, newDoc),
      updateDocument: (docId, updates) => updateDocument(documents, docId, updates),
      deleteDocument: (docId) => deleteDocument(documents, docId),
      clearAllDocuments: () => clearAllDocuments(documents),
      exportDocuments: () => exportDocuments(documents),
      importDocuments: (file) => importDocuments(documents, file),
      saveCurrentDocumentId,
      loadCurrentDocumentId,
      getStorageUsage
    }
  }
  
  return {
    loadDocuments,
    saveDocuments,
    saveCurrentDocumentId,
    loadCurrentDocumentId,
    addDocument,
    updateDocument,
    deleteDocument,
    clearAllDocuments,
    exportDocuments,
    importDocuments,
    getStorageUsage,
    createDocumentManager
  }
}