package www.sailtrack.cn.steamview.controller;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import www.sailtrack.cn.steamview.service.GameCacheService;
import www.sailtrack.cn.steamview.service.SteamApiService;
import www.sailtrack.cn.steamview.service.SteamViewConfigService;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Steam View 控制器
 *
 * @author miku_0410
 * @since 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/steamview")
@AllArgsConstructor
public class SteamViewController {

    private final SteamApiService steamApiService;
    private final SteamViewConfigService configService;
    private final GameCacheService gameCacheService;

    /**
     * 获取游戏数据
     *
     * @return 游戏数据列表
     */
    @GetMapping("/games")
    @PreAuthorize("permitAll()")
    public Mono<Map<String, Object>> getGames() {
        log.info("开始获取游戏数据");

        return configService.getRefreshInterval()
            .flatMap(refreshInterval -> {
                // 先尝试从缓存获取
                return gameCacheService.getCachedGames(refreshInterval)
                    .flatMap(cachedData -> {
                        if (cachedData != null) {
                            log.info("使用缓存数据");
                            return Mono.just(cachedData);
                        }
                        // 缓存不存在或过期，从 Steam API 获取
                        return fetchFromSteamApi();
                    })
                    .switchIfEmpty(fetchFromSteamApi());
            })
            .doOnError(e -> log.error("获取游戏数据失败: {}", e.getMessage()));
    }

    /**
     * 从 Steam API 获取游戏数据
     *
     * @return 游戏数据
     */
    private Mono<Map<String, Object>> fetchFromSteamApi() {
        log.info("从 Steam API 获取游戏数据");

        return configService.getSteamApiKey()
            .flatMap(apiKey -> {
                if (apiKey == null || apiKey.isEmpty()) {
                    return Mono.error(new RuntimeException("Steam API Key 未配置"));
                }

                return configService.getSteamId()
                    .flatMap(steamId -> {
                        if (steamId == null || steamId.isEmpty()) {
                            return Mono.error(new RuntimeException("Steam ID 未配置"));
                        }

                        // 同时获取拥有的游戏和最近游玩的游戏（包括家庭共享）
                        return Mono.zip(
                            steamApiService.getOwnedGames(apiKey, steamId),
                            steamApiService.getRecentlyPlayedGames(apiKey, steamId)
                        ).flatMap(tuple -> {
                            List<Map<String, Object>> ownedGames = tuple.getT1();
                            List<Map<String, Object>> recentlyPlayedGames = tuple.getT2();

                            // 合并数据：以拥有的游戏为基础，补充最近游玩的游戏（包括家庭共享）
                            Map<String, Map<String, Object>> allGamesMap = new HashMap<>();

                            // 先添加拥有的游戏
                            for (Map<String, Object> game : ownedGames) {
                                allGamesMap.put((String) game.get("appId"), game);
                            }

                            // 补充最近游玩的游戏（包括家庭共享游戏）
                            for (Map<String, Object> game : recentlyPlayedGames) {
                                String appId = (String) game.get("appId");
                                if (!allGamesMap.containsKey(appId)) {
                                    allGamesMap.put(appId, game);
                                }
                            }

                            List<Map<String, Object>> allGames = new ArrayList<>(allGamesMap.values());
                            log.info("合并后共 {} 个游戏（包括家庭共享）", allGames.size());

                            return processGames(allGames)
                                .flatMap(result -> {
                                    // 添加更新时间戳
                                    result.put("lastUpdated", Instant.now().toString());
                                    // 保存到缓存
                                    return gameCacheService.saveCachedGames(result)
                                        .thenReturn(result);
                                });
                        });
                    });
            });
    }

    /**
     * 测试 Steam API 连接
     *
     * @return 测试结果
     */
    @GetMapping("/test")
    @PreAuthorize("permitAll()")
    public Mono<Map<String, Object>> testConnection() {
        log.info("开始测试 Steam API 连接");

        return configService.getSteamApiKey()
            .switchIfEmpty(Mono.just(""))
            .flatMap(apiKey -> {
                if (apiKey.isEmpty()) {
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", false);
                    result.put("message", "Steam API Key 未配置");
                    return Mono.just(result);
                }

                return configService.getSteamId()
                    .switchIfEmpty(Mono.just(""))
                    .flatMap(steamId -> {
                        if (steamId.isEmpty()) {
                            Map<String, Object> result = new HashMap<>();
                            result.put("success", false);
                            result.put("message", "Steam ID 未配置");
                            return Mono.just(result);
                        }

                        return steamApiService.getOwnedGames(apiKey, steamId)
                            .map(games -> {
                                Map<String, Object> result = new HashMap<>();
                                result.put("success", true);
                                result.put("message", "连接成功！找到 " + games.size() + " 个游戏");
                                result.put("gameCount", games.size());
                                return result;
                            })
                            .onErrorResume(e -> {
                                Map<String, Object> result = new HashMap<>();
                                result.put("success", false);
                                result.put("message", "连接失败: " + e.getMessage());
                                return Mono.just(result);
                            });
                    });
            });
    }

