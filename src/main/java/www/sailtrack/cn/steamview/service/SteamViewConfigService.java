package www.sailtrack.cn.steamview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import run.halo.app.plugin.ReactiveSettingFetcher;

import java.util.List;

/**
 * Steam View 配置服务
 *
 * @author miku_0410
 * @since 1.0.0
 */
@Slf4j
@Service
public class SteamViewConfigService {

    private final ReactiveSettingFetcher settingFetcher;
    private final ObjectMapper objectMapper;

    public SteamViewConfigService(ReactiveSettingFetcher settingFetcher) {
        this.settingFetcher = settingFetcher;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 获取 Steam API Key
     *
     * @return API Key
     */
    public Mono<String> getSteamApiKey() {
        return getSettingValue("steamApiKey");
    }

    /**
     * 获取 Steam ID
     *
     * @return Steam ID
     */
    public Mono<String> getSteamId() {
        return getSettingValue("steamId");
    }

    /**
     * 获取数据刷新频率（小时）
     *
     * @return 刷新频率
     */
    public Mono<Integer> getRefreshInterval() {
        return getSettingValue("refreshInterval")
            .map(value -> {
                if (value == null || value.isEmpty()) {
                    return 24;
                }
                try {
                    return Integer.parseInt(value);
                } catch (NumberFormatException e) {
                    log.error("解析刷新频率失败: {}", value, e);
                    return 24;
                }
            })
            .defaultIfEmpty(24);
    }

    /**
     * 获取隐藏的游戏列表
     *
     * @return 游戏 App ID 列表
     */
    public Mono<List<String>> getHiddenGames() {
        return getSettingValue("hiddenGames")
            .map(hiddenGames -> {
                if (hiddenGames == null || hiddenGames.isEmpty()) {
                    return List.<String>of();
                }
                // 解析 JSON 数组字符串
                try {
                    JsonNode node = objectMapper.readTree(hiddenGames);
                    if (node.isArray()) {
                        List<String> result = new java.util.ArrayList<>();
                        for (JsonNode item : node) {
                            result.add(item.asText());
                        }
                        return result;
                    }
                    return List.<String>of();
                } catch (Exception e) {
                    log.error("解析隐藏游戏列表失败", e);
                    return List.<String>of();
                }
            })
            .defaultIfEmpty(List.<String>of());
    }

    /**
     * 从 Setting 资源中获取配置值
     *
     * @param key 配置键
     * @return 配置值
     */
    private Mono<String> getSettingValue(String key) {
        return settingFetcher.get("base")
            .map(item -> {
                try {
                    JsonNode valueNode = item.path(key);
                    if (valueNode == null || valueNode.isNull()) {
                        return "";
                    }
                    return valueNode.asText();
                } catch (Exception e) {
                    log.error("读取配置值失败: {}", e.getMessage());
                    return "";
                }
            })
            .defaultIfEmpty("");
    }
}