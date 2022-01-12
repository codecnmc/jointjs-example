<!--
 * @Author: your name
 * @Date: 2021-07-07 17:05:14
 * @LastEditTime: 2022-01-12 17:33:54
 * @LastEditors: 羊驼
 * @Description: In User Settings Edit
 * @FilePath: \vue-admin-teaching-management-platform\src\views\pharmaceutical-marketing\components\joint.vue
-->
<template>
  <div id='app'>
    <div class="blue-print">
      <div class="menu-demo">
        <span @click="newFlow">新建</span>
        <span>打开</span>
        <span>保存</span>
        <span @click="saveData">导出unity数据</span>
        <span>配置环境变量</span>
        <span @click="mini=!mini">{{mini?'关闭':'开启'}}小地图</span>
      </div>
      <div class="frame">
        <div id="myholder"></div>
        <div
          id="myholder-mini"
          v-show="mini"
        ></div>
      </div>
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
            <div
              class="menu-item-item"
              @click='create(0)'
            >
              普通节点
            </div>
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
    </div>
    <div
      class="drawer"
      v-if="drawer&&currentForm"
    >
      <p class="title">节点编辑
        <el-button
          circle
          class="el-icon-close"
          type='text'
          @click="drawer=false"
        ></el-button>
      </p>
      <el-form
        label-position='top'
        @submit.native.prevent
      >
        <template v-if="currentForm.mtype==0">
          <el-form-item label="节点名称">
            <el-input
              v-model="currentForm.blockName"
              maxlength="20"
              maxLength="20"
              show-word-limit
            ></el-input>
          </el-form-item>
          <el-form-item label="流程列表">
            <el-tree
              style="height:70vh"
              :data="currentForm.process"
              node-key="id"
              default-expand-all
              draggable
              :props="{label:'process'}"
              :allow-drop=" allowDrop"
            >
            </el-tree>
          </el-form-item>
        </template>
        <template v-else-if="currentForm.mtype==1">
          <el-form-item label="流程名称">
            <el-input
              v-model="currentForm.process"
              maxlength="20"
              maxLength="20"
              show-word-limit
            ></el-input>
          </el-form-item>
          <el-form-item label="流程提示">
            <el-input
              v-model="currentForm.processTips"
              type='textarea'
              :rows='3'
              resize='none'
              maxlength="40"
              maxLength="40"
              show-word-limit
            ></el-input>
          </el-form-item>
          <el-form-item label="触发器列表">
            <el-tree
              style="height:53vh"
              :data="currentForm.triggersInfo"
              node-key="id"
              default-expand-all
              draggable
              :props="{label:'funcType'}"
              :allow-drop=" allowDrop"
            >
              <span
                class="custom-tree-node"
                slot-scope="{ node, data }"
              >
                <span>{{ node.label | enumToString}}</span>
              </span>
            </el-tree>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="触发器激活功能">
            <el-select
              v-model="currentForm.funcType"
              placeholder="请选择"
            >
              <el-option
                v-for="(value,key) in FuncType"
                :key="value"
                :label="key"
                :value="value"
              >
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="触发器激活机制">
            <el-select
              v-model="currentForm.triggerType"
              placeholder="请选择"
            >
              <el-option
                v-for="(value,key) in FuncTriggerType"
                :key="value"
                :label="key"
                :value="value"
              >
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="调用传参">
            <el-input v-model="currentForm.funcArg"></el-input>
          </el-form-item>
          <el-form-item label="UI提示">
            <el-input v-model="currentForm.userTips"></el-input>
          </el-form-item>
        </template>
      </el-form>
    </div>
    <div class="tabs-group">
      <div
        class="item"
        v-for="(item,index) in tabs"
        :key="index"
        @click="changeFlow(index)"
        :class="{active:currentTab==index}"
      >
        <span
          @dblclick="showInput(item)"
          v-show='!item.edit||item.fixed'
        >{{item.name}}</span>
        <el-input
          v-model="item.name"
          ref="input"
          v-if="item.edit&&!item.fixed"
          @blur="item.edit=false"
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
    </div>
  </div>
</template>

<script>
import { FuncType, FuncTriggerType } from "./assets/struct.js";
import tools from "./assets/jointJsTool.js";
export default {
  data() {
    return {
      drawer: false,
      mini: true,
      tools: null,
      currentType: "",
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
      num: 1,
      cacheID: "",
      currentForm: null,
      FuncType,
      FuncTriggerType,
      tabs: [
        {
          fixed: true,
          edit: false,
          name: "主流程",
          data: [],
        },
      ],
      currentTab: 0,
    };
  },
  watch: {
    currentForm: {
      handler(nv, ov) {
        if (nv && nv.mtype >= 0) {
          let node = this.tools.findNode(nv.id);
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
  },
  filters: {
    enumToString(value) {
      for (let kv in FuncType) {
        if (FuncType[kv] == value) {
          return kv;
        }
      }
      return value;
    },
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
    allowDrop(draggingNode, dropNode, type) {
      if (type != "inner") return true;
    },
    // 右键创建节点
    create(type) {
      this.currentNodeType = type;
      this.mode = "create";
      this.cache.form = this.tools.getStruct(type);
      this.tools.createNode(type, this.cache.x, this.cache.y, this.cache.form);
    },
    closeTab(index) {
      this.$confirm("此操作将永久删除该流程, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.tabs.splice(index, 1);
          this.currentTab = this.tabs.length - 1;
          this.tools.writeData(this.tabs[this.tabs.length - 1].data);
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
      this.tabs[this.currentTab].data = this.tools.getSaveData();
      console.log(this.tools.getSaveData());
      this.currentTab = index;
      if (this.tabs[index].data.length == 0) {
        this.tools.clearTable();
        this.tools.initFlowBlock();
      } else {
        this.tools.writeData(this.tabs[index].data);
      }
    },
    showInput(item) {
      item.edit = true;
      this.$nextTick(() => {
        this.$refs.input[0].focus();
      });
    },
    newFlow() {
      this.tabs = [
        {
          fixed: true,
          edit: false,
          name: "主流程",
          data: [],
        },
      ];
      this.currentTab = 0;
      this.currentForm = null;
      this.tools.clearTable();
      this.tools.initFlowBlock();
    },
    saveData(){
      this.tools.saveData()
    }
  },
};
</script>

<style lang="less" scoped>
</style>
