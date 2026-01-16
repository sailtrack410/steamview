package www.sailtrack.cn.steamview.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import run.halo.app.extension.ReactiveExtensionClient;
import run.halo.app.extension.ConfigMap;
import run.halo.app.extension.Metadata;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * 游戏数据缓存服务
 *
 * @author miku_0410
 * @since 1.0.0
 */
@Slf4j
@Service
public class GameCacheService {

    private final ReactiveExtensionClient extensionClient;
    private final ObjectMapper objectMapper;
    private static final String CACHE_RESOURCE_NAME = "game-cache";
    private static final String CACHE_DATA_KEY = "gamesData";

    public GameCacheService(ReactiveExtensionClient extensionClient) {
        this.extensionClient = extensionClient;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 获取缓存的游戏数据
     *
     * @param refreshInterval 刷新频率（小时）
     * @return 游戏数据
     */
    public Mono<Map<String, Object>> getCachedGames(int refreshInterval) {
        return extensionClient.fetch(ConfigMap.class, CACHE_RESOURCE_NAME)
            .flatMap(configMap -> {
                try {
                    String jsonData = configMap.getData().get(CACHE_DATA_KEY);
                    if (jsonData == null || jsonData.isEmpty()) {
                        return Mono.empty();
                    }

                    Map<String, Object> data = objectMapper.readValue(
                        jsonData,
                        new TypeReference<Map<String, Object>>() {}
                    );

                    // 检查缓存是否过期
                    String lastUpdatedStr = (String) data.get("lastUpdated");
                    if (lastUpdatedStr != null) {
                        Instant lastUpdated = Instant.parse(lastUpdatedStr);
                        Instant now = Instant.now();
                        long hoursSinceUpdate = java.time.Duration.between(lastUpdated, now).toHours();

                        if (hoursSinceUpdate < refreshInterval) {
                            log.info("使用缓存数据，上次更新: {} 小时前", hoursSinceUpdate);
                            return Mono.just(data);
                        } else {
                            log.info("缓存已过期（{} 小时前更新），需要刷新", hoursSinceUpdate);
                            return Mono.empty();
                        }
                    }
                    return Mono.empty();
                } catch (Exception e) {
                    log.error("读取缓存数据失败", e);
                    return Mono.empty();
                }
            })
            .onErrorResume(e -> {
                log.error("获取缓存失败", e);
                return Mono.empty();
            });
    }

    /**
     * 保存游戏数据到缓存
     *
     * @param gamesData 游戏数据
     * @return 保存结果
     */
    public Mono<Void> saveCachedGames(Map<String, Object> gamesData) {
        try {
            String jsonData = objectMapper.writeValueAsString(gamesData);
            Map<String, String> dataMap = new HashMap<>();
            dataMap.put(CACHE_DATA_KEY, jsonData);

            return extensionClient.fetch(ConfigMap.class, CACHE_RESOURCE_NAME)
                .flatMap(configMap -> {
                    // 更新现有缓存
                    configMap.setData(dataMap);
                    return extensionClient.update(configMap);
                })
                .switchIfEmpty(
                    // 创建新缓存
                    Mono.defer(() -> {
                        ConfigMap configMap = new ConfigMap();
                        Metadata metadata = new Metadata();
                        metadata.setName(CACHE_RESOURCE_NAME);
                        configMap.setMetadata(metadata);
                        configMap.setData(dataMap);
                        return extensionClient.create(configMap);
                    })
                )
                .doOnSuccess(v -> log.info("游戏数据已缓存"))
                .doOnError(e -> log.error("缓存游戏数据失败", e))
                .then();
        } catch (Exception e) {
            log.error("序列化游戏数据失败", e);
            return Mono.error(e);
        }
    }

    /**
     * 清除缓存
     *
     * @return 清除结果
     */
    public Mono<Void> clearCache() {
        return extensionClient.fetch(ConfigMap.class, CACHE_RESOURCE_NAME)
            .flatMap(extension -> extensionClient.delete(extension))
            .doOnSuccess(v -> log.info("缓存已清除"))
            .doOnError(e -> log.error("清除缓存失败", e))
            .then();
    }

    /**
     * 检查缓存是否存在
     *
     * @return 是否存在缓存
     */
    public Mono<Boolean> cacheExists() {
        return extensionClient.fetch(ConfigMap.class, CACHE_RESOURCE_NAME)
            .map(extension -> true)
            .defaultIfEmpty(false);
    }
}