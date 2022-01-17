<!--
 * @Author: 羊驼
 * @Date: 2022-01-13 10:04:22
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-01-17 11:59:13
 * @Description: file content
-->
<template>
  <div class="menu-demo">
    <span @click="newFlow">新建</span>
    <span @click="loadData">打开</span>
    <span @click="saveData">保存流程数据</span>
    <span @click="exportUnity">导出unity数据</span>
    <span @click="typeDialog=true">触发类型配置</span>
    <span @click="eventDialog=true">突发事件配置</span>
    <span @click="tagDialog=true">物体标签配置</span>
    <span @click="miniMap=!miniMap">{{miniMap?'关闭':'开启'}}小地图</span>
    <div class="w-control">
      <div class='drag'></div>
      <span
        @click="minimize"
        class="el-icon-minus"
      ></span>
      <span
        @click="fullScreen"
        class="el-icon-full-screen"
      ></span>
      <span
        @click="closeApplication"
        class="el-icon-switch-button"
      ></span>
    </div>
    <type-setting :visible.sync='typeDialog'></type-setting>
    <event
      :visible.sync="eventDialog"
      :tools="tools"
    ></event>
    <tag-editor :visible.sync="tagDialog"></tag-editor>
  </div>
</template>

<script>
let ipcRenderer;
try {
  ipcRenderer = window.require("electron").ipcRenderer;
} catch (e) {}
import TypeSetting from "./TypeSetting.vue";
import Event from "./Event.vue";
import TagEditor from "./TagEditor.vue";
export default {
  props: ["tools", "mini", "currentForm"],
  components: {
    TypeSetting,
    Event,
    TagEditor,
  },
  data() {
    return {
      typeDialog: false,
      eventDialog: false,
      tagDialog: false,
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
      this.tools.newFlow();
    },
    closeApplication() {
      window.close();
    },
    minimize() {
      if (ipcRenderer) {
        ipcRenderer.send("minimize");
      }
    },
    fullScreen() {
      if (ipcRenderer) {
        ipcRenderer.send("fullScreen");
      }
    },
  },
};
</script>