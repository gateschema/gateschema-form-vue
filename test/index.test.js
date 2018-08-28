import Vue from 'vue'
import { mount } from '@vue/test-utils'
import _ from 'gateschema'

import { createForm } from '../src/index'
import { createMockStateForm } from './util'

const createParentComponent = function(schema, value, Form) {
  return Vue.extend({
    data() {
      return {
        schema,
        value,
      }
    },
    methods: {
      handleSubmit() {
        this.$emit('submit')
      }
    },
    render(h) {
      return h(Form, {
        props: {
          schema: this.schema,
          value: this.value
        },
        on: {
          submit: this.handleSubmit
        }
      })
    }
  })
}

test('GateSchemaForm', () => {
  const StateForm = createMockStateForm(() => {})
  const Form = createForm({StateForm})
  expect(Form.data).toBeInstanceOf(Function)
  expect(Form.render).toBeInstanceOf(Function)
  expect(Form.methods.transformNode).toBeInstanceOf(Function)
})

describe('rendering', () => {
  const schema = _.required.map({
    requiredField: _.required,
    optionalField: _.optional,
    stringField: _.string,
    numberField: _.number,
    booleanField: _.boolean,
    listField: _.list(_.string),
    enumField: _.enum({
      opt1: 1,
      opt2: 2
    }),
    enumListField: _.enumList({
      opt1: 1,
      opt2: 2
    }),
    otherField: _.any.other('form', {
      component: 'MyComponent',
      customProps: 'customProps'
    })
  })
  const rootData = {
    numberField: '123456',
    listField: [
      "foo",
      "bar"
    ]
  }

  let state
  beforeAll((done) => {
    const StateForm = createMockStateForm(function() {
      if (this.state) {
        state = this.state
        done()
      }
    })
    const GateSchemaForm = createForm({
      StateForm
    })
    const Component = createParentComponent(schema, rootData, GateSchemaForm)
    mount(Component)
  })


  it('use Form component for root', () => {
    const rootState = state
    expect(rootState).toBeInstanceOf(Object)
    expect(rootState.path).toBe('/')
    expect(rootState.component).toBe('Form')
    expect(rootState.children).toBeInstanceOf(Array)
  })

  it('required', () => {
    const requiredField = state.children[0]
    expect(requiredField.required).toBe(true)
    expect(requiredField.path).toBe('/requiredField')
  })

  it('optional', () => {
    const optionalField = state.children[1]
    expect(optionalField.required).toBe(false)
    expect(optionalField.path).toBe('/optionalField')
  })

  it('use Input component for string type', () => {
    const stringField = state.children[2]
    expect(stringField.path).toBe('/stringField')
    expect(stringField.component).toBe('Input')
    expect(stringField.value).toBe(rootData.stringField)
  })

  it('use InputNumber component for number type', () => {
    const numberField = state.children[3]
    expect(numberField.path).toBe('/numberField')
    expect(numberField.component).toBe('InputNumber')
    expect(numberField.value).toBe(rootData.numberField)
  })

  it('use Switch component for boolean type', () => {
    const booleanField = state.children[4]
    expect(booleanField.path).toBe('/booleanField')
    expect(booleanField.component).toBe('Switch')
    expect(booleanField.value).toBe(rootData.booleanField)
  })

  it('use List component for list type', () => {
    const listField = state.children[5]
    expect(listField.path).toBe('/listField')
    expect(listField.component).toBe('List')
    expect(listField.value).toBe(rootData.listField)
    expect(listField.children).toBeInstanceOf(Array)

    const listField0 = listField.children[0]
    expect(listField0.path).toBe('/listField/0')
    expect(listField0.component).toBe('Input')
    expect(listField0.value).toBe(rootData.listField[0])
  })

  it('use Radio component for enum type', () => {
    const enumField = state.children[6]
    expect(enumField.path).toBe('/enumField')
    expect(enumField.component).toBe('Radio')
    expect(enumField.option).toBeInstanceOf(Object)
    expect(enumField.option.opt1).toBe(1)
    expect(enumField.option.opt2).toBe(2)
    expect(enumField.value).toBe(rootData.enumField)
  })

  it('use Checkbox component for enumList type', () => {
    const enumListField = state.children[7]
    expect(enumListField.path).toBe('/enumListField')
    expect(enumListField.component).toBe('Checkbox')
    expect(enumListField.option).toBeInstanceOf(Object)
    expect(enumListField.option.opt1).toBe(1)
    expect(enumListField.option.opt2).toBe(2)
    expect(enumListField.value).toBe(rootData.enumListField)
  })

  it('other("form", {...})', () => {
    const otherField = state.children[8]
    expect(otherField.path).toBe('/otherField')
    expect(otherField.component).toBe('MyComponent')
    expect(otherField.customProps).toBe('customProps')
    expect(otherField.value).toBe(rootData.otherField)
  })

})


