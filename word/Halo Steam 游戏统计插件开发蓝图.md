# Halo Steam 游戏统计插件开发蓝图

> **项目名称**: Steam View  
> **插件类型**: Halo 博客系统插件  
> **创建日期**: 2026-01-14  
> **开发模式**: 基于 Halo 官方插件开发规范

---

## 📋 目录

1. [项目概述](#项目概述)
2. [功能需求](#功能需求)
3. [技术架构](#技术架构)
4. [前端设计规范](#前端设计规范)
5. [后端实现要点](#后端实现要点)
6. [数据模型设计](#数据模型设计)
7. [开发路线图](#开发路线图)
8. [Halo 官方文档引用](#halo-官方文档引用)

---

## 项目概述

### 目标
开发一个 Halo 博客系统插件，用于展示用户的 Steam 游戏库及游戏时长统计。

### 核心价值
- 在博客中展示个人游戏数据，增加个性化内容
- 通过可视化方式呈现游戏时长分布
- 提供灵活的配置选项，满足不同用户需求

### 技术栈
- **前端**: Vue.js（Halo 推荐）
- **后端**: 遵循 Halo 官方插件开发规范
- **API**: Steam Web API

---

## 功能需求

### 1. 核心功能

#### 1.1 Steam 数据集成
- 通过 Steam API Key 获取用户游戏数据
- 支持用户名验证和匹配
- 自动获取游戏封面（Steam 默认封面）

#### 1.2 数据展示
- **游戏信息**：游戏封面、游戏名称
- **时长统计**：总时长、两周内时长
- **可视化**：双进度条设计
  - 进度条1：该游戏总时长占所有游戏总时长的比例
  - 进度条2：该游戏两周内时长占所有游戏两周时长的比例

#### 1.3 排序功能
- 默认排序：按两周时长降序
- 可选排序方式：
  - 按总时长排序
  - 按两周时长排序
  - 按游戏名称排序
  - 按最近游玩时间排序

### 2. 配置功能

#### 2.1 基础配置
- Steam API Key 输入
- Steam 用户名输入
- 数据验证（Key + 用户名匹配检查）

#### 2.2 高级配置
- 游戏显示过滤（可隐藏特定游戏）
- 数据刷新频率设置（1小时/6小时/24小时，默认24小时）
- 立即刷新按钮

### 3. 用户体验

#### 3.1 响应式设计
- 支持桌面端、平板、移动端
- 卡片式布局自适应

#### 3.2 错误处理
- 显示具体的失败原因
- 网络错误提示
- API 调用失败处理

#### 3.3 数据缓存
- 默认缓存时间：24小时
- 可自定义缓存时长
- 支持手动刷新

---

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     Halo 博客系统                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Steam View 插件                    │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                   │   │
│  │  ┌──────────────┐         ┌──────────────┐      │   │
│  │  │   前端组件    │◄────────┤   后端服务    │      │   │
│  │  │   (Vue.js)   │         │   (Halo API)  │      │   │
│  │  └──────────────┘         └──────────────┘      │   │
│  │         │                        │               │   │
│  │         │                        │               │   │
│  │         │                        ▼               │   │
│  │         │              ┌──────────────┐          │   │
│  │         │              │  数据缓存层   │          │   │
│  │         │              └──────────────┘          │   │
│  │         │                        │               │   │
│  │         │                        ▼               │   │
│  │         │              ┌──────────────┐          │   │
│  │         └─────────────►│ Steam Web API│          │   │
│  │                        └──────────────┘          │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 技术选型

#### 前端技术
- **框架**: Vue.js（版本待确认，参考 Halo 官方推荐）
- **UI 组件**: 待确认（可能使用 Halo 内置组件库）
- **样式方案**: 待确认（CSS/SCSS/预处理器）

#### 后端技术
- **插件框架**: Halo 插件系统
- **API 规范**: 遵循 Halo 官方插件开发规范
- **数据存储**: Halo 内置配置存储机制

#### 外部服务
- **Steam Web API**: 获取游戏数据
- **Steam CDN**: 获取游戏封面图片

---

## 前端设计规范

### 1. 页面结构

#### 1.1 前台展示页面

```
┌─────────────────────────────────────────────────┐
│              Steam 游戏统计                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  [排序选择器: 两周时长 ▼]                       │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  ┌─────────────────────────────────────┐  │ │
│  │  │        游戏封面图片                  │  │ │
│  │  └─────────────────────────────────────┘  │ │
│  │                                           │ │
│  │  游戏名称                                  │ │
│  │                                           │ │
│  │  总时长: 125.5 小时                        │ │
│  │  两周时长: 12.3 小时                       │ │
│  │                                           │ │
│  │  总时长占比: [████████░░░░░░░] 15%       │ │
│  │  两周时长占比: [██████████████░░] 25%    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  [更多游戏卡片...]                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 1.2 后台配置页面

```
┌─────────────────────────────────────────────────┐
│              Steam 插件配置                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  基础设置                                       │
│  ────────────────────────────────────────────  │
│  Steam API Key: [_________________] [验证]    │
│  Steam 用户名: [_________________] [验证]      │
│                                                 │
│  数据设置                                       │
│  ────────────────────────────────────────────  │
│  刷新频率: [24小时 ▼]                          │
│  [立即刷新数据]                                 │
│                                                 │
│  游戏过滤                                       │
│  ────────────────────────────────────────────  │
│  [已隐藏的游戏列表]                             │
│  ☑ 游戏A  ☑ 游戏B  ☐ 游戏C                    │
│                                                 │
│  [保存配置]                                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2. 组件设计

#### 2.1 游戏卡片组件 (GameCard)
```vue
<template>
  <div class="game-card">
    <div class="game-cover">
      <img :src="game.coverUrl" :alt="game.name" />
    </div>
    <div class="game-info">
      <h3 class="game-name">{{ game.name }}</h3>
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
            <div class="progress-fill" :style="{ width: game.totalPercent + '%' }"></div>
          </div>
          <span class="progress-label">总时长 {{ game.totalPercent }}%</span>
        </div>
        <div class="progress-item">
          <div class="progress-bar">
            <div class="progress-fill two-week" :style="{ width: game.twoWeekPercent + '%' }"></div>
          </div>
          <span class="progress-label">两周 {{ game.twoWeekPercent }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

#### 2.2 排序选择器组件 (SortSelector)
```vue
<template>
  <div class="sort-selector">
    <label>排序方式:</label>
    <select v-model="selectedSort" @change="handleSortChange">
      <option value="twoWeekTime">两周时长</option>
      <option value="totalTime">总时长</option>
      <option value="name">游戏名称</option>
      <option value="lastPlayed">最近游玩</option>
    </select>
  </div>
</template>
```

#### 2.3 配置表单组件 (ConfigForm)
```vue
<template>
  <div class="config-form">
    <div class="form-section">
      <h3>基础设置</h3>
      <div class="form-item">
        <label>Steam API Key:</label>
        <input v-model="config.apiKey" type="text" />
        <button @click="validateKey">验证</button>
      </div>
      <div class="form-item">
        <label>Steam 用户名:</label>
        <input v-model="config.username" type="text" />
        <button @click="validateUsername">验证</button>
      </div>
    </div>
    <!-- 更多配置项... -->
  </div>
</template>
```

### 3. 样式规范

#### 3.1 颜色方案
```css
/* 主色调 */
--primary-color: #1b2838; /* Steam 深蓝色 */
--accent-color: #66c0f4;  /* Steam 亮蓝色 */
--success-color: #a4d007; /* Steam 绿色 */
--warning-color: #ff9800;
--error-color: #f44336;

/* 背景色 */
--bg-primary: #171a21;
--bg-secondary: #1b2838;
--bg-card: #2a475e;

/* 文字颜色 */
--text-primary: #ffffff;
--text-secondary: #c7d5e0;
```

#### 3.2 响应式断点
```css
/* 移动端 */
@media (max-width: 768px) {
  .game-grid {
    grid-template-columns: 1fr;
  }
}

/* 平板 */
@media (min-width: 769px) and (max-width: 1024px) {
  .game-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 桌面端 */
@media (min-width: 1025px) {
  .game-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 后端实现要点

### 1. 插件基础结构

> **⚠️ 重要**: 以下结构需要根据 Halo 官方插件开发文档进行调整

```java
// 插件主类（具体类名和包结构参考 Halo 官方文档）
public class SteamViewPlugin {
    
    // 插件初始化
    public void start() {
        // 初始化逻辑
    }
    
    // 插件停止
    public void stop() {
        // 清理逻辑
    }
}
```

### 2. Steam API 集成

#### 2.1 API 端点
```
获取游戏库: https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/
参数:
  - key: Steam API Key
  - steamid: Steam 用户 ID
  - format: json
  - include_appinfo: true
  - include_played_free_games: true

获取用户信息: https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/
参数:
  - key: Steam API Key
  - steamids: Steam 用户 ID（逗号分隔）
```

#### 2.2 数据获取服务
```java
// Steam API 服务类（具体实现参考 Halo 官方文档）
public class SteamApiService {
    
    // 获取游戏库数据
    public GameLibrary getGameLibrary(String apiKey, String steamId) {
        // 调用 Steam API
        // 解析返回数据
        // 返回游戏库对象
    }
    
    // 验证 API Key 和用户名
    public boolean validateCredentials(String apiKey, String username) {
        // 验证逻辑
    }
}
```

### 3. 数据缓存机制

#### 3.1 缓存策略
```java
// 缓存管理类（具体实现参考 Halo 官方文档）
public class CacheManager {
    
    // 获取缓存的游戏数据
    public GameLibrary getCachedGames() {
        // 检查缓存是否过期
        // 返回缓存数据或 null
    }
    
    // 更新缓存
    public void updateCache(GameLibrary games) {
        // 更新缓存数据
        // 记录缓存时间
    }
    
    // 清除缓存
    public void clearCache() {
        // 清除缓存数据
    }
}
```

#### 3.2 缓存配置
```java
// 缓存配置
public class CacheConfig {
    private long cacheDuration; // 缓存时长（毫秒）
    private long lastUpdateTime; // 最后更新时间
    
    // getter/setter
}
```

### 4. 配置管理

#### 4.1 配置数据结构
```java
// 插件配置类（具体实现参考 Halo 官方文档）
public class SteamViewConfig {
    private String apiKey;
    private String username;
    private String steamId;
    private int refreshInterval; // 刷新间隔（小时）
    private List<String> hiddenGames; // 隐藏的游戏 ID 列表
    
    // getter/setter
}
```

#### 4.2 配置持久化
```java
// 配置服务类（具体实现参考 Halo 官方文档）
public class ConfigService {
    
    // 保存配置
    public void saveConfig(SteamViewConfig config) {
        // 保存到 Halo 配置系统
    }
    
    // 加载配置
    public SteamViewConfig loadConfig() {
        // 从 Halo 配置系统加载
    }
}
```

### 5. REST API 端点

> **⚠️ 重要**: 以下 API 设计需要根据 Halo 官方文档的规范进行调整

```
GET /api/plugins/steam-view/games
  - 获取游戏列表（带缓存检查）

GET /api/plugins/steam-view/config
  - 获取插件配置

POST /api/plugins/steam-view/config
  - 更新插件配置

POST /api/plugins/steam-view/refresh
  - 立即刷新游戏数据

POST /api/plugins/steam-view/validate
  - 验证 Steam 凭据
  - Body: { apiKey, username }
```

---

## 数据模型设计

### 1. 游戏数据模型

```java
public class Game {
    private String appId;          // Steam 应用 ID
    private String name;           // 游戏名称
    private String coverUrl;       // 封面图片 URL
    private int totalTime;         // 总时长（分钟）
    private int twoWeekTime;       // 两周时长（分钟）
    private double totalPercent;   // 总时长占比（0-100）
    private double twoWeekPercent; // 两周时长占比（0-100）
    private boolean hidden;        // 是否隐藏
    
    // getter/setter
}
```

### 2. 游戏库数据模型

```java
public class GameLibrary {
    private List<Game> games;
    private int totalGameCount;
    private int totalPlayTime;     // 所有游戏总时长
    private int twoWeekPlayTime;   // 所有游戏两周总时长
    private long lastUpdateTime;   // 最后更新时间
    
    // 计算占比的方法
    public void calculatePercentages() {
        // 计算每个游戏的时长占比
    }
}
```

### 3. 配置数据模型

```java
public class SteamViewConfig {
    private String apiKey;
    private String username;
    private String steamId;
    private int refreshInterval;   // 1, 6, 24
    private List<String> hiddenGames;
    private boolean enabled;
    
    // getter/setter
}
```

---

## 开发路线图

### 阶段一：项目初始化（1-2天）
- [ ] 创建插件项目结构
- [ ] 配置开发环境
- [ ] 集成 Halo 插件开发框架
- [ ] 创建基础的前端和后端模块

### 阶段二：后端开发（3-5天）
- [ ] 实现 Steam API 集成
- [ ] 开发数据缓存机制
- [ ] 实现配置管理功能
- [ ] 创建 REST API 端点
- [ ] 编写单元测试

### 阶段三：前端开发（3-5天）
- [ ] 实现游戏卡片组件
- [ ] 开发配置页面
- [ ] 实现排序功能
- [ ] 添加响应式设计
- [ ] 实现错误处理

### 阶段四：集成测试（2-3天）
- [ ] 端到端测试
- [ ] 性能优化
- [ ] 兼容性测试
- [ ] 用户体验测试

### 阶段五：文档和发布（1-2天）
- [ ] 编写用户文档
- [ ] 准备发布包
- [ ] 测试安装流程
- [ ] 发布插件

**预计总开发时间**: 10-17 天

---

## Halo 官方文档引用

### ⚠️ 重要提示

以下部分需要参考 Halo 官方插件开发文档进行详细实现：

### 1. 插件基础架构
**文档位置**: https://docs.halo.run/category/%E6%8F%92%E4%BB%B6%E5%BC%80%E5%8F%91/

**需要确认的内容**:
- [ ] 插件项目的标准目录结构
- [ ] 插件主类的命名规范和继承关系
- [ ] 插件生命周期管理（初始化、启动、停止）
- [ ] 插件配置文件格式和位置

### 2. 前端开发规范
**文档位置**: 待确认

**需要确认的内容**:
- [ ] Vue.js 版本要求
- [ ] 前端组件的注册和使用方式
- [ ] 与 Halo 后端 API 的通信方式
- [ ] 前端资源打包和部署流程

### 3. 后端开发规范
**文档位置**: 待确认

**需要确认的内容**:
- [ ] 后端服务类的创建和管理
- [ ] REST API 端点的注册规范
- [ ] 数据持久化机制
- [ ] 权限和安全要求

### 4. 配置管理
**文档位置**: 待确认

**需要确认的内容**:
- [ ] 插件配置的存储方式
- [ ] 配置更新的监听机制
- [ ] 配置验证的最佳实践

### 5. 插件打包和发布
**文档位置**: 待确认

**需要确认的内容**:
- [ ] 插件打包格式和工具
- [ ] 版本管理规范
- [ ] 依赖管理方式
- [ ] 发布流程和渠道

### 6. 测试和调试
**文档位置**: 待确认

**需要确认的内容**:
- [ ] 本地开发环境搭建
- [ ] 插件调试方法
- [ ] 单元测试和集成测试规范

---

## 附录

### A. Steam API 参考

#### A.1 获取 Steam API Key
1. 访问 https://steamcommunity.com/dev/apikey
2. 登录 Steam 账号
3. 填写域名信息
4. 获取 API Key

#### A.2 获取 Steam ID
- 通过用户名解析：`https://steamcommunity.com/id/{username}/?xml=1`
- 从 XML 响应中提取 `steamID64`

#### A.3 API 调用限制
- 请求频率限制：每分钟最多 100 次
- 建议使用缓存减少 API 调用

### B. 错误代码参考

| 错误代码 | 描述 | 处理方式 |
|---------|------|---------|
| 403 | API Key 无效 | 提示用户检查 API Key |
| 404 | 用户不存在 | 提示用户检查用户名 |
| 429 | 请求过于频繁 | 使用缓存数据，提示稍后重试 |
| 500 | 服务器错误 | 显示友好错误信息，记录日志 |

### C. 开发工具推荐

- **IDE**: IntelliJ IDEA / VS Code
- **API 测试**: Postman / curl
- **版本控制**: Git
- **构建工具**: Maven / Gradle（根据 Halo 要求）

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-01-14 | 1.0.0 | 初始版本，完成功能需求分析和技术架构设计 | iFlow |

---

## 联系方式

如有问题或建议，请联系项目维护者。

---

**文档结束**