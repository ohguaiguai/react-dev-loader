# react-dev-loader [![npm version](https://badge.fury.io/js/react-dev-loader.svg)](https://badge.fury.io/js/react-dev-loader) ![](https://img.shields.io/badge/webpack-loader-yellowgreen)

> 一个用来辅助 react 开发的工具

## 目前提供如下功能：

1. 每个组件挂载和卸载时打印 log
2. 组件更新时打印更新花费时间
3. 组件更新时打印引起组件更新的 prop

同时支持类组件和函数组件

## 使用方法

```js
 {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
          {
            loader: 'react-dev-loader',
            options: {},
          },
        ],
        exclude: /node_modules/,
      },
```

`options` 提供了一个可选项

- `exclude` 忽略不需要的文件或文件夹

## 效果截图

![](/assets/20210603-474264.png)

如果你有其他需求可以来[github](https://github.com/onlyadaydreamer/react-dev-loader)提 issue 哦~
