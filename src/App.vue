<!--
 * @Author: your name
 * @Date: 2021-07-07 17:05:14
 * @LastEditTime: 2022-01-14 18:49:54
 * @LastEditors: 羊驼
 * @Description: In User Settings Edit
 * @FilePath: \vue-admin-teaching-management-platform\src\views\pharmaceutical-marketing\components\joint.vue
-->
<template>
  <div id='app'>
    <div class="blue-print">
      <top-bar
        :mini.sync="mini"
        :tools="tools"
        :currentForm="currentForm"
      ></top-bar>
      <div class="frame">
        <div id="myholder"></div>
        <div
          id="myholder-mini"
          v-show="mini"
        ></div>
      </div>
      <context
        :tools='tools'
        :create='create'
        :menu='menu'
      ></context>
    </div>
    <editor
      :drawer.sync="drawer"
      :currentForm="currentForm"
      :tools='tools'
    ></editor>
    <bottom-bar :tools='tools'></bottom-bar>
  </div>
</template>

<script>
import tools from "./assets/jointJsTool.js";
import BottomBar from "./components/BottomBar.vue";
import TopBar from "./components/TopBar.vue";
import Editor from "./components/Editor.vue";
import Context from "./components/Context.vue";
let ipcRenderer;
try {
  ipcRenderer = window.require("electron").ipcRenderer;
} catch (e) {}
export default {
  components: {
    BottomBar,
    TopBar,
    Editor,
    Context,
  },
  data() {
    return {
      drawer: false,
      mini: true,
      tools: null,
      menu: {
        display: false,
        left: 0,
        right: 0,
      },
      currentNodeType: "",
      cache: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        form: {},
      },
      mode: "create",
      currentForm: null,
    };
  },
  watch: {
    currentForm: {
      handler(nv, ov) {
        if (nv && nv.mtype >= 0) {
          let node = this.tools.graph.getCell(nv.id);
          this.tools.renderNode(node, nv);
        }
      },
      deep: true,
    },
  },
  mounted() {
    this.tools = new tools.JointClass(this);
    document.querySelector(".menu").oncontextmenu = (e) => {
      e.preventDefault();
    };
    try {
      if (ipcRenderer) {
        ipcRenderer?.removeAllListeners();
        ipcRenderer.on("Message", (e, { type, message }) => {
          this.$message({
            type,
            message,
            duration: 1500,
          });
        });
        ipcRenderer.on("openLastEdit", (e, { file, fileData }) => {
          this.$store.commit("setFile", file);
          this.tools.loadFromData(fileData);
        });
      }
    } catch (e) {
      console.log(e);
    }
  },
  methods: {
    // 设置右键菜单的位置
    setMenu(display, left = null, top = null) {
      this.menu.display = display;
      if (top && left) {
        this.menu.left = left;
        this.menu.top = top;
      }
    },
    // 右键创建节点
    create(type) {
      this.currentNodeType = type;
      this.mode = "create";
      this.cache.form = this.tools.getStruct(type);
      this.tools.createNode(type, this.cache.x, this.cache.y, this.cache.form);
    },
  },
};
</script>