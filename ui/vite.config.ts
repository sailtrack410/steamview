import { viteConfig } from "@halo-dev/ui-plugin-bundler-kit";
import Icons from "unplugin-icons/vite";
import { fileURLToPath, URL } from 'node:url';

export default viteConfig({
  vite: {
    plugins: [
      Icons({ compiler: 'vue3' }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
