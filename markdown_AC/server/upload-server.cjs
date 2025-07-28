const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs').promises
const crypto = require('crypto')
const cors = require('cors')

const app = express()
const PORT = 3001

// 中间件
app.use(cors())
app.use(express.json())

// 上传目录
const UPLOAD_DIR = path.join(__dirname, 'uploads')
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp')
const FINAL_DIR = path.join(UPLOAD_DIR, 'files')

// 确保目录存在
const ensureDir = async (dir) => {
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

// 初始化目录
const initDirs = async () => {
  await ensureDir(UPLOAD_DIR)
  await ensureDir(TEMP_DIR)
  await ensureDir(FINAL_DIR)
}

// 配置 multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { fileId } = req.body
    const fileDir = path.join(TEMP_DIR, fileId)
    await ensureDir(fileDir)
    cb(null, fileDir)
  },
  filename: (req, file, cb) => {
    const { index } = req.body
    cb(null, `chunk-${index}`)
  }
})

const upload = multer({ storage })

// 上传切片
app.post('/api/upload/chunk', upload.single('chunk'), async (req, res) => {
  try {
    const { hash, index, fileId, fileName, totalChunks } = req.body
    
    if (!req.file) {
      return res.status(400).json({ error: '没有接收到文件' })
    }
    
    console.log(`接收到切片: ${fileName} - ${index}/${totalChunks}`)
    
    res.json({
      success: true,
      message: '切片上传成功',
      hash,
      index: parseInt(index)
    })
  } catch (error) {
    console.error('切片上传失败:', error)
    res.status(500).json({ error: '切片上传失败' })
  }
})

// 检查切片是否存在
app.get('/api/upload/check/:hash', async (req, res) => {
  try {
    const { hash } = req.params
    const [fileId, index] = hash.split('-')
    const chunkPath = path.join(TEMP_DIR, fileId, `chunk-${index}`)
    
    try {
      await fs.access(chunkPath)
      res.json({ exists: true })
    } catch {
      res.json({ exists: false })
    }
  } catch (error) {
    console.error('检查切片失败:', error)
    res.status(500).json({ error: '检查切片失败' })
  }
})

// 合并文件
app.post('/api/upload/merge', async (req, res) => {
  try {
    const { fileId, fileName, totalChunks, fileSize } = req.body
    
    console.log(`开始合并文件: ${fileName}`)
    
    const tempDir = path.join(TEMP_DIR, fileId)
    const finalPath = path.join(FINAL_DIR, fileName)
    
    // 检查所有切片是否存在
    const missingChunks = []
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(tempDir, `chunk-${i}`)
      try {
        await fs.access(chunkPath)
      } catch {
        missingChunks.push(i)
      }
    }
    
    if (missingChunks.length > 0) {
      return res.status(400).json({
        error: '缺少切片',
        missingChunks
      })
    }
    
    // 合并文件
    const writeStream = require('fs').createWriteStream(finalPath)
    
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(tempDir, `chunk-${i}`)
      const chunkBuffer = await fs.readFile(chunkPath)
      writeStream.write(chunkBuffer)
    }
    
    writeStream.end()
    
    // 等待写入完成
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    
    // 验证文件大小
    const stats = await fs.stat(finalPath)
    if (stats.size !== fileSize) {
      await fs.unlink(finalPath)
      return res.status(400).json({
        error: '文件大小不匹配',
        expected: fileSize,
        actual: stats.size
      })
    }
    
    // 清理临时文件
    try {
      await fs.rm(tempDir, { recursive: true })
    } catch (error) {
      console.warn('清理临时文件失败:', error)
    }
    
    console.log(`文件合并完成: ${fileName}`)
    
    res.json({
      success: true,
      message: '文件合并成功',
      fileName,
      fileSize: stats.size,
      filePath: finalPath
    })
  } catch (error) {
    console.error('文件合并失败:', error)
    res.status(500).json({ error: '文件合并失败' })
  }
})

// 获取上传的文件列表
app.get('/api/upload/files', async (req, res) => {
  try {
    const files = await fs.readdir(FINAL_DIR)
    const fileList = []
    
    for (const fileName of files) {
      const filePath = path.join(FINAL_DIR, fileName)
      const stats = await fs.stat(filePath)
      
      fileList.push({
        name: fileName,
        size: stats.size,
        uploadTime: stats.mtime,
        path: filePath
      })
    }
    
    res.json({ files: fileList })
  } catch (error) {
    console.error('获取文件列表失败:', error)
    res.status(500).json({ error: '获取文件列表失败' })
  }
})

// 下载文件
app.get('/api/upload/download/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params
    const filePath = path.join(FINAL_DIR, fileName)
    
    // 检查文件是否存在
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: '文件不存在' })
    }
    
    res.download(filePath, fileName)
  } catch (error) {
    console.error('文件下载失败:', error)
    res.status(500).json({ error: '文件下载失败' })
  }
})

// 删除文件
app.delete('/api/upload/files/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params
    const filePath = path.join(FINAL_DIR, fileName)
    
    await fs.unlink(filePath)
    
    res.json({
      success: true,
      message: '文件删除成功'
    })
  } catch (error) {
    console.error('文件删除失败:', error)
    res.status(500).json({ error: '文件删除失败' })
  }
})

// 清理临时文件（定期清理超过24小时的临时文件）
const cleanupTempFiles = async () => {
  try {
    const tempDirs = await fs.readdir(TEMP_DIR)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24小时
    
    for (const dirName of tempDirs) {
      const dirPath = path.join(TEMP_DIR, dirName)
      const stats = await fs.stat(dirPath)
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.rm(dirPath, { recursive: true })
        console.log(`清理过期临时文件: ${dirName}`)
      }
    }
  } catch (error) {
    console.error('清理临时文件失败:', error)
  }
}

// 每小时清理一次临时文件
setInterval(cleanupTempFiles, 60 * 60 * 1000)

// 启动服务器
const startServer = async () => {
  await initDirs()
  
  app.listen(PORT, () => {
    console.log(`上传服务器启动成功: http://localhost:${PORT}`)
    console.log(`上传目录: ${UPLOAD_DIR}`)
    console.log(`临时目录: ${TEMP_DIR}`)
    console.log(`文件目录: ${FINAL_DIR}`)
  })
}

startServer().catch(console.error)

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...')
  process.exit(0)
})