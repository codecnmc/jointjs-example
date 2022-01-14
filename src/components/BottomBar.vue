<!--
 * @Author: 羊驼
 * @Date: 2022-01-13 09:47:07
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-01-14 17:05:50
 * @Description: file content
-->
<template>
  <div class="tabs-group">
    <div
      class="item"
      v-for="(item,index) in tabs"
      :key="index"
      @click="changeFlow(index)"
      :class="{active:currentIndex==index}"
      @keydown.enter="checkBlur(item)"
    >
      <span
        @dblclick="showInput(item)"
        v-show="(!item.edit||item.fixed)"
      >{{item.name}}</span>
      <el-input
        v-model="item.name"
        ref="input"
        v-if="item.edit&&!item.fixed"
        @blur="checkBlur(item)"
      ></el-input>
      <em
        class="el-icon-close"
        @click="closeTab(index)"
        v-if="!item.fixed"
      ></em>
    </div>

    <div
      class="item el-icon-plus"
      @click="createTab"
    >
    </div>
    <p class="filename">当前文件：{{file?file.name:"未命名"}}</p>
  </div>
</template>

<script>
export default {
  props: ["tools"],
  computed: {
    currentIndex: {
      get() {
        return this.$store.state.currentTab;
      },
      set(value) {
        this.$store.commit("setTabIndex", value);
      },
    },
    tabs: {
      get() {
        return this.$store.state.tabs;
      },
      set(value) {
        return this.$store.commit("setTabs", value);
      },
    },
    file() {
      return this.$store.state.file;
    },
  },
  methods: {
    closeTab(index) {
      this.$confirm("此操作将永久删除该流程, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.tabs.splice(index, 1);
          this.currentIndex = this.tabs.length - 1;
          this.writeData(this.tabs[currentIndex].data);
        })
        .catch(() => {});
    },
    createTab() {
      this.tabs.push({
        fixed: false,
        edit: false,
        name: "新建流程",
        data: [],
      });
    },
    changeFlow(index) {
      this.tabs[this.currentIndex].data = this.tools.getSaveData();
      this.currentIndex = index;
      this.writeData(this.tabs[index].data);
    },
    writeData(data) {
      if (data.length == 0) {
        this.tools.clearTable();
        this.tools.initFlowBlock();
      } else {
        this.tools.writeData(data);
      }
    },
    showInput(item) {
      item.edit = true;
      this.$nextTick(() => {
        this.$refs.input[0].focus();
      });
    },
    checkBlur(item) {
      if (item.name != "") {
        item.edit = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
</style>