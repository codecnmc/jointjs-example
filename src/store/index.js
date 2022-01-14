/*
 * @Author: 羊驼
 * @Date: 2022-01-12 17:33:35
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-01-14 16:31:30
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
    file: null
  },
  mutations: {
    setFuncType(state, data) {
      state.FuncType = data
    },
    sortFuncType(state) {
      state.FuncType.sort((a, b) => a.value - b.value)
    },
    setTabs(state, data) {
      state.tabs = data
    },
    setTabIndex(state, index) {
      state.currentTab = index
    },
    setEvent(state, data) {
      state.events = data
    },
    setFile(state, data) {
      state.file = data
    }
  },
  actions: {
  },
  modules: {
  }
})
