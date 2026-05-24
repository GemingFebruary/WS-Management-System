import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import './styles/index.scss'

const app = createApp(App)

app.use(pinia)
app.use(router)

// 初始化用户信息
import { useUserStore } from './stores/user'
const userStore = useUserStore()
userStore.initUserInfo()

app.mount('#app')
