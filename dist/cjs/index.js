'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var defaultTransformer = _interopDefault(require('gateschema-transformer'));
var Vue = _interopDefault(require('vue'));

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function debounce(func, wait) {
  var tId;
  return function () {
    var _this = this,
        _arguments = arguments;

    clearTimeout(tId);
    tId = setTimeout(function () {
      tId = null;
      func.apply(_this, _arguments);
    }, wait);
  };
}

function createDForm() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var StateForm = options.StateForm,
      _options$transformer = options.transformer,
      transformer = _options$transformer === void 0 ? defaultTransformer : _options$transformer,
      _options$vuexModuleNa = options.vuexModuleName,
      vuexModuleName = _options$vuexModuleNa === void 0 ? 'form' : _options$vuexModuleNa;
  return {
    data: function data() {
      return {
        activePaths: {},
        validationOptions: {
          skipAsync: true,
          useCache: true
        },
        submitValidationOptions: {
          useCache: true
        },
        pathValidationOptions: {} // formState: null,
        // cache: {}
        // errors: []

      };
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
        default: function _default() {
          return {
            map: true,
            list: true
          };
        }
      }
    },
    methods: {
      setValueOfFormPath: function setValueOfFormPath(path, value, parentValue, key) {
        if (path === '/') {
          this.$emit('input', value);
        } else {
          this.$parent.$set(parentValue, key, value);
        }
      },
      transformNode: function transformNode(node, parentNode) {
        var activePaths = this.activePaths,
            ignoreErrors = this.ignoreErrors;
        var path = node.path,
            error = node.error,
            value = node.value,
            constraints = node.constraints;
        var type = constraints.type,
            _constraints$other = constraints.other,
            other = _constraints$other === void 0 ? {} : _constraints$other;
        var form = other.form || {};

        if (form.hidden) {
          return;
        }

        var errorMsg; // collect error

        if (error && !ignoreErrors[error.keyword]) {
          this.errors.push(error);
          errorMsg = error.msg;
        }

        var formItem = Object.assign({}, form, {
          path: path,
          required: constraints.required,
          error: activePaths[path] && errorMsg || undefined,
          value: value,
          children: node.children,
          option: constraints.option
        });
        var componentMap = {
          list: 'List',
          map: 'Map',
          string: 'Input',
          number: 'InputNumber',
          boolean: 'Switch',
          enumList: 'Checkbox',
          enum: 'Radio'
        };
        var component = formItem.component || (path === '/' ? 'Form' : componentMap[type]);

        if (component === 'Select' && type === 'enumList') {
          formItem.multiple = true;
        }

        if (!formItem.label && parentNode && parentNode.constraints.type !== 'list') {
          formItem.label = path.slice(path.lastIndexOf('/') + 1);
        }

        formItem.component = component;
        this.cache[path] = {
          type: type,
          item: formItem
        };
        return formItem;
      },
      setFormState: function setFormState(formState) {
        this.formState = formState;
        this.$forceUpdate();
      },
      updateValue: function updateValue(path, value, noDebounce) {
        var _this2 = this;

        var rootData = this.value;
        var keys = path.split('/').slice(1);
        var length = keys.length;

        if (length === 0) {
          return this.setValueOfFormPath('/', value);
        }

        var target = rootData || {};

        if (target !== rootData) {
          this.setValueOfFormPath('/', target);
        }

        var lastIndex = length - 1;
        var currentPath = '';

        for (var i = 0; i < length; i++) {
          var key = keys[i];
          currentPath += '/' + key;

          if (i < lastIndex) {
            var child = target[key];

            if (child == null || _typeof(child) !== 'object') {
              child = this.cache[currentPath].type === 'list' ? [] : {};
              this.setValueOfFormPath(currentPath, child, target, key);
            }

            target = child;
          } else {
            this.setValueOfFormPath(currentPath, value, target, key);
          }
        }

        this.$nextTick(function () {
          return noDebounce ? _this2.renderSchema() : _this2.renderSchemaDebounced();
        });
      },
      handleUserInput: function handleUserInput(path, value, index) {
        var noDebounce = false;
        var type = this.cache[path].type;

        if (type === 'string' && value === '') {
          value = undefined;
        } else if (type === 'list') {
          noDebounce = true;

          if (typeof index !== 'undefined') {
            var activePaths = this.activePaths;
            var newActivePaths = {};
            var activePathsOfOldValue = [];
            var prefix = path + '/';
            Object.keys(activePaths).forEach(function (key) {
              if (key.indexOf(prefix) === 0) {
                activePathsOfOldValue.push(key);
              } else {
                newActivePaths[key] = true;
              }
            });
            var regex = new RegExp('^' + path + '\\/(\\d)(\\/.*)?');
            var match;
            var idx;
            var appendix;
            activePathsOfOldValue.forEach(function (oldKey) {
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
        this.pathValidationOptions = _defineProperty({}, path, {
          skipAsync: false
        });
        this.updateValue(path, value, noDebounce);
      },
      handleSubmit: function handleSubmit() {
        var _this3 = this;

        var activePaths = this.activePaths;
        Object.keys(this.cache).forEach(function (key) {
          activePaths[key] = true;
        });
        this.renderSchema({
          validationOptions: this.submitValidationOptions,
          cb: function cb() {
            _this3.$emit('submit', _this3.errors);
          }
        });
      },
      handleReset: function handleReset() {
        this.$emit('reset');
      },
      renderSchema: function renderSchema() {
        var _this4 = this;

        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var cb = options.cb,
            _options$validationOp = options.validationOptions,
            validationOptions = _options$validationOp === void 0 ? this.validationOptions : _options$validationOp,
            _options$pathValidati = options.pathValidationOptions,
            pathValidationOptions = _options$pathValidati === void 0 ? this.pathValidationOptions : _options$pathValidati;
        this.errors = [];
        this.cache = {};
        var transformOptions = {
          path: '/',
          value: this.value,
          rootData: this.value,
          validationOptions: validationOptions,
          pathValidationOptions: pathValidationOptions,
          transform: this.transformNode
        };
        transformer.transform(this.schema, transformOptions, function (formState) {
          _this4.setFormState(formState);

          return cb && cb();
        });
      }
    },
    render: function render(h) {
      return h(StateForm, {
        props: {
          state: this.formState
        },
        on: {
          submit: this.handleSubmit,
          reset: this.handleReset,
          input: this.handleUserInput
        }
      }, this.$slots.default);
    },
    created: function created() {
      if (this.name) {
        var name = this.name;
        var mutationsName = vuexModuleName + '/setValueOfFormPath';

        this.setValueOfFormPath = function (path, value, parentValue, key) {
          this.$store.commit(mutationsName, {
            name: name,
            path: path,
            value: value,
            parentValue: parentValue,
            key: key
          });
        };
      }

      this.$watch('schema', {
        handler: this.renderSchema
      });
      this.renderSchemaDebounced = this.debounce ? debounce(this.renderSchema, this.debounce) : this.renderSchema;

      if (this.schema) {
        this.renderSchemaDebounced();
      }
    }
  };
}

var state = {};
var mutations = {
  setValueOfFormPath: function setValueOfFormPath(state, _ref) {
    var name = _ref.name,
        path = _ref.path,
        value = _ref.value,
        parentValue = _ref.parentValue,
        key = _ref.key;

    if (path === '/') {
      Vue.set(state, name, value);
    } else {
      Vue.set(parentValue, key, value);
    }
  }
};
var store = {
  namespaced: true,
  state: state,
  mutations: mutations
};

exports.transformer = defaultTransformer;
exports.createForm = createDForm;
exports.formStore = store;
//# sourceMappingURL=index.js.map
