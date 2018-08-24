# gateschema-form-vue  [![Build Status](https://travis-ci.org/GateSchema/gateschema-form-vue.svg?branch=master)](https://travis-ci.org/GateSchema/gateschema-form-vue)  [![Coverage Status](https://coveralls.io/repos/github/GateSchema/gateschema-form-vue/badge.svg)](https://coveralls.io/github/GateSchema/gateschema-form-vue)
A Vue component for generating forms from [gateschema-js](https://github.com/GateSchema/gateschema-js).

## Features  
* GateSchema driven  
* Auto validation  
* Auto updating form data when user inputs value     
* Conditional fields  
* Able to change schema dynamically  
* Extendible, custom form component  

## How it works
It transforms a [gateschema-js](https://github.com/GateSchema/gateschema-js) instance and the input value into a [StateForm](https://github.com/stateform/StateForm-Specification) state, and use a StateForm implemetation to display the form. 

## Quick Start  
In this example we use [stateform-iview](https://github.com/stateform/stateform-iview) as  [StateForm](https://github.com/stateform/StateForm-Specification) layer.
```js  
// file: GateSchemaForm.js

import Vue from 'vue'
// stateform implementation
import createStateForm from '@stateform/iview'
import "@stateform/iview/dist/stateform-iview.css"

import { createForm } from 'gateschema-form-vue'

// 1. creae StateForm component
// see https://github.com/stateform/StateForm-Specification for more details
const StateForm = createStateForm({
  upload: {
    handleUpload(file, cb) {
      // custom implementation
      setTimeout(() => {
        cb({
          status: 'done', // 'done' | 'error',
          url: 'http://....'
        })
      }, 1000)
    },
    handleRemove(file) {

    }
  },
  components: {
    // custom components
  }
})
// 2. create GateSchemaForm component
const GateSchemaForm = createForm({
  StateForm
})
// register
Vue.component('GateSchemaForm', GateSchemaForm)
```

```js
// file: App.vue
<template>
  <GateSchemaForm 
    :schema="schema" 
    v-model="value" 
    @submit="handleSubmit" 
  />
</template>
<script>
  import _ from 'gateschema'
  // your schema
  const schema = _
    .required
    .map({
      name: _
        .required
        .string
        .notEmpty,
      gender: _
        .required
        .enum({
          MALE: 0,
          FEMALE: 1
        }),
      age: _
        .optional
        .number,
      intro: _
        .optional
        .string
        .other('form', {
          component: 'Textarea'
          // StateForm options
          // see https://github.com/stateform/StateForm-Specification
        })
    })
  export default {
    data() {
      return {
        schema: schema,
        value: {}
      }
    },
    methods() {
      handleSubmit() {
        console.log(this.value)
      }
    }
  }
</script>
```

Using with vuex  
```js  
// file: store.js  

import Vuex from 'vuex'  
import {formStore} from 'gateschema-form-vue'

export const store = Vuex.Store({
  // ...
  modules: {
    form: formStore
  }
})
```

```js  
// file: App.vue
<template>
  <GateSchemaForm 
    // now the form is binding to store.form.myForm
    name="myForm"
    :schema="schema" 
    :value="value" 
    @submit="handleSubmit" 
  />
</template>
<script>
  import _ from 'gateschema'
  // your schema
  const schema = _.map({
    //....
  })
  export default {
    data() {
      return {
        schema: schema
      }
    },
    computed: {
      ...mapState({
        form: 'form/myForm'
      })
    },
    methods() {
      handleSubmit() {
        console.log(this.form)
      }
    }
  }
</script>


```

**Live Expamples on [CodeSandbox](https://codesandbox.io/s/0002mz7lrv?module=%2Fsrc%2FApp.vue)**    

## Install  
```
npm install gateschema-form-vue --save  
```  

## Usage  

Use the `other` keyword to pass your [StateForm](https://github.com/stateform/StateForm-Specification) options.  

Example  
```js  
const schema = _
  .require
  .map({
    name: _
      .require
      .map({
        firstName: _
          .required
          .string
          .notEmpty
          // StateForm options
          .other('form', {
            placeholder: 'First Name',
            help: 'Your first name',
            cols: {
              item: 6,
              label: 0,
              wrapper: 18
            }
          }),
        lastName: _
          .required
          .string
          .notEmpty
          // StateForm options
          .other('form', {
            placeholder: 'Last Name',
            cols: {
              item: 8,
              label: 0,
              wrapper: 24
            }
          })
      })
    languages: _
      .enumList({
        c: 0,
        java: 1,
        python: 2,
        go: 3,
        js: 4
      })
      // StateForm options
      .other({
        component: 'Select', 
        cols: {
          label: 6,
          wrapper: 18
        }
      })
  })

```

## Q&A  
### Custom validation ?  
This form component is GateSchema driven. You should [define your GateSchema keyword](https://github.com/GateSchema/gateschema-js/blob/master/docs/api.md#addkeywordkeyword-keyword-msgs-msgs-void) for custom validations  

### Conditional fields ?  
Use `switch` keyword  
```js  
const schema = _
  .map({
    type: _
      .enum({
        TYPE1: 1,
        TYPE2: 2
      }),
    field0: _
      .optional
      .string
      .switch('/type', [
        {
          case: _.value(1),
          // hidden when type = 1
          schema: _
            .other('form', {
              hidden: true
            })
        },
        {
          case: _.any,
          schema: _.any
        }
      ])
  })
  .switch('/type', [
    {
      case: _.value(1),
      // have field1 when type = 1
      schema: _
        .map({
          field1: _
            .required
            .number
        })
    },
    {
      case: _.value(2),
      schema: _
        .map({
          field2: _
            .required
            .string
            .notEmpty
        })
    }
  ])
```

### Custom component ?  
Extend the StateForm implementation  

## License  
MIT
