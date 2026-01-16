<script setup lang="ts">
import {
  VCard,
  IconRefreshLine,
  Dialog,
  VButton,
  VEmpty,
  VLoading,
  VPageHeader,
  VDropdownItem,
  Toast,
  VSpace,
  IconAddCircle,
  IconEye,
  IconEyeOff,
  VDropdown,
} from "@halo-dev/components";
import { useQuery } from "@tanstack/vue-query";
import { computed, onMounted, ref } from "vue";
import { formatTime } from "@/utils/time";

// 定义组件名称
defineOptions({
  name: "SteamGamesManagement"
});

const page = ref(1);
const size = ref(20);
const keyword = ref("");
const searchText = ref("");
const total = ref(0);

function onKeywordChange() {
  keyword.value = searchText.value;
  refetch();
}

function handleReset() {
  keyword.value = "";
  searchText.value = "";
  refetch();
}

const {
  data: games,
  isLoading,
  isFetching,
  refetch,
} = useQuery({
  queryKey: ["steam-games", page, size, keyword],
  queryFn: async () => {
    try {
      const response = await fetch("/steamview/games");
      if (!response.ok) {
        throw new Error("获取游戏数据失败");
      }
      const data = await response.json();
      
      // 过滤游戏
      let filteredGames = data.games || [];
      if (keyword.value) {
        filteredGames = filteredGames.filter((game: any) => 
          game.name.toLowerCase().includes(keyword.value.toLowerCase())
        );
      }
      
      total.value = filteredGames.length;
      
      // 分页
      const start = (page.value - 1) * size.value;
      const end = start + size.value;
      
      return filteredGames.slice(start, end);
    } catch (error) {
      console.error("获取游戏列表失败:", error);
      Toast.error("获取游戏列表失败");
      return [];
    }
  },
});

const handleHideGame = async (game: any) => {
  Dialog.warning({
    title: "确认隐藏游戏",
    description: `确定要隐藏游戏 "${game.name}" 吗？隐藏后该游戏将不会在前端页面显示。`,
    async onConfirm() {
      try {
        // 获取当前隐藏的游戏列表
        const settingResponse = await fetch("/apis/api.console.halo.run/v1alpha1/plugins/-/settings/pluginsteamview-settings");
        if (!settingResponse.ok) {
          throw new Error("获取设置失败");
        }
        
        const settingData = await settingResponse.json();
        const hiddenGames = settingData.spec.hiddenGames || [];
        
        // 添加到隐藏列表
        if (!hiddenGames.includes(game.appId)) {
          hiddenGames.push(game.appId);
        }
        
        // 更新设置
        const updateResponse = await fetch("/apis/api.console.halo.run/v1alpha1/plugins/-/settings/pluginsteamview-settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            spec: {
              ...settingData.spec,
              hiddenGames: hiddenGames
            }
          })
        });
        
        if (!updateResponse.ok) {
          throw new Error("更新设置失败");
        }
        
        Toast.success("游戏已隐藏");
        refetch();
      } catch (e) {
        console.error("隐藏游戏失败", e);
        Toast.error("隐藏游戏失败");
      }
    },
  });
};

const handleRefresh = async () => {
  try {
    const response = await fetch("/steamview/refresh", {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error("刷新失败");
    }
    Toast.success("数据已刷新");
    refetch();
  } catch (e) {
    console.error("刷新失败", e);
    Toast.error("刷新失败");
  }
};

const visitFrontend = () => {
  const currentOrigin = window.location.origin;
  const frontendUrl = `${currentOrigin}/steamview`;
  window.open(frontendUrl, "_blank");
};
</script>

<template>
  <VPageHeader title="Steam 游戏管理">
    <template #actions>
      <VSpace>
        <VButton
          type="primary"
          @click="visitFrontend"
        >
          访问前台
        </VButton>
        <VButton
          type="secondary"
          @click="handleRefresh"
        >
          <template #icon>
            <IconRefreshLine class="h-full w-full" />
          </template>
          刷新数据
        </VButton>
      </VSpace>
    </template>
  </VPageHeader>

  <div class="m-0 md:m-4">
    <VCard :body-class="['!p-0']">
      <template #header>
        <div class="block w-full bg-gray-50 px-4 py-3">
          <div class="relative flex flex-col flex-wrap items-start gap-4 sm:flex-row sm:items-center">
            <div class="flex w-full flex-1 items-center sm:w-auto">
              <input
                v-model="searchText"
                placeholder="输入游戏名称搜索"
                type="text"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                @keyup.enter="onKeywordChange"
              />
            </div>
            <VSpace spacing="lg" class="flex-wrap">
              <button
                v-if="keyword"
                class="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                @click="handleReset"
              >
                <span>清除筛选</span>
              </button>
              <div class="flex flex-row gap-2">
                <div
                  class="group cursor-pointer rounded p-1 hover:bg-gray-200"
                  @click="refetch()"
                >
                  <IconRefreshLine
                    v-tooltip="'刷新'"
                    :class="{ 'animate-spin text-gray-900': isFetching }"
                    class="h-4 w-4 text-gray-600 group-hover:text-gray-900"
                  />
                </div>
              </div>
            </VSpace>
          </div>
        </div>
      </template>
      
      <VLoading v-if="isLoading" />

      <Transition v-else-if="!games?.length" appear name="fade">
        <VEmpty
          message="暂无游戏数据"
          title="暂无游戏数据"
        >
          <template #actions>
            <VSpace>
              <VButton @click="refetch()"> 刷新 </VButton>
            </VSpace>
          </template>
        </VEmpty>
      </Transition>

      <Transition v-else appear name="fade">
        <div class="w-full relative overflow-x-auto">
          <table class="w-full text-sm text-left text-gray-500 widefat">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" class="px-4 py-3"><div class="w-max flex items-center">封面 </div></th>
                <th scope="col" class="px-4 py-3"><div class="w-max flex items-center">游戏名称 </div></th>
                <th scope="col" class="px-4 py-3"><div class="w-max flex items-center">总时长 </div></th>
                <th scope="col" class="px-4 py-3"><div class="w-max flex items-center">两周时长 </div></th>
                <th scope="col" class="px-4 py-3"><div class="w-max flex items-center">最后游玩 </div></th>
                <th scope="col" class="px-4 py-3"><div class="w-max flex items-center">操作 </div></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="game in games" :key="game.appId" class="border-b last:border-none hover:bg-gray-100">
                <td class="px-4 py-4">
                  <img :src="game.coverUrl" :alt="game.name" class="game-cover">
                </td>
                <td class="px-4 py-4 font-medium text-gray-900">{{game.name}}</td>
                <td class="px-4 py-4">{{formatTime(game.totalTime)}}</td>
                <td class="px-4 py-4">{{formatTime(game.twoWeekTime)}}</td>
                <td class="px-4 py-4">{{game.lastPlayed}}</td>
                <td class="px-4 py-4">
                  <VButton
                    type="secondary"
                    size="small"
                    @click="handleHideGame(game)"
                  >
                    隐藏
                  </VButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Transition>

      <template #footer>
        <div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div class="text-sm text-gray-600">
            共 {{total}} 个游戏
          </div>
        </div>
      </template>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
.widefat * {
  word-wrap: break-word;
}

.game-cover {
  width: 80px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}
</style>