import Vue from 'vue'

const state = {}
const mutations = {
  setValueOfFormPath(state, {name, path, value, parentValue, key}) {
    if (path === '/') {
      Vue.set(state, name, value)
    } else {
      Vue.set(parentValue, key, value)
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations
}