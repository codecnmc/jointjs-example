/*
 * @Author: 羊驼
 * @Date: 2022-01-12 17:33:35
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-01-17 11:20:03
 * @Description: file content
 */
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    FuncType: [],
    events: [],
    tabs: [
      {
        fixed: true,
        edit: false,
        name: "主流程",
        data: [],
      },
    ],
    currentTab: 0,
    file: null,
    save: true,
    tagList: []
  },
  mutations: {
    setFuncType(state, data) {
      state.FuncType = data
      state.save = false
    },
    sortFuncType(state) {
      state.FuncType.sort((a, b) => a.value - b.value)
    },
    setTabs(state, data) {
      state.tabs = data
      state.save = false
    },
    setTabIndex(state, index) {
      state.currentTab = index
      state.save = false
    },
    setEvent(state, data) {
      state.events = data
      state.save = false
    },
    setFile(state, data) {
      state.file = data
      state.save = false
    },
    setSave(state, data) {
      state.save = data
    },
    setTagList(state, data) {
      state.tagList = data
    },
    checkRepeat(state, data) {
      let set = new Set(state.tagList)
      if (!set.has(data)) {
        state.tagList.push({ value: data, edit: false })
      }
    }
  },
  actions: {
  },
  modules: {
  }
})
