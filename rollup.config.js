/* eslint-disable import/no-extraneous-dependencies */
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**', // only transpile our source code
    }),
  ],
  external: (p) => {
    const deps = [
      'assert',
      'child_process',
      'crypto',
      'fs',
      'assert',
      'path',
      'assert',
      'assert',
      'fs',
      'assert',
      'path',
      'assert',
      'assert',
      'path',
      'mkdirp',
      'assert',
      'lodash/camelCase',
      'lodash/set',
      'lodash/get',
      'lodash/has',
      'assert',
    ];
    const r = deps.includes(p);
    return r;
  },
};
