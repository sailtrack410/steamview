<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

// 游戏数据接口
interface Game {
  appId: string
  name: string
  coverUrl: string
  totalTime: number // 分钟
  twoWeekTime: number // 分钟
  totalPercent: number
  twoWeekPercent: number
  lastPlayed: string
}

// 响应式数据
const games = ref<Game[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectedSort = ref('twoWeekTime')

// 统计数据
const stats = computed(() => {
  const totalGames = games.value.length
  const totalTime = games.value.reduce((sum, game) => sum + game.totalTime, 0)
  const twoWeekTime = games.value.reduce((sum, game) => sum + game.twoWeekTime, 0)

  return {
    totalGames,
    totalTime: formatTime(totalTime),
    twoWeekTime: formatTime(twoWeekTime),
  }
})

// 格式化时间
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} 分钟`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} 小时`
  }
  return `${hours} 小时 ${mins} 分钟`
}

// 排序游戏
function sortGames() {
  const sorted = [...games.value]

  switch (selectedSort.value) {
    case 'twoWeekTime':
      sorted.sort((a, b) => b.twoWeekTime - a.twoWeekTime)
      break
    case 'totalTime':
      sorted.sort((a, b) => b.totalTime - a.totalTime)
      break
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'lastPlayed':
      sorted.sort((a, b) => b.lastPlayed.localeCompare(a.lastPlayed))
      break
  }

  return sorted
}

// 加载游戏数据
async function loadGames() {
  loading.value = true
  error.value = null

  try {
    const response = await fetch('/apis/steamview/games')
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = '加载游戏数据失败'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        errorMessage = errorText || errorMessage
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    games.value = data.games || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载游戏数据失败，请稍后重试'
    console.error('Failed to load games:', err)
  } finally {
    loading.value = false
  }
}

// 刷新数据
function refreshData() {
  loadGames()
}

// 排序变化处理
function handleSortChange() {
  // 排序在计算属性中处理
}

// 组件挂载时加载数据
onMounted(() => {
  loadGames()
})
</script>

<template>
  <div class="steam-view-container">
    <!-- 页面头部 -->
    <header class="page-header">
      <h1 class="page-title">Steam View</h1>
      <p class="page-subtitle">游戏时长统计</p>
    </header>

    <!-- 控制栏 -->
    <div class="controls-bar">
      <div class="sort-selector">
        <label for="sort-select">排序方式:</label>
        <select 
          id="sort-select" 
          v-model="selectedSort" 
          @change="handleSortChange"
          class="sort-select"
        >
          <option value="twoWeekTime">两周时长</option>
          <option value="totalTime">总时长</option>
          <option value="name">游戏名称</option>
          <option value="lastPlayed">最近游玩</option>
        </select>
      </div>
      
      <button @click="refreshData" class="refresh-btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        刷新数据
      </button>
    </div>

    <!-- 统计摘要 -->
    <div class="stats-summary">
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalGames }}</span>
        <span class="stat-label">游戏总数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.totalTime }}</span>
        <span class="stat-label">总时长</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.twoWeekTime }}</span>
        <span class="stat-label">两周时长</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载游戏数据...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="refreshData" class="retry-btn">重试</button>
    </div>

    <!-- 游戏列表 -->
    <div v-else class="game-grid">
      <div v-for="game in sortGames()" :key="game.appId" class="game-card">
        <div class="game-cover">
          <img :src="game.coverUrl" :alt="game.name" />
        </div>
        <div class="game-info">
          <h3 class="game-name" :title="game.name">{{ game.name }}</h3>
          <div class="game-stats">
            <div class="stat-item">
              <span class="stat-label">总时长:</span>
              <span class="stat-value">{{ formatTime(game.totalTime) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">两周时长:</span>
              <span class="stat-value">{{ formatTime(game.twoWeekTime) }}</span>
            </div>
          </div>
          <div class="progress-bars">
            <div class="progress-item">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: game.totalPercent + '%' }"
                ></div>
              </div>
              <span class="progress-label">总时长 {{ game.totalPercent.toFixed(1) }}%</span>
            </div>
            <div class="progress-item">
              <div class="progress-bar">
                <div 
                  class="progress-fill two-week" 
                  :style="{ width: game.twoWeekPercent + '%' }"
                ></div>
              </div>
              <span class="progress-label">两周 {{ game.twoWeekPercent.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 使用导入的 steamview.css */
</style>
