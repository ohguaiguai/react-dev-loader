let ReactDev = require('./lib/react-dev-loader');
// 只要安装了 webpack 就得到这个模块
let loaderUtils = require('loader-utils');

function loader(source, ast) {
  let options = loaderUtils.getOptions(this);
  // console.log(this.resource);
  // this.resource 当前正在转换的模块的绝对路径
  if (options.exclude && options.exclude.test(this.resource)) {
    return source; // 不转换，直接返回
  }
  let reactDev = new ReactDev(options);
  // console.log(source);
  let target = reactDev.generate(source);
  // console.log(target);
  return target;
}

module.exports = loader;
