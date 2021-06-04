const babel = require('@babel/core');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const pluginSyntaxJSX = require('@babel/plugin-syntax-jsx');
const pluginSyntaxTypescript = require('babel-plugin-syntax-typescript');
const t = require('@babel/types');
const loggerStr = require('./miniLogger.js');

// arrowFunction
//const a = () => {}
//export default a;

// normalFunction
//function b() {}
//export default b;

// EXPORTDEFAULTFUNCTION
// export default function A() {}

// EXPORTDEFAULTCLASS
// export default class A extends B() {}

// normalClass
// class A {}
// export default A;

const ARROWFUNCTION = 'arrowFunction';
const NORMALFUNCTION = 'normalFunction';
const EXPORTDEFAULTFUNCTION = 'exportDefaultFunction';

const EXPORTDEFAULTCLASS = 'exportDefaultClass';
const NORMALCLASS = 'normalClass';

const FUNCTION = 'function';
const CLASS = 'class';
class ReactDev {
  constructor(options) {
    this.options = options;
    /** 组件类型 */
    this.comType = '';
    /** 组件名字 */
    this.comName = '';
    this.writing = '';
  }
  generate(source, name) {
    let self = this;
    // 得到语法树
    let astObj = babel.parseSync(source, {
      sourceType: 'module',
      filename: name || 'temp.tsx', // 替换为组件名称
      plugins: [pluginSyntaxJSX, pluginSyntaxTypescript],
    });

    traverse(astObj, {
      // Program中不能使用path.skip(), 在这里调用此方法相当于整个树节点都被跳过了
      Program(path) {
        const body = path.node.body;
        let exportDefaultNode = null;
        let variableDeclarationNodes = [];

        body.forEach((nd) => {
          // console.log(nd.type);
          switch (nd.type) {
            // 第一层有类声明, 说明是一般的类组件
            case 'ClassDeclaration':
              self.comType = CLASS;
              self.writing = NORMALCLASS;
              break;
            case 'ExportDefaultDeclaration':
              exportDefaultNode = nd;
              // 函数组件
              // 这里是for循环中嵌套了switch，循环无法中断,也不能中断，每一个nd都会走一次
              if (!self.comType) {
                self.comType = FUNCTION;
              }
              break;
            case 'VariableDeclaration':
              variableDeclarationNodes.push(nd);
              if (!self.comType) {
                self.comType = FUNCTION;
              }
              break;
            default:
              break;
          }
        });

        if (exportDefaultNode) {
          getInfo(exportDefaultNode);
        } else {
          // 没有说明不是一个组件
          path.stop();
        }

        variableDeclarationNodes.forEach((nd) => {
          const declarations = nd.declarations;
          if (declarations && declarations.length) {
            declarations.forEach((declaration) => {
              if (
                declaration.init &&
                declaration.init.type === 'ArrowFunctionExpression' &&
                declaration.id.name === self.comName
              ) {
                self.writing = ARROWFUNCTION;
              }
            });
          }
        });

        function getInfo(node) {
          const declaration = node.declaration;
          if (declaration) {
            switch (declaration.type) {
              case 'Identifier':
                self.comName = declaration.name;
                self.writing =
                  self.comType === FUNCTION ? NORMALFUNCTION : NORMALCLASS;
                break;
              case 'CallExpression':
                const getComName = (nd) => {
                  if (nd.arguments.length > 0) {
                    const node = nd.arguments[0];
                    if (node.type === 'Identifier') {
                      self.comName = node.name;
                      return;
                    } else if (node.type === 'CallExpression') {
                      getComName(node);
                    }
                  }
                };
                getComName(declaration);
                break;
              case 'ClassDeclaration':
                self.writing = EXPORTDEFAULTCLASS;
                self.comName = declaration.id.name;
                self.comType = CLASS;
                break;
              case 'FunctionDeclaration':
                self.writing = EXPORTDEFAULTFUNCTION;
                self.comName = declaration.id.name;
                self.comType = FUNCTION;
                break;
              default:
                break;
            }
          }
        }
        // console.log('info', self.comName, self.comType, self.writing);
      },
      ExportDefaultDeclaration(path) {
        if (self.writing === EXPORTDEFAULTCLASS) {
          path.replaceWith(path.node.declaration);
          path.insertAfter(
            t.exportDefaultDeclaration(
              t.callExpression(t.identifier('withReactDevLogger'), [
                t.identifier(self.comName),
              ])
            )
          );
          path.stop();
        }

        if (self.writing === NORMALCLASS) {
          const replaceName = (node) => {
            if (node.type === 'Identifier') {
              node.name = `withReactDevLogger(${self.comName})`;
              return;
            } else {
              // 函数包裹
              if (node.arguments.length) {
                replaceName(node.arguments[0]);
              }
            }
          };
          const declaration = path.node.declaration;
          replaceName(declaration);
        }
      },

      // 处理函数组件
      BlockStatement(path) {
        if (self.comType === FUNCTION) {
          // 取参数名称
          let propsName = '';

          // 是否是高阶组件
          let isHoc = false;
          // 是否是非正常函数组件
          let isAbnormal = false;

          const parentNode = path.parentPath.node;

          const body = path.node.body;

          // 判断是否是高阶组件
          body.some((nd) => {
            if (nd.type === 'ClassDeclaration') {
              isHoc = true;
              return true;
            }
            if (nd.type === 'ReturnStatement') {
              if (nd.argument && nd.argument.type === 'ClassExpression') {
                isHoc = true;
                return true;
              }
            }
          });

          // 判断函数组件最终返回的是否是一个组件, 防止一些正常的方法所在文件被定义成了tsx
          body.some((nd) => {
            if (nd.type === 'ReturnStatement') {
              if (nd.argument && nd.argument.type !== 'JSXElement') {
                isAbnormal = true;
              }
            }
          });

          const insertCode = (node) => {
            if (node.params && node.params.length) {
              // 解构写法
              if (node.params[0].type === 'ObjectPattern') {
                propsName = '';
                console.log(
                  'warning: ',
                  `函数组件${self.comName}第一个参数不是字符串写法，暂不支持why-you-did-update功能!`
                );
              }
              {
                propsName = node.params[0].name;
              }
            }

            !isHoc &&
              !isAbnormal &&
              path.insertBefore(
                t.callExpression(t.identifier('useReactDevLogger'), [
                  t.StringLiteral(self.comName || ''),
                  t.identifier(propsName || ''),
                ])
              );
            path.stop();
          };

          if (
            self.writing === EXPORTDEFAULTFUNCTION ||
            self.writing === NORMALFUNCTION
          ) {
            if (
              parentNode &&
              parentNode.id &&
              parentNode.id.name === self.comName
            ) {
              insertCode(parentNode);
            }
          } else if (self.writing === ARROWFUNCTION) {
            const grandFatherNode = path.parentPath.parentPath.node;
            if (
              grandFatherNode &&
              grandFatherNode.id &&
              grandFatherNode.id.name === self.comName
            ) {
              insertCode(parentNode);
            }
          }
        }
      },
      ImportDefaultSpecifier(path) {
        if (path.parentPath.node.source.value === 'react') {
          const parentNode = path.parentPath.node;
          const specifiers = parentNode.specifiers;
          // 没有导入useEffect
          if (
            !specifiers.some(
              (specifier) =>
                specifier.imported && specifier.imported.name === 'useEffect'
            )
          ) {
            // local是最终我们用的那个，imported是导入的那个
            // import { a as A } from 'xxx'; a 就是 imported, A 是 local
            path.insertAfter(
              t.importSpecifier(
                t.identifier('useEffect'),
                t.identifier('useEffect')
              )
            );
          }

          // 没有导入useRef
          if (
            !specifiers.some(
              (specifier) =>
                specifier.imported && specifier.imported.name === 'useRef'
            )
          ) {
            path.insertAfter(
              t.importSpecifier(t.identifier('useRef'), t.identifier('useRef'))
            );
          }
        }
      },
    });

    const output = generate(astObj).code;

    return loggerStr + output;
  }
}
module.exports = ReactDev;
