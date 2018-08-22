import Vue from 'vue'
import Vuex, { mapState } from 'vuex'

import _ from 'gateschema'
import transformer from 'gateschema-transformer'

import { mount } from '@vue/test-utils'

import {createForm, formStore}  from '../src/index'
import { createMockStateForm } from './util'

Vue.use(Vuex)

const createParentComponent = function(schema, store, Form) {
  return Vue.extend({
    store,
    data() {
      return {
        schema,
      }
    },
    computed: {
      ...mapState({
        form: 'form/myForm'
      })
    },
    methods: {
      handleSubmit() {
        this.$emit('submit')
      }
    },
    render(h) {
      return h(Form, {
        props: {
          name: 'myForm',
          schema: this.schema,
          value: this.form
        },
        on: {
          submit: this.handleSubmit
        }
      })
    }
  })
}

describe('user input value', () => {
  let store
  let stateForm
  beforeAll((done) => {

    store = new Vuex.Store({
      modules: {
        form: formStore
      }
    })

    const schema = _.map({
      stringField: _.required.string,
      listField: _.required.list(_.string)
    })

    const StateForm = createMockStateForm(function() {
      if (this.state) {
        stateForm = this
        done()
      }
    })
    const GateSchemaForm = createForm({
      transformer,
      StateForm
    })
    const Component = createParentComponent(schema, store, GateSchemaForm)
    mount(Component)
  })

  it('store update', (done) => {
    const inputValue = Math.random().toString()
    stateForm.emitUserInput('/stringField', inputValue) 
    setTimeout(() => {
      expect(store.state.form.myForm).toBeInstanceOf(Object)
      expect(store.state.form.myForm.stringField).toBe(inputValue)
      done()
    }, 0)
  })
})

