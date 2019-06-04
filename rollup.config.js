import git from 'git-rev-sync'
import replace from 'rollup-plugin-replace'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { terser }  from 'rollup-plugin-terser'

var pjson = require('./package.json')

const banner = `// topolis. See https://github.com/bjornharrtell/topolis
// Licenses:
// https://github.com/bjornharrtell/topolis/blob/master/LICENSE.txt
`

export default {
  input: 'src/topolis.js',
  output: {
    format: 'umd',
    name: 'topolis',
    banner,
  },
  plugins: [
    replace({
      npm_package_version: pjson.version,
      git_hash: git.short()
    }),
    resolve(),
    commonjs(),
    babel({
      presets: [['@babel/env', {
        modules: false,
        targets: {
          browsers: ['> 2%']
        }
      }]],
      plugins: [
        '@babel/plugin-external-helpers'
      ],
      babelrc: false
    }),
    terser({
      output: {
        comments: (node, token) => token.line < 4
      }
    })
  ]
}
