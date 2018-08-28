import defaultTransformer from 'gateschema-transformer';
export { default as transformer } from 'gateschema-transformer';
import Vue from 'vue';

function debounce(func, wait) {
  let tId;
  return function() {
    clearTimeout(tId);
    tId = setTimeout(() => {
      tId = null;
      func.apply(this, arguments);
    }, wait);
  }
}

function createDForm(options = {}) {
  const { StateForm, transformer = defaultTransformer, vuexModuleName = 'form' } = options;

  return {
    data() {
      return {
        activePaths: {},
        validationOptions: {
          skipAsync: true,
          useCache: true,
        },
        pathValidationOptions: {},
        // formState: null,
        // cache: {}
        // errors: []
      }
    },
    props: {
      schema: {
        type: Object
      },
      value: {},
      name: {},
      debounce: {
        type: Number
      },
      ignoreErrors: {
        type: Object,
        default() {
          return {
            map: true,
            list: true
          }
        }
      }
    },
    methods: {
      setValueOfFormPath(path, value, parentValue, key) {
        if (path === '/') {
          this.$emit('input', value);
        } else {
          this.$parent.$set(parentValue, key, value);
        }
      },
      transformNode(node, parentNode) {
        const { activePaths, ignoreErrors } = this;
        const {path, error, value, constraints} = node;
        const {type, other = {}} = constraints;
        const form = other.form || {};

        if (form.hidden) {
          return
        }
        let errorMsg;

        // collect error
        if (error && !ignoreErrors[error.keyword]) {
          this.errors.push([path, error]);
          errorMsg = error.msg;
        }

        const formItem =  Object.assign({}, form, {
          path,
          required: constraints.required,
          error: (activePaths[path] && errorMsg) || undefined,
          value,
          children: node.children,
          option: constraints.option
        });


        const componentMap = {
          list: 'List',
          map: 'Map',
          string: 'Input',
          number: 'InputNumber',
          boolean: 'Switch',
          enumList: 'Checkbox',
          enum: 'Radio'
        };

        let component = formItem.component || (path === '/' ? 'Form' :  componentMap[type]);


        if (component === 'Select' && type === 'enumList') {
          formItem.multiple = true;
        }

        if (!formItem.label && parentNode && parentNode.constraints.type !== 'list') {
          formItem.label = path.slice(path.lastIndexOf('/') + 1);
        }

        formItem.component = component;

        this.cache[path] = {
          type,
          item: formItem
        };
        return formItem
      },
      setFormState(formState) {
        this.formState = formState;
        this.$forceUpdate();
      },
      updateValue(path, value, noDebounce) {
        const rootData = this.value;
        const keys = path.split('/').slice(1);
        const length = keys.length;
        if (length === 0) {
          return this.setValueOfFormPath('/', value)
        }
        let target = rootData || {};
        if (target !== rootData) {
          this.setValueOfFormPath('/', target);
        }

        const lastIndex = length - 1;
        let currentPath = '';
        for(let i = 0; i < length; i++) {
          const key = keys[i];
          currentPath += ('/' + key);
          if (i < lastIndex) {
            let child = target[key];
            if (child == null || typeof child !== 'object') {
              child = this.cache[currentPath].type === 'list' ? [] : {};
              this.setValueOfFormPath(currentPath, child, target, key);
            }
            target = child;
          } else {
            this.setValueOfFormPath(currentPath, value, target, key);
          }
        }
        this.$nextTick(() => {
          return noDebounce ? this.renderSchema() : this.renderSchemaDebounced()
        });
      },
      handleUserInput(path, value, index) {
        let noDebounce = false;
        const type = this.cache[path].type;
        if (type === 'string' && value === '') {
          value = undefined;
        } else if (type === 'list') {
          noDebounce = true;
          if (typeof index !== 'undefined') {
            const activePaths = this.activePaths;
            const newActivePaths = {};
            const activePathsOfOldValue = [];
            const prefix = path + '/';
            Object.keys(activePaths).forEach(key => {
              if (key.indexOf(prefix) === 0) {
                activePathsOfOldValue.push(key);
              } else {
                newActivePaths[key] = true;
              }
            });
            const regex = new RegExp('^' + path + '\\/(\\d)(\\/.*)?');
            let match;
            let idx;
            let appendix;
            activePathsOfOldValue.forEach(oldKey => {
              match = oldKey.match(regex);
              idx = ~~match[1];
              appendix = match[2] || '';
              if (idx < index) {
                newActivePaths[oldKey] = true;
              } else if (idx > index) {
                newActivePaths[prefix + (idx - 1) + appendix] = true;
              }
            });
            this.activePaths = newActivePaths;
          }
        }
        this.activePaths[path] = true;
        this.pathValidationOptions = {
          [path]: {
            skipAsync: false
          }
        };
        this.updateValue(path, value, noDebounce);
      },
      handleSubmit() {
        const activePaths = this.activePaths;
        Object.keys(this.cache).forEach(key => {
          activePaths[key] = true;
        });
        this.renderSchema(() => {
          this.$emit('submit', this.errors);
        });
      },
      handleReset() {
        this.$emit('reset');
      },
      renderSchema(cb) {
        this.errors = [];
        this.cache = {};
        const options = {
          path: '/',
          value: this.value,
          rootData: this.value,
          validationOptions: this.validationOptions,
          pathValidationOptions: this.pathValidationOptions,
          transform: this.transformNode,
        };
        transformer.transform(this.schema, options, (formState) => {
          this.setFormState(formState);
          return cb && cb()
        });
      },
    },
    render(h) {
      return h(StateForm, {
        props: {
          state: this.formState,
        },
        on: {
          submit: this.handleSubmit,
          reset: this.handleReset,
          input: this.handleUserInput
        }
      }, this.$slots.default)
    },
    created() {
      if (this.name) {
        const name = this.name;
        const mutationsName = vuexModuleName + '/setValueOfFormPath';
        this.setValueOfFormPath = function(path, value, parentValue, key) {
          this.$store.commit(mutationsName, {
            name,
            path,
            value,
            parentValue,
            key
          });
        };
      }

      this.$watch('schema', {
        handler: this.renderSchema
      });

      this.renderSchemaDebounced = this.debounce 
        ? debounce(this.renderSchema, this.debounce) 
        : this.renderSchema;
      
      if (this.schema) {
        this.renderSchemaDebounced();
      }
    }
  }
}

const state = {};
const mutations = {
  setValueOfFormPath(state, {name, path, value, parentValue, key}) {
    if (path === '/') {
      Vue.set(state, name, value);
    } else {
      Vue.set(parentValue, key, value);
    }
  }
};

var store = {
  namespaced: true,
  state,
  mutations
};

export { createDForm as createForm, store as formStore };
