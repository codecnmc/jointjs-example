<!--
 * @Author: 羊驼
 * @Date: 2022-01-14 13:44:56
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-01-14 16:25:52
 * @Description: file content
-->
<template>
  <el-dialog
    top="10vh"
    :visible.sync="show"
    title="事件绑定"
    :before-close="checkEvent"
    width="80%"
  >
    <el-button
      type="primary"
      @click="pushType"
    >添加事件</el-button>
    <el-table
      :data="currentData"
      height="600px"
    >
      <el-table-column label="触发流程">
        <template #default='{row}'>
          <el-select v-model="row.processID">
            <el-option
              v-for="(item,index) in processList"
              :key="index"
              :label="item.process"
              :value='item.id'
            ></el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="触发节点">
        <template #default='{row}'>
          <el-select
            v-model="row.blockID"
            @focus="findIndex(row.processID)"
          >
            <el-option
              v-for="(item,index) in triggerList"
              :key="index"
              :label="item.block"
              :value='item.id'
            ></el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column
        label="触发条件"
        align="center"
      >
        <template #default='{row}'>
          <el-button @click="openForm(row)">编辑条件</el-button>
        </template>
      </el-table-column>
      <el-table-column label="目标流程">
        <template #default='{row}'>
          <el-select v-model="row.targetProcessID">
            <el-option
              v-for="(item,index) in processList"
              :key="index"
              :label="item.process"
              :value='item.id'
            ></el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="目标节点">
        <template #default='{row}'>
          <el-select
            v-model="row.targetBlockID"
            @focus="findIndex2(row.targetProcessID)"
          >
            <el-option
              v-for="(item,index) in triggerList2"
              :key="index"
              :label="item.block"
              :value='item.id'
            ></el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default='{$index}'>
          <el-button
            type="danger"
            size="mini"
            @click="deleteEvent($index)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      layout="prev, pager, next"
      :total="total"
      :current-page.sync="currentPage"
      style="text-align:center"
    >
    </el-pagination>
    <el-dialog
      :visible.sync='condition'
      title="条件编辑"
      :before-close="checkCondition"
      append-to-body
    >
      <el-button
        type="primary"
        @click="addCondition"
        style="margin-bottom:10px"
      >新增条件</el-button>
      <div
        v-for="(item,index) in currentForm.conditions"
        :key="index"
        class="condition-item"
      >
        <span>条件{{index+1}}:</span>
        <el-input v-model="currentForm.conditions[index]"></el-input>
        <el-button
          @click="removeCondition(index)"
          size="mini"
          type="danger"
        >移除</el-button>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script>
import { Message } from "element-ui";
import { BlockType } from "../assets/struct.js";
export default {
  props: ["visible", "tools"],
  data() {
    return {
      currentPage: 1,
      triggerList: [],
      triggerList2: [],
      condition: false,
      currentForm: {},
    };
  },
  computed: {
    events: {
      get() {
        return this.$store.state.events;
      },
      set(value) {
        this.$store.commit("setEvent", value);
      },
    },
    currentData() {
      return this.events.slice(
        (this.currentPage - 1) * 10,
        10 * this.currentPage
      );
    },
    tabs: {
      get() {
        return this.$store.state.tabs;
      },
      set(value) {
        this.$store.commit("setTabs", value);
      },
    },
    show: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
    total() {
      return this.events.length;
    },
    FuncType() {
      let map = new Map();
      this.$store.state.FuncType.forEach((item) => {
        map.set(item.value, item.name);
      });
      return map;
    },
    processList() {
      let data = [];
      this.tabs[this.$store.state.currentTab].data = this.tools?.getSaveData();
      this.tabs.forEach((item, index) => {
        item.data?.cells.forEach((cell) => {
          let form = cell.data;
          if (form && form.mtype == BlockType.流程节点) {
            let process = {
              id: form.id,
              process: item.name + "-" + form.process,
              index,
            };
            data.push(process);
          }
        });
      });
      return data;
    },
  },
  methods: {
    pushType() {
      this.events.push({
        blockID: "",
        processID: "",
        conditions: [],
        targetBlockID: "",
        targetProcessID: "",
      });
    },
    findIndex(value) {
      this.findTriggerList(value, "triggerList");
    },
    findIndex2(value) {
      this.findTriggerList(value, "triggerList2");
    },
    findTriggerList(value, name) {
      let index = -1;
      this.processList.some((item) => {
        if (item.id == value) {
          index = item.index;
          return item;
        }
      });
      this[name] = [];
      if (index < 0) return;
      this.tabs[index].data.cells.forEach((cell) => {
        let form = cell.data;
        if (
          form &&
          (form.mtype == BlockType.触发器节点) & (form.fatherNode == value)
        ) {
          let trigger = {
            id: form.id,
            block: this.FuncType.get(form.funcType),
          };
          this[name].push(trigger);
        }
      });
    },
    deleteEvent(index) {
      let realIndex = index + (this.currentPage - 1) * 10;
      this.events.splice(realIndex, 1);
    },
    checkEvent(done) {
      for (let i = 0; i < this.events.length; i++) {
        let item = this.events[i];
        if (item.blockID == "") {
          return Message.error("触发节点不能为空 请检查");
        }
        if (item.processID == "") {
          return Message.error("触发流程不能为空 请检查");
        }
        if (item.targetProcessID == "") {
          return Message.error("目标流程不能为空 请检查");
        }
        if (item.targetBlockID == "") {
          return Message.error("目标节点不能为空 请检查");
        }
      }
      done();
    },
    addCondition() {
      this.currentForm.conditions.push("");
    },
    removeCondition(index) {
      this.currentForm.conditions.splice(index, 1);
    },
    openForm(row) {
      this.currentForm = row;
      this.condition = true;
    },
    checkCondition(done) {
      let conditions = this.currentForm.conditions;
      for (let i = 0; i < conditions.length; i++) {
        if (!conditions[i]) {
          return Message.error("条件不能为空");
        }
      }
      done();
    },
  },
};
</script>

<style lang="less" scoped>
</style>