/* tslint:disable: variable-name max-line-length */
/**
 * Try to not make your own edits to this file, use the constants folder instead.
 * If more constants should be added file an issue or create PR.
 */
import 'ts-helpers';

let MY_COPY_FOLDERS = [];

const {
  ContextReplacementPlugin,
  DefinePlugin,
  DllPlugin,
  DllReferencePlugin,
  ProgressPlugin,
  NoEmitOnErrorsPlugin
} = require('webpack');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin');
const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const { hasProcessFlag, root, testDll } = require('./helpers.js');

const EVENT = process.env.npm_lifecycle_event || '';
const AOT = EVENT.includes('aot');
const DEV_SERVER = EVENT.includes('webdev');
const DLL = EVENT.includes('dll');
const E2E = EVENT.includes('e2e');
const PROD = EVENT.includes('prod');
const WATCH = hasProcessFlag('watch');

let port: number;
if (PROD) {
  port = 8088;
} else {
  port = 3000;
}

const PORT = port;

console.log('PRODUCTION BUILD: ', PROD);
console.log('AOT: ', AOT);
if (DEV_SERVER) {
  testDll();
  console.log(`Starting dev server on: http://0.0.0.0:${PORT}`);
}

const CONSTANTS = {
  AOT: AOT,
  ENV: PROD ? JSON.stringify('production') : JSON.stringify('development'),
  HOST: '0.0.0.0',
  PORT: PORT
};

const COPY_FOLDERS = [
  { from: 'src/assets', to: 'assets' },
  ...MY_COPY_FOLDERS
];

if (!DEV_SERVER) {
  COPY_FOLDERS.unshift({ from: 'src/index.html' });
} else {
  COPY_FOLDERS.push({ from: 'dll' });
}

const clientConfig = function webpackConfig(): WebpackConfig {
  let config: WebpackConfig = Object.assign({});

  config.module = {
    rules: [
      {
        test: /\.js$/,
        loader: 'source-map-loader',
        exclude: [
          root('node_modules/@angular'),
          root('node_modules/rxjs'),
          /(node_modules)/
        ]
      },
      {
        test: /\.ts$/,
        loaders: [
          '@angularclass/hmr-loader',
          'awesome-typescript-loader?{configFileName: "tsconfig.webpack.json"}',
          'angular2-template-loader',
          'angular-router-loader?loader=system&genDir=compiled&aot=' + AOT
        ],
        exclude: [/\.(spec|e2e|d)\.ts$/]
      },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.html/, loader: 'raw-loader', exclude: [root('src/index.html')] },
      { test: /\.css$/, loader: 'raw-loader' },
    ]
  };

  config.plugins = [
    new ContextReplacementPlugin(
      /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
      root('./src')
    ),
    new ProgressPlugin(),
    new CheckerPlugin(),
    new DefinePlugin(CONSTANTS),
    new NamedModulesPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      metadata: { isDevServer: DEV_SERVER }
    }),
  ];

  if (DEV_SERVER) {
    config.plugins.push(
      new DllReferencePlugin({
        context: '.',
        manifest: require(`./dll/polyfill-manifest.json`)
      }),
      new DllReferencePlugin({
        context: '.',
        manifest: require(`./dll/vendor-manifest.json`)
      })
    );
  }

  if (DLL) {
    config.plugins.push(
      new DllPlugin({
        name: '[name]',
        path: root('dll/[name]-manifest.json'),
      })
    );
  } else {
    config.plugins.push(
      new CopyWebpackPlugin(COPY_FOLDERS, { ignore: ['*dist_root/*'] }),
      new CopyWebpackPlugin([{ from: 'src/assets/dist_root' }])
    );
  }

  if (PROD) {
    config.plugins.push(
      new NoEmitOnErrorsPlugin(),
      new UglifyJsPlugin({
        beautify: false,
        comments: false
      }),
    );
    if (!E2E && !WATCH) {
      config.plugins.push(
        new BundleAnalyzerPlugin({analyzerPort: 5000})
      );
    }
  }

  config.cache = true;
  PROD ? config.devtool = 'source-map' : config.devtool = 'eval';

  if (DLL) {
    config.entry = {
      app_assets: ['./src/main.browser'],
      polyfill: [
        'sockjs-client',
        '@angularclass/hmr',
        'ts-helpers',
        'zone.js',
        'core-js/client/shim.js',
        'core-js/es6/reflect.js',
        'core-js/es7/reflect.js',
        'querystring-es3',
        'strip-ansi',
        'url',
        'punycode',
        'events',
        'webpack-dev-server/client/socket.js',
        'webpack/hot/emitter.js',
        'zone.js/dist/long-stack-trace-zone.js'
      ],
      vendor: [
        '@angular/common',
        '@angular/compiler',
        '@angular/core',
        '@angular/forms',
        '@angular/http',
        '@angular/platform-browser',
        '@angular/platform-browser-dynamic',
        '@angular/router',
        'rxjs'
      ]
    };
  } else {
    if (AOT) {
        config.entry = {
          main: './src/main.browser.aot'
        };
      } else {
        config.entry = {
          main: './src/main.browser'
        };
      }
  }
  if (!DLL) {
    config.output = {
      path: root('dist/client'),
      filename: !PROD ? '[name].bundle.js' : '[name].[chunkhash].bundle.js',
      sourceMapFilename: !PROD ? '[name].bundle.map' : '[name].[chunkhash].bundle.map',
      chunkFilename: !PROD ? '[id].chunk.js' : '[id].[chunkhash].chunk.js'
    };
  } else {
    config.output = {
      path: root('dll'),
      filename: '[name].dll.js',
      library: '[name]'
    };
  }

  config.devServer = {
    contentBase: AOT ? './compiled' : './src',
    port: CONSTANTS.PORT,
    historyApiFallback: {
      disableDotRule: true,
    },
    stats: 'minimal',
    host: '0.0.0.0',
    watchOptions: {
      poll: undefined,
      aggregateTimeout: 300,
      ignored: /node_modules/
    }
  };

  config.performance = {
    hints: false
  };

  config.node = {
    global: true,
    process: true,
    Buffer: false,
    crypto: true,
    module: false,
    clearImmediate: false,
    setImmediate: false,
    clearTimeout: true,
    setTimeout: true
  };

  config.resolve = {
    extensions: ['.ts', '.js', '.json']
  };

  return config;

} ();

DLL ? console.log('BUILDING DLLs') : console.log('BUILDING APP');
module.exports = clientConfig;
