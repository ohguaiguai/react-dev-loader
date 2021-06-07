let ReactDev = require('./lib/react-dev-loader');
// 只要安装了 webpack 就得到这个模块
const loaderUtils = require('loader-utils');

function loader(source) {
  let options = loaderUtils.getOptions(this);
  // this.resource 当前正在转换的模块的绝对路径

  // if (!/QuickAccessFlexbox/.test(this.resource)) {
  //   return source;
  // }

  if (options && options.exclude && options.exclude.test(this.resource)) {
    return source; // 不转换，直接返回
  }

  let reactDev = new ReactDev(options);

  let target = source;

  try {
    const paths = this.resource.split('/');
    const name = paths[paths.length - 1];
    const suffix = name.split('.')[1];

    if (suffix !== 'tsx' && suffix !== 'jsx') {
      return target;
    }
    // 显示当前正在转换的模块的绝对路径, 默认不显示
    if (options && options.verbose) {
      console.log(this.resource);
    }
    target = reactDev.generate(source, name);
  } catch (e) {
    console.log(e);
  }
  return target;
}

module.exports = loader;
