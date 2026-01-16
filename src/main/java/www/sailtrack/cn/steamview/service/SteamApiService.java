package www.sailtrack.cn.steamview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import io.netty.channel.ChannelOption;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Steam API 服务
 *
 * @author miku_0410
 * @since 1.0.0
 */
@Slf4j
@Service
public class SteamApiService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public SteamApiService() {
        HttpClient httpClient = HttpClient.create()
            .responseTimeout(Duration.ofSeconds(30))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000);

        this.webClient = WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 获取用户的 Steam ID
     *
     * @param apiKey    Steam API Key
     * @param username  Steam 用户名
     * @return Steam ID
     */
    public Mono<String> getSteamId(String apiKey, String username) {
        String url = String.format(
            "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=%s&vanityurl=%s",
            apiKey, username
        );

        log.info("请求 Steam ID: URL={}", url);

        return webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(String.class)
            .map(response -> {
                log.info("Steam API 响应: {}", response);
                try {
                    JsonNode root = objectMapper.readTree(response);
                    log.info("解析后的 JSON: {}", root.toString());
                    JsonNode responseNode = root.path("response");
                    log.info("Response 节点: {}", responseNode.toString());
                    int success = responseNode.path("success").asInt();
                    log.info("Success 值: {}", success);
                    if (success == 1) {
                        String steamId = responseNode.path("steamid").asText();
                        log.info("Steam ID: {}", steamId);
                        return steamId;
                    } else {
                        String message = responseNode.path("message").asText("Unknown error");
                        log.error("Steam ID 解析失败: {}", message);
                        throw new RuntimeException("Failed to resolve Steam ID: " + message);
                    }
                } catch (Exception e) {
                    log.error("解析 Steam ID 响应失败: {}", response, e);
                    throw new RuntimeException("Failed to parse Steam ID response", e);
                }
            })
            .doOnError(e -> log.error("获取 Steam ID 失败: {}", e.getMessage()));
    }

    /**
     * 获取用户的游戏库
     *
     * @param apiKey  Steam API Key
     * @param steamId Steam ID
     * @return 游戏列表
     */
    public Mono<List<Map<String, Object>>> getOwnedGames(String apiKey, String steamId) {
        String url = String.format(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=%s&steamid=%s&format=json&include_appinfo=true&include_played_free_games=true",
            apiKey, steamId
        );

        return webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(String.class)
            .map(response -> {
                try {
                    JsonNode root = objectMapper.readTree(response);
                    JsonNode responseNode = root.path("response");
                    JsonNode gamesNode = responseNode.path("games");

                    List<Map<String, Object>> games = new ArrayList<>();
                    for (JsonNode gameNode : gamesNode) {
                        Map<String, Object> game = new HashMap<>();
                        game.put("appId", gameNode.path("appid").asText());
                        game.put("name", gameNode.path("name").asText());
                        game.put("imgIconUrl", gameNode.path("img_icon_url").asText());
                        game.put("imgLogoUrl", gameNode.path("img_logo_url").asText());
                        game.put("hasCommunityVisibleStats", gameNode.path("has_community_visible_stats").asBoolean());
                        game.put("playtimeForever", gameNode.path("playtime_forever").asLong());
                        game.put("playtime2weeks", gameNode.path("playtime_2weeks").asLong());
                        game.put("rtimeLastPlayed", gameNode.path("rtime_last_played").asLong());
                        games.add(game);
                    }

                    return games;
                } catch (Exception e) {
                    log.error("解析游戏库响应失败", e);
                    throw new RuntimeException("Failed to parse games response", e);
                }
            })
            .doOnError(e -> log.error("获取游戏库失败: {}", e.getMessage()));
    }

    /**
     * 获取游戏封面 URL
     *
     * @param appId 游戏 App ID
     * @return 封面 URL
     */
    public String getGameCoverUrl(String appId) {
        return String.format("https://cdn.cloudflare.steamstatic.com/steam/apps/%s/header.jpg", appId);
    }

    /**
     * 获取最近游玩的游戏（包括家庭共享游戏）
     *
     * @param apiKey  Steam API Key
     * @param steamId Steam ID
     * @return 最近游玩的游戏列表
     */
    public Mono<List<Map<String, Object>>> getRecentlyPlayedGames(String apiKey, String steamId) {
        String url = String.format(
            "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=%s&steamid=%s&format=json",
            apiKey, steamId
        );

        log.info("获取最近游玩的游戏: URL={}", url);

        return webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(String.class)
            .map(response -> {
                try {
                    JsonNode root = objectMapper.readTree(response);
                    JsonNode responseNode = root.path("response");
                    JsonNode gamesNode = responseNode.path("games");

                    List<Map<String, Object>> games = new ArrayList<>();
                    for (JsonNode gameNode : gamesNode) {
                        Map<String, Object> game = new HashMap<>();
                        game.put("appId", gameNode.path("appid").asText());
                        game.put("name", gameNode.path("name").asText());
                        game.put("imgIconUrl", gameNode.path("img_icon_url").asText());
                        game.put("imgLogoUrl", gameNode.path("img_logo_url").asText());
                        game.put("playtimeForever", gameNode.path("playtime_forever").asLong());
                        game.put("playtime2weeks", gameNode.path("playtime_2weeks").asLong());
                        game.put("rtimeLastPlayed", gameNode.path("rtime_last_played").asLong());
                        games.add(game);
                    }

                    log.info("获取到 {} 个最近游玩的游戏", games.size());
                    return games;
                } catch (Exception e) {
                    log.error("解析最近游玩游戏响应失败", e);
                    throw new RuntimeException("Failed to parse recently played games response", e);
                }
            })
            .doOnError(e -> log.error("获取最近游玩游戏失败: {}", e.getMessage()));
    }

    /**
     * 获取游戏的本地化名称（中文）
     *
     * @param appId 游戏 App ID
     * @return 本地化名称，失败返回 null
     */
    public Mono<String> getLocalizedGameName(String appId) {
        String url = String.format(
            "https://store.steampowered.com/api/appdetails?appids=%s&l=schinese",
            appId
        );

        return webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(String.class)
            .map(response -> {
                try {
                    JsonNode root = objectMapper.readTree(response);
                    JsonNode appNode = root.path(appId);
                    
                    if (!appNode.has("success") || !appNode.path("success").asBoolean()) {
                        return null;
                    }
                    
                    JsonNode dataNode = appNode.path("data");
                    String name = dataNode.path("name").asText();
                    
                    log.debug("获取游戏 {} 的本地化名称: {}", appId, name);
                    return name;
                } catch (Exception e) {
                    log.error("解析游戏 {} 的本地化名称失败", appId, e);
                    return null;
                }
            })
            .onErrorResume(e -> {
                log.error("获取游戏 {} 的本地化名称失败: {}", appId, e.getMessage());
                return Mono.just(null);
            });
    }
}