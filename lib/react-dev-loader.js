const babel = require('@babel/core');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const pluginSyntaxJSX = require('@babel/plugin-syntax-jsx');
const pluginSyntaxTypescript = require('babel-plugin-syntax-typescript');
const pluginSyntaxDecorators = require('@babel/plugin-syntax-decorators');
const t = require('@babel/types');
const loggerStr = require('./miniLogger.js');

// arrowFunction
//const a = () => {} || export const a = () => {}
//export default a;

// normalFunction
//function b() {} || export function b() {}
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
    /** 组件写法 */
    this.writing = '';
    /** 是否应该处理当前文件 */
    this.isShouldHandle = true;
  }
  generate(source, { name }) {
    let self = this;
    // 得到语法树
    let astObj = babel.parseSync(source, {
      sourceType: 'module',
      filename: name || 'temp.tsx', // 替换为组件名称
      plugins: [
        pluginSyntaxJSX,
        pluginSyntaxTypescript,
        pluginSyntaxDecorators,
      ],
    });

    traverse(astObj, {
      // Program中不能使用path.skip(), 在这里调用此方法相当于整个树节点都被跳过了
      Program(path) {
        const body = path.node.body;
        let exportDefaultNode = null;
        let variableDeclarationNodes = [];

        body.forEach((nd) => {
          switch (nd.type) {
            // 第一层有类声明, 说明是一般的类组件
            case 'ClassDeclaration':
              self.comType = CLASS;
              self.writing = NORMALCLASS;
              break;
            case 'ExportDefaultDeclaration':
              exportDefaultNode = nd;
              break;
            // export const a =
            case 'ExportNamedDeclaration':
              if (nd.declaration) {
                variableDeclarationNodes.push(nd.declaration);
              }
              break;
            // const a =
            case 'VariableDeclaration':
              variableDeclarationNodes.push(nd);
              break;
            default:
              break;
          }
        });

        if (exportDefaultNode) {
          getInfo(exportDefaultNode);
        } else {
          // 没有, 说明不是一个组件
          self.isShouldHandle = false;
          path.stop();
          return;
        }

        if (!self.comType) {
          self.comType = FUNCTION;
          self.writing = NORMALFUNCTION;
        }

        // 判断是否是箭头函数写法
        variableDeclarationNodes.some((nd) => {
          const declarations = nd.declarations;
          if (declarations && declarations.length) {
            return declarations.some((declaration) => {
              if (
                declaration.init &&
                declaration.id &&
                declaration.init.type === 'ArrowFunctionExpression' &&
                declaration.id.name === self.comName
              ) {
                self.writing = ARROWFUNCTION;
                return true;
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
                  if (nd.arguments && nd.arguments.length > 0) {
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
                self.writing =
                  self.comType === FUNCTION ? NORMALFUNCTION : NORMALCLASS;
                break;
              case 'ClassDeclaration':
                self.writing = EXPORTDEFAULTCLASS;
                self.comName = declaration.id && declaration.id.name;
                self.comType = CLASS;
                break;
              case 'FunctionDeclaration':
                self.writing = EXPORTDEFAULTFUNCTION;
                self.comName = declaration.id && declaration.id.name;
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
          return;
        }

        if (self.writing === NORMALCLASS) {
          const replaceName = (node) => {
            if (node.type === 'Identifier') {
              node.name = `withReactDevLogger(${self.comName})`;
              path.stop();
              return;
            } else {
              // 函数包裹
              if (node.arguments && node.arguments.length) {
                replaceName(node.arguments[0]);
              } else {
                // 未知的情况
                console.log('unhandled...');
                self.isShouldHandle = false;
                path.stop();
                return;
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
          const parentNode = path.parentPath && path.parentPath.node;
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

          function insertCode(node) {
            // 取参数名称
            let propsName = '';

            const body = path.node.body;

            let shouldStop = false;

            body.some((nd) => {
              /**  判断是否是高阶组件 */
              // 函数组件内有类声明
              if (nd.type === 'ClassDeclaration') {
                shouldStop = true;
                return true;
              }
              if (nd.type === 'ReturnStatement') {
                /** 判断函数组件最终返回的是否是一个组件 */
                if (
                  nd.argument &&
                  nd.argument.type !== 'JSXElement' &&
                  nd.argument.type !== 'JSXFragment'
                ) {
                  shouldStop = true;
                  return true;
                }
              }
            });

            if (shouldStop) {
              self.isShouldHandle = false;
              path.stop();
              return;
            }

            if (node.params && node.params.length) {
              // 解构写法
              if (node.params[0].type === 'ObjectPattern') {
                propsName = '';
                console.log(
                  'warning: ',
                  `Function Component ${self.comName}'s first param is not a string, the why-you-did-update feature is not supported!`
                );
              } else {
                propsName = node.params[0].name;
              }
            }

            path.insertBefore(
              t.callExpression(t.identifier('useReactDevLogger'), [
                t.StringLiteral(self.comName || ''),
                t.identifier(propsName || ''),
              ])
            );

            path.stop();
          }
        }
      },
      ImportDefaultSpecifier(path) {
        if (
          path.parentPath &&
          path.parentPath.node &&
          path.parentPath.node.source &&
          path.parentPath.node.source.value === 'react'
        ) {
          const parentNode = path.parentPath.node;
          const specifiers = parentNode.specifiers;
          let hasImportedUseEffect = false;
          let hasImportedUseRef = false;

          specifiers.forEach((specifier) => {
            // 没有导入useEffect
            if (specifier.imported && specifier.imported.name === 'useEffect') {
              hasImportedUseEffect = true;
            }
            // 没有导入useRef
            if (specifier.imported && specifier.imported.name === 'useRef') {
              hasImportedUseRef = true;
            }
          });

          // local是最终我们用的那个，imported是导入的那个
          // import { a as A } from 'xxx'; a 就是 imported, A 是 local
          !hasImportedUseEffect &&
            path.insertAfter(
              t.importSpecifier(
                t.identifier('useEffect'),
                t.identifier('useEffect')
              )
            );

          !hasImportedUseRef &&
            path.insertAfter(
              t.importSpecifier(t.identifier('useRef'), t.identifier('useRef'))
            );
        }
      },
    });

    if (this.isShouldHandle) {
      const output = generate(astObj).code;
      return loggerStr + output;
    } else {
      return source;
    }
  }
}
module.exports = ReactDev;
