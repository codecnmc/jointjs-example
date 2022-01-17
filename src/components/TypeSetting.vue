<!--
 * @Author: 羊驼
 * @Date: 2022-01-14 11:40:02
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-01-17 13:48:11
 * @Description: file content
-->
<template>
  <el-dialog
    :visible.sync="dialogVisible"
    width="50%"
    title="类型配置"
    top="10vh"
    :before-close="checkEditState"
  >
    <div style="margin-bottom:10px">
      <el-button
        type="primary"
        @click="pushType"
      >添加类型(alt+q)</el-button>
      <el-button
        @click="importType"
        type="success"
      >导入类型</el-button>
      <el-button
        @click="exportType"
        type="warning"
      >导出类型</el-button>
      <el-button
        @click="clearType"
        type="danger"
      >清空类型</el-button>
    </div>
    <el-table
      :data="FuncType"
      height="60vh"
    >
      <el-table-column
        label="枚举名称"
        prop="name"
      >
        <template #default='{row}'>
          <span v-if="!row.edit">{{row.name}}</span>
          <el-input
            v-else
            v-model="row.name"
            ref="input"
            size="mini"
          ></el-input>
        </template>
      </el-table-column>
      <el-table-column
        label="枚举值"
        prop="value"
      >
        <template #default='{row}'>
          <span v-if="!row.edit">{{row.value}}</span>
          <el-input
            v-else
            v-model="row.value"
            size="mini"
          ></el-input>
        </template>
      </el-table-column>
      <el-table-column
        label="函数参数数量"
        prop="args"
      >
        <template #default='{row}'>
          <span v-if="!row.edit">{{row.args}}</span>
          <el-input
            v-else
            v-model="row.args"
            size="mini"
          ></el-input>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default='{row,$index}'>
          <el-button
            size="mini"
            @click="row.edit=true"
            v-if="!row.edit"
            type="primary"
          >编辑</el-button>
          <el-button
            size="mini"
            type="success"
            v-else
            @click="compeleteEdit(row)"
          >完成</el-button>
          <el-button
            size="mini"
            type="danger"
            @click="deleteType($index)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script>
import { Message } from "element-ui";
export default {
  props: ["visible"],
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit("update:visible", value);
      },
    },
    FuncType: {
      get() {
        return this.$store.state.FuncType;
      },
      set(value) {
        this.$store.commit("setFuncType", value);
      },
    },
  },
  data() {
    return {
      timer: null,
    };
  },
  watch: {
    visible(nv, ov) {
      if (nv) {
        document.onkeydown = (e) => {
          if (e.altKey && e.key == "q") {
            this.pushType();
          }
        };
      } else {
        document.onkeydown = null;
      }
    },
  },
  methods: {
    async importType() {
      this.FuncType = [];
      await new Promise((resolve, reject) => {
        let input = document.createElement("input");
        input.value = "选择文件";
        input.type = "file";
        input.onchange = (event) => {
          let file = event.target.files[0];
          let file_reader = new FileReader();
          file_reader.onload = () => {
            let fc = file_reader.result;
            try {
              this.FuncType = JSON.parse(fc);
            } catch (e) {
              Message.error("导入格式有误");
              this.FuncType = [];
            }
          };
          file_reader.readAsText(file, "UTF-8");
        };
        input.click();
      });
    },
    exportType() {
      var elementA = document.createElement("a");
      //文件的名称为时间戳加文件名后缀
      elementA.download = "流程类型" + ".json";
      elementA.style.display = "none";
      //生成一个blob二进制数据，内容为json数据
      var blob = new Blob([JSON.stringify(this.FuncType)]);
      //生成一个指向blob的URL地址，并赋值给a标签的href属性
      elementA.href = URL.createObjectURL(blob);
      document.body.appendChild(elementA);
      elementA.click();
      document.body.removeChild(elementA);
    },
    clearType() {
      this.FuncType = [];
    },
    pushType() {
      clearTimeout(this.timer);
      this.FuncType.push({
        name: "",
        value: this.FuncType.length,
        args: 0,
        edit: true,
      });
      this.timer = setTimeout(() => {
        if (Array.isArray(this.$refs.input)) {
          this.$refs.input[this.$refs.input.length - 1].focus();
        } else {
          this.$refs?.input.focus();
        }
      }, 100);
    },
    deleteType(index) {
      this.FuncType.splice(index, 1);
    },
    compeleteEdit(row) {
      let set = new Set();
      let set2 = new Set();
      if (row.name == "") {
        return Message.error("枚举名称不能为空");
      }
      if (isNaN(parseInt(row.value))) {
        return Message.error("无效枚举值");
      }
      if (isNaN(parseInt(row.args))) {
        return Message.error("无效参数数量");
      }
      for (let i = 0; i < this.FuncType.length; i++) {
        let item = this.FuncType[i];
        if (set2.has(item.name)) {
          item.value = "";
          return Message.error("存在重复的枚举名称");
        }
        if (set.has(item.value)) {
          item.value = "";
          return Message.error("存在重复的枚举值");
        }
        set.add(item.value);
        set2.add(item.name);
      }
      row.edit = false;
      this.$store.commit("sortFuncType");
    },
    checkEditState(done) {
      for (let i = 0; i < this.FuncType.length; i++) {
        let item = this.FuncType[i];
        if (item.edit) {
          return Message.error("当前存在未编辑完成的对象");
        }
      }
      done();
    },
  },
};
</script>

<style lang="less" scoped>
</style>