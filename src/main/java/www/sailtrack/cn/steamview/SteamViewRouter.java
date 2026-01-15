package www.sailtrack.cn.steamview;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginWrapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;
import run.halo.app.theme.TemplateNameResolver;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.web.reactive.function.server.RequestPredicates.GET;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

/**
 * Steam View 路由配置
 *
 * @author miku_0410
 * @since 1.0.0
 */
@Slf4j
@Configuration
@AllArgsConstructor
public class SteamViewRouter {

    private final TemplateNameResolver templateNameResolver;
    private final PluginWrapper pluginWrapper;

    @Bean
    RouterFunction<ServerResponse> steamViewRouterFunction() {
        return route(GET("/steamview"), this::renderSteamViewPage);
    }

    private Mono<ServerResponse> renderSteamViewPage(ServerRequest request) {
        log.info("开始渲染 Steam View 页面");

        Map<String, Object> model = new HashMap<>();
        model.put("version", pluginWrapper.getDescriptor().getVersion());

        return templateNameResolver.resolveTemplateNameOrDefault(
                request.exchange(),
                "steamview"
            )
            .flatMap(templateName -> {
                log.info("使用模板: {}", templateName);
                return ServerResponse.ok()
                    .render(templateName, model);
            })
            .onErrorResume(e -> {
                log.error("渲染 Steam View 页面失败", e);
                return ServerResponse.status(500)
                    .bodyValue("渲染 Steam View 页面失败: " + e.getMessage());
            });
    }
}