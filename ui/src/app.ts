// Steam View 前端页面逻辑
// 导入样式文件
import './assets/steamview.css';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Steam View 前端页面已加载');

    const { createApp, ref, computed, onMounted } = Vue;

    const app = createApp({
        setup() {
            const games = ref([]);
            const loading = ref(true);
            const error = ref(null);
            const sortBy = ref('twoWeekTime');
            const displayCount = ref(12);
            const showSuccessTip = ref(false);

            // 统计数据
            const stats = computed(() => {
                const totalGames = games.value.length;
                const totalTime = games.value.reduce((sum, game) => sum + game.totalTime, 0);
                const twoWeekTime = games.value.reduce((sum, game) => sum + game.twoWeekTime, 0);
                const twoWeekGames = games.value.filter(game => game.twoWeekTime > 0).length;
                const twoWeekDailyAverage = Math.round(twoWeekTime / 14);
                const twoWeekTopGame = games.value
                    .filter(game => game.twoWeekTime > 0)
                    .sort((a, b) => b.twoWeekTime - a.twoWeekTime)[0];

                return {
                    totalGames,
                    totalTime: formatTime(totalTime),
                    twoWeekTime: formatTime(twoWeekTime),
                    twoWeekGames,
                    twoWeekDailyAverage: formatTime(twoWeekDailyAverage),
                    twoWeekTopGame: twoWeekTopGame ? twoWeekTopGame.name : '无'
                };
            });

            // 显示的游戏列表
            const displayedGames = computed(() => {
                const sorted = [...games.value].sort((a, b) => {
                    switch (sortBy.value) {
                        case 'twoWeekTime':
                            return b.twoWeekTime - a.twoWeekTime;
                        case 'totalTime':
                            return b.totalTime - a.totalTime;
                        case 'name':
                            return a.name.localeCompare(b.name);
                        case 'lastPlayed':
                            return b.lastPlayed.localeCompare(a.lastPlayed);
                        default:
                            return 0;
                    }
                });
                return sorted.slice(0, displayCount.value);
            });

            // 是否还有更多游戏可以加载
            const hasMoreGames = computed(() => {
                return displayedGames.value.length < games.value.length;
            });

            function formatTime(minutes) {
                if (minutes < 60) {
                    return `${minutes} 分钟`;
                }
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return mins === 0 ? `${hours} 小时` : `${hours} 小时 ${mins} 分钟`;
            }

            async function loadGames() {
                loading.value = true;
                error.value = null;
                try {
                    const response = await fetch('/steamview/games');
                    if (!response.ok) {
                        const errorText = await response.text();
                        let errorMessage = '加载游戏数据失败';
                        try {
                            const errorJson = JSON.parse(errorText);
                            errorMessage = errorJson.message || errorMessage;
                        } catch (e) {
                            errorMessage = errorText || errorMessage;
                        }
                        throw new Error(errorMessage);
                    }
                    const data = await response.json();
                    games.value = data.games || [];
                    showSuccessTip.value = true;
                    setTimeout(() => {
                        showSuccessTip.value = false;
                    }, 2000);
                } catch (err) {
                    error.value = err instanceof Error ? err.message : '加载游戏数据失败，请稍后重试';
                    console.error('Failed to load games:', err);
                } finally {
                    loading.value = false;
                }
            }

            function handleSortChange() {
                // 排序变化时自动重新渲染
            }

            function handleRefresh() {
                loadGames();
            }

            function loadMore() {
                displayCount.value += 12;
            }

            function goBack() {
                window.location.href = '/';
            }

            onMounted(() => {
                loadGames();
            });

            return {
                games,
                loading,
                error,
                sortBy,
                stats,
                displayedGames,
                hasMoreGames,
                showSuccessTip,
                formatTime,
                handleSortChange,
                handleRefresh,
                loadMore,
                goBack
            };
        },
        template: `
            <div class="steam-view-container">
                <!-- 页面头部 -->
                <header class="page-header">
                    <h1 class="page-title">Steam 游戏统计</h1>
                    <p class="page-subtitle">游戏时长统计</p>
                </header>

                <!-- 顶部区域：统计和控制 -->
                <div class="top-section">
                    <div class="stats-dashboard">
                        <div class="stats-section">
                            <h3 class="section-title">游戏统计</h3>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-icon">🎮</div>
                                    <div class="stat-content">
                                        <div class="stat-value">{{ stats.totalGames }}</div>
                                        <div class="stat-label">游戏总数</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">⏱️</div>
                                    <div class="stat-content">
                                        <div class="stat-value">{{ stats.totalTime }}</div>
                                        <div class="stat-label">总游戏时长</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">📅</div>
                                    <div class="stat-content">
                                        <div class="stat-value">{{ stats.twoWeekTime }}</div>
                                        <div class="stat-label">两周游戏时长</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">🔥</div>
                                    <div class="stat-content">
                                        <div class="stat-value">{{ stats.twoWeekGames }}</div>
                                        <div class="stat-label">两周活跃游戏</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="controls-bar">
                        <div class="sort-selector">
                            <label for="sort-select">排序方式:</label>
                            <select id="sort-select" class="sort-select" v-model="sortBy">
                                <option value="twoWeekTime">两周时长</option>
                                <option value="totalTime">总时长</option>
                                <option value="name">游戏名称</option>
                                <option value="lastPlayed">最近游玩</option>
                            </select>
                        </div>
                        <div class="refresh-btn" @click="handleRefresh">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M23 4v6h-6"></path>
                                <path d="M1 20v-6h6"></path>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                            <span>刷新数据</span>
                        </div>
                    </div>
                </div>

                <!-- 加载状态 -->
                <div class="loading-container" v-if="loading">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">正在加载游戏数据...</p>
                </div>

                <!-- 错误状态 -->
                <div class="error-container" v-else-if="error">
                    <div class="error-icon">⚠️</div>
                    <p class="error-message">{{ error }}</p>
                    <button class="retry-btn" @click="handleRefresh">重试</button>
                </div>

                <!-- 游戏卡片网格 -->
                <div class="game-grid" v-else>
                    <div class="game-card" v-for="game in displayedGames" :key="game.appId">
                        <div class="game-cover">
                            <img :src="game.coverUrl" :alt="game.name">
                        </div>
                        <div class="game-info">
                            <h3 class="game-name">{{ game.name }}</h3>
                            <div class="game-stats">
                                <div class="stat-item">
                                    <span class="stat-label">总时长</span>
                                    <span class="stat-value">{{ formatTime(game.totalTime) }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">两周时长</span>
                                    <span class="stat-value">{{ formatTime(game.twoWeekTime) }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">最后游玩</span>
                                    <span class="stat-value">{{ game.lastPlayed }}</span>
                                </div>
                            </div>
                            <div class="progress-bars">
                                <div class="progress-item">
                                    <div class="progress-bar">
                                        <div class="progress-fill" :style="{ width: game.totalPercent + '%' }"></div>
                                    </div>
                                    <div class="progress-label">总时长占比: {{ game.totalPercent.toFixed(1) }}%</div>
                                </div>
                                <div class="progress-item" v-if="game.twoWeekTime > 0">
                                    <div class="progress-bar">
                                        <div class="progress-fill two-week" :style="{ width: game.twoWeekPercent + '%' }"></div>
                                    </div>
                                    <div class="progress-label">两周时长占比: {{ game.twoWeekPercent.toFixed(1) }}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 加载更多按钮 -->
                <div class="load-more-container" v-if="hasMoreGames && !loading && !error">
                    <button class="load-more-btn" @click="loadMore">
                        加载更多 ({{ displayedGames.length }}/{{ games.length }})
                    </button>
                </div>

                <!-- 刷新成功提示 -->
                <div class="refresh-success-tip" v-if="showSuccessTip">
                    数据已刷新成功！
                </div>
            </div>
        `
    });

    app.mount('#steamview-page');
});