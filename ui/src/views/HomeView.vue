<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'

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
const displayCount = ref(12) // 默认显示12个游戏
const hasMore = ref(false) // 是否还有更多游戏
const chartInstance = ref<any>(null) // 图表实例
const refreshSuccess = ref(false) // 刷新成功提示
const refreshSuccessTimer = ref<number | null>(null) // 刷新成功提示定时器

// 图表颜色
const chartColors = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF'
]

// Chart 类型声明
declare const Chart: any

// 统计数据
const stats = computed(() => {
  const totalGames = games.value.length
  const totalTime = games.value.reduce((sum, game) => sum + game.totalTime, 0)
  const twoWeekTime = games.value.reduce((sum, game) => sum + game.twoWeekTime, 0)
  const averageTime = totalGames > 0 ? Math.round(totalTime / totalGames) : 0

  // 两周内游玩的游戏数
  const twoWeekGames = games.value.filter(game => game.twoWeekTime > 0).length

  // 两周内日均时长（14天）
  const twoWeekDailyAverage = Math.round(twoWeekTime / 14)

  // 两周内最常玩的游戏
  const twoWeekTopGame = games.value
    .filter(game => game.twoWeekTime > 0)
    .sort((a, b) => b.twoWeekTime - a.twoWeekTime)[0]

  return {
    totalGames,
    totalTime: formatTime(totalTime),
    twoWeekTime: formatTime(twoWeekTime),
    averageTime: formatTime(averageTime),
    twoWeekGames,
    twoWeekDailyAverage: formatTime(twoWeekDailyAverage),
    twoWeekTopGame: twoWeekTopGame ? twoWeekTopGame.name : '无'
  }
})

// 显示的游戏列表（分页）
const displayGames = computed(() => {
  return sortGames().slice(0, displayCount.value)
})

// 是否还有更多游戏
const hasMoreGames = computed(() => {
  return displayCount.value < games.value.length
})

// Top 5 游戏（按总时长）
const topGames = computed(() => {
  if (games.value.length === 0) return []
  return [...games.value]
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, 5)
    .map(game => ({
      ...game,
      totalPercent: (game.totalTime / games.value.reduce((sum, g) => sum + g.totalTime, 0)) * 100
    }))
})

// 两周内活跃游戏列表（按时长排序）
const twoWeekActiveGames = computed(() => {
  const activeGames = games.value.filter(game => game.twoWeekTime > 0)
  if (activeGames.length === 0) return []
  
  const totalTwoWeekTime = activeGames.reduce((sum, game) => sum + game.twoWeekTime, 0)
  
  return activeGames
    .sort((a, b) => b.twoWeekTime - a.twoWeekTime)
    .map(game => ({
      ...game,
      twoWeekPercent: (game.twoWeekTime / totalTwoWeekTime) * 100
    }))
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

// 初始化图表
function initChart() {
  const canvas = document.getElementById('gameChart') as HTMLCanvasElement
  if (!canvas || games.value.length === 0) return
  
  // 动态加载 Chart.js
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
  script.onload = () => {
    renderChart()
  }
  document.head.appendChild(script)
}

// 渲染图表
function renderChart() {
  const canvas = document.getElementById('gameChart') as HTMLCanvasElement
  if (!canvas || topGames.value.length === 0) return
  
  const ctx = canvas.getContext('2d')
  
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
  
  const Chart = (window as any).Chart
  
  chartInstance.value = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: topGames.value.map(g => g.name),
      datasets: [{
        data: topGames.value.map(g => g.totalTime),
        backgroundColor: chartColors,
        borderColor: 'rgba(0,0,0,0.5)',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const game = topGames.value[context.dataIndex]
              return `${game.name}: ${formatTime(game.totalTime)}`
            }
          }
        }
      }
    }
  })
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
    
    // 显示刷新成功提示
    refreshSuccess.value = true
    if (refreshSuccessTimer.value) {
      clearTimeout(refreshSuccessTimer.value)
    }
    refreshSuccessTimer.value = window.setTimeout(() => {
      refreshSuccess.value = false
    }, 2000)
    
    // 等待 DOM 更新后初始化图表
    if (games.value.length > 0) {
      await nextTick()
      initChart()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载游戏数据失败，请稍后重试'
    console.error('Failed to load games:', err)
  } finally {
    loading.value = false
  }
}

// 刷新数据
function refreshData() {
  displayCount.value = 12 // 重置显示数量
  loadGames()
}

// 加载更多游戏
function loadMore() {
  displayCount.value += 12 // 每次增加12个
}

// 返回首页
function goHome() {
  window.location.href = '/'
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
    <!-- 返回按钮 -->
    <button @click="goHome" class="back-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      返回
    </button>

    <!-- 顶部区域：标题 + 控制栏 -->
    <div class="top-section">
      <!-- 左侧：标题 -->
      <header class="page-header">
        <h1 class="page-title">Steam View</h1>
        <p class="page-subtitle">游戏时长统计</p>
      </header>

      <!-- 右侧：控制栏 -->
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
        
        <button @click="refreshData" class="refresh-btn" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{ 'rotating': loading }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ loading ? '加载中...' : refreshSuccess ? '刷新成功 ✓' : '刷新数据' }}
        </button>
        
        <!-- 刷新成功提示 -->
        <transition name="fade">
          <div v-if="refreshSuccess" class="refresh-success-tip">
            ✓ 数据已更新
          </div>
        </transition>
      </div>
    </div>

    <!-- 可视化数据面板 -->
    <div class="stats-dashboard">
      <!-- 左侧：环形图 -->
      <div class="chart-section">
        <h3 class="section-title">Top 5 游戏时长占比</h3>
        <div class="chart-container">
          <canvas id="gameChart"></canvas>
        </div>
        <div class="chart-legend" v-if="topGames.length > 0">
          <div v-for="(game, index) in topGames" :key="game.appId" class="legend-item">
            <span class="legend-color" :style="{ backgroundColor: chartColors[index] }"></span>
            <span class="legend-name">{{ game.name }}</span>
            <span class="legend-value">{{ game.totalPercent.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- 右侧：统计数据 -->
      <div class="stats-section">
        <h3 class="section-title">两周内活跃度</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🎮</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.twoWeekGames }}</div>
              <div class="stat-label">游玩游戏数</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.twoWeekTime }}</div>
              <div class="stat-label">总时长</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.twoWeekDailyAverage }}</div>
              <div class="stat-label">日均时长</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.twoWeekTopGame }}</div>
              <div class="stat-label">最常玩</div>
            </div>
          </div>
        </div>

        <!-- 两周内活跃游戏进度条 -->
        <div v-if="twoWeekActiveGames.length > 0" class="active-games-list">
          <div v-for="game in twoWeekActiveGames" :key="game.appId" class="active-game-item">
            <div class="active-game-info">
              <span class="active-game-name">{{ game.name }}</span>
              <span class="active-game-percent">{{ game.twoWeekPercent.toFixed(1) }}%</span>
            </div>
            <div class="active-game-progress">
              <div class="progress-bar">
                <div class="progress-fill two-week" :style="{ width: game.twoWeekPercent + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
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
      <div v-for="game in displayGames" :key="game.appId" class="game-card">
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

    <!-- 加载更多按钮 -->
    <div v-if="!loading && !error && hasMoreGames" class="load-more-container">
      <button @click="loadMore" class="load-more-btn">
        加载更多
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 使用导入的 steamview.css */
</style>
