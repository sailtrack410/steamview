import { createApp } from 'vue'
import HomeView from './views/HomeView.vue'

// 导入 Steam View 样式
import './assets/steamview.css'

// 创建 Vue 应用
const app = createApp(HomeView)

// 挂载应用
app.mount('#steamview-page')
