<!--
 * @Author: 羊驼
 * @Date: 2022-01-13 11:43:29
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-01-13 11:43:30
 * @Description: file content
-->
<template>
  <div
    class="menu"
    v-show='menu.display'
    :style="`left:${menu.left};top:${menu.top}`"
  >
    <div
      class="menu-item"
      ban='1'
    >新建<span class="el-icon-arrow-right"></span>
      <div class="item-child">
        <!-- <div
              class="menu-item-item"
              @click='create(0)'
            >
              普通节点
            </div> -->
        <div
          class="menu-item-item"
          @click="create(1)"
        >
          流程节点
        </div>
        <div
          class="menu-item-item"
          @click="create(2)"
        >
          触发事件
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["tools", "menu", "create"],
};
</script>
