import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 导入样式文件
import './assets/css/index.scss'
import 'highlight.js/styles/github.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
