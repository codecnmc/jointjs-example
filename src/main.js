/*
 * @Author: 羊驼
 * @Date: 2022-01-10 16:44:07
 * @LastEditors: 羊驼
 * @LastEditTime: 2022-01-12 17:34:05
 * @Description: file content
 */
import Vue from 'vue'
import App from './App.vue'
import store from './store'
import ElementUI from 'element-ui'
import $ from 'jquery'
import 'element-ui/lib/theme-chalk/index.css';
import './assets/joint.less'
Vue.config.productionTip = false
Vue.use(ElementUI)
window.joint = require('jointjs');
window.$ = $
new Vue({
  store,
  render: h => h(App)
}).$mount('#app')
