import pkg from './package.json'
import babel from 'rollup-plugin-babel'
import {uglify} from 'rollup-plugin-uglify'

export default [
  {
    input: 'src/index.js',
    plugins: [
      babel(),
      uglify()
    ],
    output: {
      name: 'GateSchemaForm',
      file: pkg.browser,
      globals: {
        'gateschema-transformer': 'GateSchemaTransformer',
        'vue': 'Vue'
      },
      format: 'umd',
      sourcemap: true
    },
    external: ['gateschema-transformer', 'vue'],
  },
  {
    input: 'src/index.js',
    plugins: [
      babel()
    ],
    output: {
      format: 'cjs',
      file: pkg.main,
      sourcemap: true
    },
    external: ['gateschema-transformer', 'vue'],
  },
  {
    input: 'src/index.js',
    output: {
      format: 'es',
      file: pkg.module,
    },
    external: ['gateschema-transformer', 'vue']
  }
]

