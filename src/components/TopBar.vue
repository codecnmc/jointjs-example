<!--
 * @Author: 羊驼
 * @Date: 2022-01-13 10:04:22
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-01-14 17:57:44
 * @Description: file content
-->
<template>
  <div class="menu-demo">
    <span @click="newFlow">新建</span>
    <span @click="loadData">打开</span>
    <span @click="saveData">保存</span>
    <span @click="exportUnity">导出unity数据</span>
    <span @click="typeDialog=true">触发类型配置</span>
    <span @click="eventDialog=true">突发事件配置</span>
    <span @click="miniMap=!miniMap">{{miniMap?'关闭':'开启'}}小地图</span>
    <span @click="closeApplication">关闭软件</span>
    <type-setting :visible.sync='typeDialog'></type-setting>
    <event
      :visible.sync="eventDialog"
      :tools="tools"
    ></event>
  </div>
</template>

<script>
let ipcRenderer;
try {
  ipcRenderer = window.require("electron").ipcRenderer;
} catch (e) {}

import TypeSetting from "./TypeSetting.vue";
import Event from "./Event.vue";
export default {
  props: ["tools", "mini", "currentForm"],
  components: {
    TypeSetting,
    Event,
  },
  data() {
    return {
      typeDialog: false,
      eventDialog: false,
      items: [],
    };
  },
  computed: {
    miniMap: {
      get() {
        return this.mini;
      },
      set(value) {
        this.$emit("update:mini", value);
      },
    },
    tabsItem: {
      get() {
        return this.$store.state.tabs;
      },
      set(value) {
        this.$store.commit("setTabs", value);
      },
    },
  },
  methods: {
    exportUnity() {
      this.tools.exportUnityData();
    },
    saveData() {
      this.tools.saveData();
    },
    loadData() {
      this.tools.loadData();
    },
    newFlow() {
      this.tabsItem = [
        {
          fixed: true,
          edit: false,
          name: "主流程",
          data: [],
        },
      ];
      if (ipcRenderer) {
        ipcRenderer.send("saveLastEdit", "");
      }

      this.currentForm = null;
      this.$store.commit("setTabIndex", 0);
      this.$store.commit("setFuncType", []);
      this.$store.commit("setEvent", []);
      this.$store.commit("setFile", null);
      this.tools.clearTable();
      this.tools.initFlowBlock();
    },
    closeApplication() {
      window.close();
    },
  },
};
</script>