# react-dev-loader ![](https://img.shields.io/badge/npm%20package-2.2.16-brightgreen) ![](https://img.shields.io/badge/webpack-loader-blue)

> 一个用来辅助 react 开发的工具

## 目前提供如下功能：

1. 每个组件挂载和卸载时打印 log
2. 组件更新打印更新花费时间
3. 组件更新打印引起组件更新的 props

> 同时支持类组件和函数组件。

另外，通过颜色来区分不同语义：

- 蓝色，代表组件渲染
- 绿色，代表第一次渲染
- 红色，代表某一段时刻同一组件挂载了多次，需要重点排查
- 黄色，标识该行打印了「引起组件更新的属性」
- 灰色，代表组件卸载

## 使用方法

安装

```
npm i react-dev-loader -D
```

配置

```js
 {
        test: /\.(jsx|jsx)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
          process.env.NODE_ENV === 'development' && {
            loader: 'react-dev-loader',
            options: {},
          },
        ],
        exclude: /node_modules/,
      },
```

需要注意的是:

- `react-dev-loader`要放在最下面，也就是要最先执行。
- 组件一定要是 `tsx` 后缀或者是 `jsx` 后缀， `ts`、`js` 后缀的文件不会处理。
- 要区分环境, 确保只在开发环境下使用

`options` 提供了 2 个可选项

- `exclude` 忽略不需要的文件或文件夹
- `verbose` 是否显示当前正在处理的模块路径，默认不显示

## 效果截图

![](https://assets.onlyadaydreamer.top/react-dev-loader.png)

如果你有其他需求可以来[github](https://github.com/onlyadaydreamer/react-dev-loader)提 issue 哦~
