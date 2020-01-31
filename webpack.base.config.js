const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const ENV = process.env.NODE_ENV || 'development';
const isProd = ENV === 'production';
const isDev = ENV === 'development';

const basePath = process.cwd();

module.exports = {
  devtool: 'eval',

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".mjs", ".ts", ".tsx", ".js", ".jsx", ".json"],

    alias: {
      arc: path.resolve(basePath, 'src/arc'),
      actions: path.resolve(basePath, 'src/actions'),
      components: path.resolve(basePath, 'src/components'),
      constants: path.resolve(basePath, 'src/constants'),
      data: path.resolve(basePath, 'data'),
      genericSchemeRegistry: path.resolve(basePath, 'src/genericSchemeRegistry'),
      layouts: path.resolve(basePath, 'src/layouts'),
      lib: path.resolve(basePath, 'src/lib'),
      pages: path.resolve(basePath, 'src/pages'),
      reducers: path.resolve(basePath, 'src/reducers'),
      selectors: path.resolve(basePath, 'src/selectors'),
      src: path.resolve(basePath, 'src'),
      'ipfs-http-client': 'ipfs-http-client/dist',
      'ipfs-api': 'ipfs-api/dist',
      'bn.js': 'bn.js/lib/bn.js',
      'lit-element': path.resolve('./node_modules/lit-element'),
      'lit-html': path.resolve('./node_modules/lit-html'),
      'graphql': path.resolve('./node_modules/graphql')
    },
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /\.tsx?$/,
        loader: ['react-hot-loader/webpack', "awesome-typescript-loader"],
        exclude: [/node_modules/, /\.spec\.ts$/]
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
        exclude: [
          /node_modules\/apollo-cache-inmemory/,
          /node_modules\/apollo-client/,
          /node_modules\/apollo-link/,
          /node_modules\/apollo-link-http/,
          /node_modules\/apollo-link-ws/,
          /node_modules\/xhr2-cookies/,
          /node_modules\/rlp/,
          /node_modules\/subscriptions-transport-ws/,
          /node_modules\/zen-observable-ts/,
          /node_modules\/graphql-request/,
          /node_modules\/https-did-resolver/,
          /node_modules\/@material/,
          /node_modules\/graphql-tools/,
          /node_modules\/ethereumjs-tx/,
          /node_modules\/ethereumjs-common/,
          /node_modules\/deprecated-decorator/
        ]
      },

      // CSS handling
      {
        test: /\.css$/,
        include: /client/,
        use: [
          'style-loader',
          { // translates CSS into CommonJS (css-loader) and automatically generates TypeScript types
            loader: 'typings-for-css-modules-loader',
            options: {
              camelCase: true,
              localIdentName: '[name]__[local]___[hash:base64:5]',
              minimize: isProd,
              modules: true,
              namedExport: true,
              sourceMap: true
            }
          },
        ],
      },

      // Images & fonts
      {
        test: /\.(png|jpg|gif|mp4|ogg|svg|woff|woff2|ttf|eot|ico)$/,
        loader: 'url-loader',
        options: {
          limit: 10000 // For assets smaller than 10k inline them as data urls, otherwise use regular file loader
        }
      },

    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      chunksSortMode: 'none',
      template: 'src/index.html'
    }),
    new webpack.DefinePlugin({
      'VERSION': JSON.stringify(require('./package.json').version)
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
