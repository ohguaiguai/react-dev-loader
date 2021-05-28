const babel = require('@babel/core');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const pluginSyntaxJSX = require('@babel/plugin-syntax-jsx');
const t = require('@babel/types');
const loggerStr = require('./logger');

class ReactDev {
  constructor(options) {
    this.options = options;
  }
  generate(source) {
    // 得到语法树
    var astObj = babel.parseSync(source, {
      sourceType: 'module',
      plugins: [pluginSyntaxJSX],
    });

    traverse(astObj, {
      Identifier(path) {
        // console.log(path.node.name);
      },
      Program(path) {},
      ImportDeclaration(path) {
        // if (
        //   !path
        //     .getAllNextSiblings()
        //     .some((nd) => nd.type === 'ImportDeclaration')
        // ) {
        //   // path.insertAfter(t.functionDeclaration(
        //   //   t.identifier('withLogger'), [t.identifier('WrappedComponent')], t.blockStatement([])
        //   // ));
        // }
      },
      // 处理类组件
      ExportDefaultDeclaration(path) {
        if (path.node.declaration.type === 'ClassDeclaration') {
          // 表明还没有处理
          const name = path.node.declaration.id.name;
          // export default class 改为 class
          path.replaceWith(path.node.declaration);
          path.insertAfter(
            t.exportDefaultDeclaration(
              t.callExpression(t.identifier('withLogger'), [t.identifier(name)])
            )
          );
        }
      },
      // 处理函数组件
      // export default function xxx() {}
      BlockStatement(path) {
        if (
          path.parentPath.type === 'FunctionDeclaration' &&
          path.parentPath.parentPath.type === 'ExportDefaultDeclaration'
        ) {
          const parentNode = path.parentPath.node;

          let props = '',
            comName = parentNode.id.name;
          if (parentNode.params && parentNode.params.length) {
            props = parentNode.params[0].name;
          }
          path.insertBefore(
            t.callExpression(t.identifier('useLogger'), [
              t.StringLiteral(comName),
              t.identifier(props),
            ])
            // t.variableDeclaration('const', [
            //   t.variableDeclarator(
            //     t.arrayPattern([t.identifier('logger')]),
            //     t.callExpression(t.identifier('useLogger'), [
            //       t.StringLiteral(''),
            //       t.identifier(props),
            //     ])
            //   ),
            // ])
          );
          path.stop();
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
