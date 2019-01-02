const { readFileSync } = require('fs');
const { resolve } = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: {
    main: './exports/main.js',
    utils: './exports/utils.js',
    helpers: './exports/helpers.js',
    'uris/aws': './src/Provider/uris/aws.js',
  },
  output: {
    filename: '[name]/index.js',
    path: __dirname,
    libraryExport: 'default',
    libraryTarget: 'commonjs2',
  },
  externals: nodeExternals(),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: JSON.parse(readFileSync(resolve(__dirname, '.babelrc'))),
        },
      },
    ],
  },
  target: 'node',
};
