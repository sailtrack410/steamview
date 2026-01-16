import { definePlugin } from "@halo-dev/console-shared";
import Games from "./views/Games.vue";
import RiGamepadLine from "~icons/ri/gamepad-line";
import { markRaw } from "vue";

export default definePlugin({
  components: {},
  routes: [
    {
      parentName: "Root",
      route: {
        path: "/steamview",
        name: "SteamView",
        component: Games,
        meta: {
          title: "Steam 游戏管理",
          searchable: true,
          permissions: ["plugin:steamview:view"],
          menu: {
            name: "Steam 游戏管理",
            group: "content",
            icon: markRaw(RiGamepadLine),
            priority: 0,
          },
        },
      },
    },
  ],
  extensionPoints: {},
});
