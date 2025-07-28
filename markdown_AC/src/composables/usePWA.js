import { ref, onMounted } from 'vue'

export function usePWA() {
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const isOnline = ref(navigator.onLine)
  const showInstallPrompt = ref(false)
  const deferredPrompt = ref(null)
  
  // 检查是否已安装
  const checkInstallStatus = () => {
    // 检查是否在独立模式下运行（已安装）
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true
      return
    }
    
    // 检查是否在 iOS Safari 的主屏幕模式下
    if (window.navigator.standalone === true) {
      isInstalled.value = true
      return
    }
    
    // 检查是否在 Android Chrome 的 TWA 模式下
    if (document.referrer.includes('android-app://')) {
      isInstalled.value = true
      return
    }
  }
  
  // 安装PWA
  const installApp = async () => {
    if (!deferredPrompt.value) {
      console.log('PWA安装提示不可用')
      return false
    }
    
    try {
      // 显示安装提示
      deferredPrompt.value.prompt()
      
      // 等待用户响应
      const { outcome } = await deferredPrompt.value.userChoice
      
      if (outcome === 'accepted') {
        console.log('用户接受了PWA安装')
        isInstallable.value = false
        deferredPrompt.value = null
        return true
      } else {
        console.log('用户拒绝了PWA安装')
        return false
      }
    } catch (error) {
      console.error('PWA安装失败:', error)
      return false
    }
  }
  
  // 获取安装指导文本
  const getInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    
    if (isIOS && isSafari) {
      return {
        title: '添加到主屏幕',
        steps: [
          '点击底部的分享按钮 📤',
          '向下滚动找到"添加到主屏幕"',
          '点击"添加"确认'
        ]
      }
    }
    
    if (navigator.userAgent.includes('Chrome')) {
      return {
        title: '安装应用',
        steps: [
          '点击地址栏右侧的安装图标',
          '或者点击菜单中的"安装应用"',
          '确认安装'
        ]
      }
    }
    
    return {
      title: '添加到主屏幕',
      steps: [
        '在浏览器菜单中查找"添加到主屏幕"选项',
        '按照提示完成安装'
      ]
    }
  }
  
  // 检查更新
  const checkForUpdates = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
          console.log('检查PWA更新完成')
        }
      } catch (error) {
        console.error('检查PWA更新失败:', error)
      }
    }
  }
  
  // 获取缓存使用情况
  const getCacheUsage = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          percentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
        }
      } catch (error) {
        console.error('获取缓存使用情况失败:', error)
        return { used: 0, quota: 0, percentage: 0 }
      }
    }
    return { used: 0, quota: 0, percentage: 0 }
  }
  
  // 清理缓存
  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        console.log('PWA缓存已清理')
        return true
      } catch (error) {
        console.error('清理PWA缓存失败:', error)
        return false
      }
    }
    return false
  }
  
  onMounted(() => {
    // 检查安装状态
    checkInstallStatus()
    
    // 检查用户是否之前拒绝过安装提示
    const dismissedTime = localStorage.getItem('pwa-install-dismissed')
    const shouldShowPrompt = !dismissedTime || (Date.now() - parseInt(dismissedTime)) > 7 * 24 * 60 * 60 * 1000 // 7天后重新显示
    
    // 监听beforeinstallprompt事件
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA安装提示可用')
      e.preventDefault()
      deferredPrompt.value = e
      isInstallable.value = true
      
      // 只有在用户没有拒绝过或者已经过了一段时间才显示提示
      if (shouldShowPrompt) {
        // 延迟显示安装提示，避免过于突兀
        setTimeout(() => {
          showInstallPrompt.value = true
        }, 5000)
      }
    })
    
    // 监听appinstalled事件
    window.addEventListener('appinstalled', () => {
      console.log('PWA已安装')
      isInstalled.value = true
      isInstallable.value = false
      deferredPrompt.value = null
    })
    
    // 监听网络状态变化
    window.addEventListener('online', () => {
      isOnline.value = true
      console.log('网络已连接')
    })
    
    window.addEventListener('offline', () => {
      isOnline.value = false
      console.log('网络已断开')
    })
    
    // 监听显示模式变化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(display-mode: standalone)')
      mediaQuery.addEventListener('change', (e) => {
        isInstalled.value = e.matches
      })
    }
  })
  
  // 关闭安装提示
  const dismissInstallPrompt = () => {
    showInstallPrompt.value = false
    // 记住用户的选择，一段时间内不再显示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }
  
  return {
    isInstallable,
    isInstalled,
    isOnline,
    showInstallPrompt,
    installApp,
    dismissInstallPrompt,
    getInstallInstructions,
    checkForUpdates,
    getCacheUsage,
    clearCache
  }
}