    /**
     * 手动刷新游戏数据
     *
     * @return 刷新结果
     */
    @PostMapping("/refresh")
    @PreAuthorize("permitAll()")
    public Mono<Map<String, Object>> refreshGames() {
        log.info("手动刷新游戏数据");

        return fetchFromSteamApi()
            .flatMap(result -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "刷新成功");
                response.put("data", result);
                return Mono.just(response);
            })
            .onErrorResume(e -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "刷新失败: " + e.getMessage());
                return Mono.just(response);
            });
    }

    /**
     * 处理游戏数据
     *
     * @param rawGames 原始游戏数据
     * @return 处理后的游戏数据
     */
    private Mono<Map<String, Object>> processGames(List<Map<String, Object>> rawGames) {
        return configService.getHiddenGames()
            .flatMapMany(hiddenGames -> {
                List<Map<String, Object>> games = new ArrayList<>();
                long totalTime = 0;
                long twoWeekTime = 0;

                for (Map<String, Object> rawGame : rawGames) {
                    String appId = (String) rawGame.get("appId");

                    // 跳过隐藏的游戏
                    if (hiddenGames.contains(appId)) {
                        continue;
                    }

                    long playtimeForever = (Long) rawGame.getOrDefault("playtimeForever", 0L);
                    long playtime2weeks = (Long) rawGame.getOrDefault("playtime2weeks", 0L);

                    // 移除过滤条件，显示所有游戏（包括家庭库和没玩过的）
                    // if (playtimeForever == 0 && playtime2weeks == 0) {
                    //     continue;
                    // }

                    totalTime += playtimeForever;
                    twoWeekTime += playtime2weeks;

                    Map<String, Object> game = new HashMap<>();
                    game.put("appId", appId);
                    game.put("name", rawGame.get("name"));
                    game.put("coverUrl", steamApiService.getGameCoverUrl(appId));
                    game.put("totalTime", playtimeForever);
                    game.put("twoWeekTime", playtime2weeks);

                    // 格式化最后游玩时间
                    Long rtimeLastPlayed = (Long) rawGame.get("rtimeLastPlayed");
                    if (rtimeLastPlayed != null && rtimeLastPlayed > 0) {
                        ZonedDateTime dateTime = ZonedDateTime.ofInstant(
                            Instant.ofEpochSecond(rtimeLastPlayed),
                            ZoneId.systemDefault()
                        );
                        game.put("lastPlayed", dateTime.toLocalDate().toString());
                    } else {
                        game.put("lastPlayed", "从未游玩");
                    }

                    games.add(game);
                }

                // 为每个游戏获取本地化名称（并发请求，限制并发数为 10）
                return Flux.fromIterable(games)
                    .flatMap(game -> {
                        String appId = (String) game.get("appId");
                        return steamApiService.getLocalizedGameName(appId)
                            .map(localizedName -> {
                                if (localizedName != null && !localizedName.isEmpty()) {
                                    game.put("name", localizedName);
                                }
                                return game;
                            })
                            .onErrorResume(e -> Mono.just(game)); // 失败时保留原名称
                    }, 10); // 限制并发数为 10
            })
            .collectList()
            .map(games -> {
                long totalTime = games.stream()
                    .mapToLong(g -> (Long) g.get("totalTime"))
                    .sum();
                long twoWeekTime = games.stream()
                    .mapToLong(g -> (Long) g.get("twoWeekTime"))
                    .sum();

                // 计算百分比
                for (Map<String, Object> game : games) {
                    long gameTotalTime = (Long) game.get("totalTime");
                    long gameTwoWeekTime = (Long) game.get("twoWeekTime");

                    double totalPercent = totalTime > 0 ? (gameTotalTime * 100.0 / totalTime) : 0;
                    double twoWeekPercent = twoWeekTime > 0 ? (gameTwoWeekTime * 100.0 / twoWeekTime) : 0;

                    game.put("totalPercent", totalPercent);
                    game.put("twoWeekPercent", twoWeekPercent);
                }

                Map<String, Object> result = new HashMap<>();
                result.put("games", games);
                result.put("stats", Map.of(
                    "totalGames", games.size(),
                    "totalTime", totalTime,
                    "twoWeekTime", twoWeekTime
                ));

                return result;
            });
    }
}