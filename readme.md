# react-dev-loader ![](https://img.shields.io/badge/npm%20package-2.1.5-brightgreen) ![](https://img.shields.io/badge/webpack-loader-blue)

> 一个用来辅助 react 开发的工具

## 目前提供如下功能：

1. 每个组件挂载和卸载时打印 log
2. 组件更新打印更新花费时间
3. 组件更新打印引起组件更新的 props

同时支持类组件和函数组件。

另外，通过颜色来区分不同语义：

- 蓝色，正常行为
- 绿色，代表第一次渲染
- 红色，代表某一段时刻同一组件挂载了多次，需要重点排查
- 黄色，标识该行「打印了引起组件更新的属性」

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

![](/assets/20210604-259294.png)

如果你有其他需求可以来[github](https://github.com/onlyadaydreamer/react-dev-loader)提 issue 哦~
