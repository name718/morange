import { defineConfig } from '@tarojs/cli';
import path from 'node:path';

interface WebpackChain {
  module: {
    rule(name: string): {
      test(pattern: RegExp): {
        include: {
          add(path: string): {
            end(): {
              use(name: string): {
                loader(name: string): {
                  options(options: unknown): unknown;
                };
              };
            };
          };
        };
      };
    };
  };
  resolve: {
    extensions: {
      add(extension: string): WebpackChain['resolve']['extensions'];
    };
  };
}

export default defineConfig(async (merge) => {
  const baseConfig = {
    projectName: 'morange-image',
    date: '2026-06-19',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    framework: 'react',
    compiler: 'webpack5',
    cache: {
      enable: false
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false
        }
      },
      alias: {
        '@': path.resolve(__dirname, '../src'),
        '@tarojs/shared': path.resolve(__dirname, '../../../node_modules/@tarojs/shared')
      },
      webpackChain(chain: WebpackChain) {
        chain.resolve.extensions.add('.ts').add('.tsx');
        chain.module
          .rule('morange-workspace')
          .test(/\.[jt]sx?$/)
          .include.add(path.resolve(__dirname, '../../../packages'))
          .end()
          .use('babel-loader')
          .loader('babel-loader')
          .options({
            presets: [
              [
                'taro',
                {
                  framework: 'react',
                  ts: true
                }
              ]
            ]
          });
      }
    },
    h5: {}
  };

  if (process.env.NODE_ENV === 'production') {
    return merge({}, baseConfig, {
      mini: {
        optimizeMainPackage: {
          enable: true
        }
      }
    });
  }

  return merge({}, baseConfig, {});
});
