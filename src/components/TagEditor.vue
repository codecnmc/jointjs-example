<!--
 * @Author: 羊驼
 * @Date: 2022-01-17 10:59:30
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-01-17 15:51:12
 * @Description: file content
-->
<template>
  <el-dialog
    :visible.sync='dialogVisible'
    title="物体标签"
    width="350px"
    :before-close="checkEditState"
    top="10vh"
  >
    <div style="margin-bottom:10px">
      <el-button
        type="primary"
        @click="pushTag"
      >添加标签(alt+q)</el-button>
      <el-button
        type="danger"
        @click="clearTag"
      >清空标签</el-button>
    </div>
    <el-table
      :data="tags"
      height="55vh"
    >
      <el-table-column
        props='value'
        label="标签名称"
      >
        <template #default='{row}'>
          <span v-if="!row.edit">{{row.value}}</span>
          <el-input
            v-else
            v-model="row.value"
            ref="input"
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
            @click="deleteTag($index)"
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
    tags: {
      get() {
        return this.$store.state.tagList;
      },
      set(value) {
        this.$store.commit("setTagList", value);
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
            this.pushTag();
          }
        };
      } else {
        document.onkeydown = null;
      }
    },
  },
  methods: {
    pushTag() {
      this.tags.push({
        value: "",
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
    clearTag() {
      this.tags = [];
    },
    deleteTag(index) {
      this.tags.splice(index, 1);
    },
    compeleteEdit(row) {
      if (row.value == "") {
        return Message.error("标签名称不能为空");
      }
      let set = new Set();
      for (let i = 0; i < this.tags.length; i++) {
        let item = this.tags[i];
        if (set.has(row.value)) {
          return Message.error("标签名重复");
        }
        set.add(item.value);
      }

      row.edit = false;
    },
    checkEditState(done) {
      for (let i = 0; i < this.tags.length; i++) {
        let item = this.tags[i];
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