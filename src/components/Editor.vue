<!--
 * @Author: 羊驼
 * @Date: 2022-01-13 11:36:32
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-05-10 09:26:06
 * @Description: file content
-->
<template>
  <div>
    <div
      class="drawer"
      v-if="visible&&currentForm"
    >
      <p class="title">节点编辑
        <el-button
          circle
          class="el-icon-close"
          type='text'
          @click="visible=false"
        ></el-button>
      </p>
      <el-form
        label-position='top'
        @submit.native.prevent
      >
        <el-form-item label="节点标题">
          <el-input
            v-model="currentForm.title"
            maxlength="20"
            show-word-limit
          ></el-input>
        </el-form-item>
        <template v-if="currentForm.mtype==0">
          <el-form-item label="节点名称">
            <el-input
              v-model="currentForm.blockName"
              maxlength="20"
              show-word-limit
            ></el-input>
          </el-form-item>
          <el-form-item label="流程列表">
            <el-tree
              style="height:53vh"
              :data="currentForm.process"
              node-key="id"
              default-expand-all
              draggable
              :props="{label:'process'}"
              :allow-drop="allowDrop"
              @node-drag-start="dragStart"
              @node-drag-end='dragEnd'
            >
            </el-tree>
          </el-form-item>
        </template>
        <template v-else-if="currentForm.mtype==1">
          <el-form-item label="流程名称">
            <el-input
              v-model="currentForm.process"
              maxlength="20"
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
              show-word-limit
            ></el-input>
          </el-form-item>
          <el-form-item label="触发器列表">
            <el-tree
              style="height:39vh"
              :data="currentForm.triggersInfo"
              node-key="id"
              default-expand-all
              draggable
              :props="{label:'funcType'}"
              :allow-drop="allowDrop"
              @node-drag-start="dragStart"
              @node-drag-end='dragEnd'
            >
              <span
                class="custom-tree-node"
                slot-scope="{ node }"
              >
                <span>{{ getName(node.label)}}</span>
              </span>
            </el-tree>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="场景物体触发器标签">
            <el-autocomplete
              :fetch-suggestions="querySearch"
              placeholder="请输入物体标签"
              v-model="currentForm.tag"
              maxlength="20"

              show-word-limit
              @blur="checkBlur"
            ></el-autocomplete>
          </el-form-item>
          <el-form-item label="触发器激活功能">
            <el-select
              v-model="currentForm.funcType"
              placeholder="请选择触发器功能"
              @change="changeType"
            >
              <el-option
                v-for="(item,index) in FuncType"
                :key="index"
                :label="item.name"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="触发器激活机制">
            <el-select
              v-model="currentForm.triggerType"
              placeholder="请选择激活机制"
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
          <el-form-item
            label="调用传参"
            v-if="currentForm.funcArgs.length>0"
          >
            <div
              class="args"
              v-for="(item,index) in currentForm.funcArgs"
              :key="index"
            >
              <span>参数{{index+1}}</span>
              <el-input v-model="currentForm.funcArgs[index]"></el-input>
            </div>
          </el-form-item>
          <el-form-item label="UI提示">
            <el-input v-model="currentForm.userTips"></el-input>
          </el-form-item>
        </template>
      </el-form>
    </div>
  </div>
</template>

<script>
import { FuncTriggerType } from "../assets/struct.js";
import { mapState } from "vuex";
export default {
  props: ["drawer", "currentForm", "tools"],
  computed: {
    visible: {
      get() {
        return this.drawer;
      },
      set(value) {
        this.$emit("update:drawer", value);
      },
    },
    ...mapState({
      FuncType: (state) => state.FuncType,
    }),
    getName() {
      return function (val) {
        this.FuncType.some((item) => {
          if (item.value == parseInt(val)) {
            val = item.name;
            return item;
          }
        });
        return val;
      };
    },
  },
  data() {
    return {
      FuncTriggerType,
      oldIDs: [],
    };
  },
  methods: {
    allowDrop(draggingNode, dropNode, type) {
      if (
        this.tools.mustNodeExist(draggingNode.data.id) ||
        this.tools.mustNodeExist(dropNode.data.id)
      ) {
        return false;
      }
      if (type != "inner") {
        return true;
      }
    },
    dragStart(draggingNode, dropNode, pos) {
      this.oldIDs = [];
      let father = this.tools.findNode(draggingNode.data.fatherNode);
      let type = father.mtype == 0 ? "process" : "triggersInfo";
      this.oldIDs = father[type].map((x) => x.id);
    },
    dragEnd(draggingNode, dropNode, type) {
      this.tools.changeNodeData(draggingNode.data.fatherNode, this.oldIDs);
      this.oldIDs = [];
    },
    changeType() {
      let data = this.currentForm;
      this.FuncType.some((item) => {
        if (item.value == parseInt(data.funcType)) {
          data.funcArgs = [];
          data.funcArgs.length = item.args;
          return item;
        }
      });
    },
    querySearch(queryString, cb) {
      var suggest = this.$store.state.tagList;
      var results = queryString
        ? suggest.filter(this.createFilter(queryString))
        : suggest;
      cb(results);
    },
    createFilter(queryString) {
      return (tag) => {
        return tag.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0;
      };
    },
    checkBlur(e) {
      let value = e.target.value;
      this.$store.commit("checkRepeat", value);
    },
  },
};
</script>
