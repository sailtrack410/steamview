package www.sailtrack.cn.steamview.extension;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import run.halo.app.theme.ReactiveSinglePageContentHandler;

/**
 * Steam View 单页内容处理器
 *
 * @author miku_0410
 * @since 1.0.0
 */
@Component
public class SteamViewSinglePageContentHandler implements ReactiveSinglePageContentHandler {

    @Override
    public Mono<SinglePageContentContext> handle(SinglePageContentContext context) {
        // 检查是否是 Steam View 页面
        if (context.getSinglePage() != null &&
            "steamview".equals(context.getSinglePage().getMetadata().getName())) {

            // 替换页面内容为 Steam View 的 HTML
            String steamViewHtml = generateSteamViewHtml();
            context.setContent(steamViewHtml);
        }

        return Mono.just(context);
    }
    
    /**
     * 生成 Steam View 页面的 HTML
     */
    private String generateSteamViewHtml() {
        return """
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Steam View - 游戏时长统计</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        border-radius: 20px;
                        padding: 40px;
                        max-width: 1200px;
                        width: 100%;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    }
                    h1 {
                        font-size: 48px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        margin-bottom: 10px;
                        text-align: center;
                    }
                    .subtitle {
                        text-align: center;
                        color: #666;
                        font-size: 18px;
                        margin-bottom: 30px;
                    }
                    .content {
                        text-align: center;
                        padding: 40px;
                        background: #f8f9fa;
                        border-radius: 10px;
                    }
                    .loading {
                        color: #999;
                        font-size: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Steam View</h1>
                    <p class="subtitle">游戏时长统计</p>
                    <div class="content">
                        <p class="loading">正在加载游戏数据...</p>
                    </div>
                </div>
                <script>
                    // 这里可以添加获取 Steam 数据的逻辑
                    console.log('Steam View 页面已加载');
                </script>
            </body>
            </html>
            """;
    }
}