describe('update simple value', () => {
  const schema = _.map({
    stringField: _.required.string,
  })
  const rootData = {
    stringField: 'foo',
  }
  let state
  let stateForm
  beforeAll((done) => { 
    const StateForm = createMockStateForm(function() {
      if (this.state) {
        state = this.state
        stateForm = this
        done()
      }
    })
    const GateSchemaForm = createForm({
      StateForm
    })
    const Component = createParentComponent(schema, rootData, GateSchemaForm)
    mount(Component)
  })

  it('value change after user input', (done) => {
    const path = '/stringField'
    const inputValue = 'bar'
    // origin value
    expect(state.children[0].value).toBe(rootData.stringField)

    // emit input
    stateForm.emitUserInput(path, inputValue)

    // value updated
    setTimeout(() => {
      expect(rootData.stringField).toBe(inputValue)
      expect(state.children[0].value).toBe(inputValue)
      done()
    }, 100)
  })


})

describe('update list value: add item', () => {
  const schema = _.map({
    listField: _.list(_.string)
  })
  const rootData = {
    listField: ['foo']
  }
  let state
  let stateForm
  beforeAll((done) => { 
    const StateForm = createMockStateForm(function() {
      if (this.state) {
        state = this.state
        stateForm = this
        done()
      }
    })
    const GateSchemaForm = createForm({
      StateForm
    })
    const Component = createParentComponent(schema, rootData, GateSchemaForm)
    mount(Component)
  })

  it('value change after user input', (done) => {
    const path = '/listField'
    const inputValue = rootData.listField.concat(null)
    // origin value
    expect(state.children[0].value).toBe(rootData.listField)

    // emit input
    stateForm.emitUserInput(path, inputValue)

    // value updated
    setTimeout(() => {
      expect(rootData.listField.length).toBe(2)
      expect(rootData.listField).toBe(inputValue)
      expect(state.children[0].value).toBe(inputValue)
      done()
    }, 0)
  })


})

describe('update list value: remove item', () => {
  const schema = _.map({
    listField: _.list(_.required.string.notEmpty)
  })
  const rootData = {
    listField: ['foo', 'bar']
  }
  let state
  let stateForm
  beforeAll((done) => { 
    const StateForm = createMockStateForm(function() {
      if (this.state) {
        state = this.state
        stateForm = this
        done()
      }
    })
    const GateSchemaForm = createForm({
      StateForm
    })
    const Component = createParentComponent(schema, rootData, GateSchemaForm)
    mount(Component)
  })

  it('value change after user input', (done) => {
    // origin value
    expect(state.children[0].value).toBe(rootData.listField)
    expect(state.children[0].children[0].error).toBeFalsy()
    expect(state.children[0].children[1].error).toBeFalsy()

    // input an empty string to first child, it should cause a validation error
    stateForm.emitUserInput('/listField/0', '')
    setTimeout(() => {
      expect(state.children[0].children[0].error).toBeTruthy()

      // remove first child, its index is 0
      const inputValue = ['bar']
      const removeIndex = 0
      stateForm.emitUserInput('/listField', inputValue, removeIndex)
      setTimeout(() => {
        // and second child become the first child
        expect(state.children[0].children[0].error).toBeFalsy()
        expect(rootData.listField.length).toBe(1)
        expect(rootData.listField).toBe(inputValue)
        done()
      })
    }, 0)
  }, 0)
})


describe('submit: all validation error will be shown', () => {
  const schema = _.map({
    stringField: _.required.string.notEmpty,
  })
  const rootData = {
    stringField: '',
  }
  let state
  let stateForm
  let wrapper
  beforeAll((done) => { 
    const StateForm = createMockStateForm(function() {
      if (this.state) {
        state = this.state
        stateForm = this
        done()
      }
    })
    const GateSchemaForm = createForm({
      StateForm
    })
    const Component = createParentComponent(schema, rootData, GateSchemaForm)
    wrapper = mount(Component)
  })

  it('validation error is shown after submition', (done) => {
    const mockHandleSubmit = jest.fn()
    wrapper.vm.$on('submit', mockHandleSubmit)
    expect(mockHandleSubmit.mock.calls.length).toBe(0)
    // error is falsy
    expect(state.children[0].error).toBeFalsy()
    // emit submit
    stateForm.emitSubmit()
    // error become truthy
    setTimeout(() => {
      expect(state.children[0].error).toBeTruthy()
      expect(mockHandleSubmit.mock.calls.length).toBe(1)
      wrapper.vm.$off('submit', mockHandleSubmit)
      done()
    }, 100)
  })
})