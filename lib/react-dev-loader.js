const babel = require('@babel/core');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const pluginSyntaxJSX = require('@babel/plugin-syntax-jsx');
const t = require('@babel/types');
const loggerStr = require('./logger');

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
const EXPORTDEFAULTFUNCTION = 'EXPORTDEFAULTFUNCTION';

const EXPORTDEFAULTCLASS = 'EXPORTDEFAULTCLASS';
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
  generate(source) {
    const matchArr = source.match(/\bclass\b (\w+) \bextends\b/);
    if (matchArr && matchArr.length) {
      this.comType = CLASS;
      this.comName = matchArr[1];

      if (source.test(/^\bclass\b (\w+) \bextends\b/)) {
        this.writing = NORMALCLASS;
        // source.replace(this.comName, `withReactDevLogger(${this.comName})`);
        // return;
      } else {
        this.writing = EXPORTDEFAULTCLASS;
      }
    } else {
      this.comType = FUNCTION;
    }

    // 得到语法树
    var astObj = babel.parseSync(source, {
      sourceType: 'module',
      filename: 'temp.tsx',
      plugins: [pluginSyntaxJSX],
    });

    traverse(astObj, {
      Program(path) {
        const getName = (node) => {
          const declaration = node.declaration;
          if (declaration.type === 'Identifier') {
            this.comName = declaration.name;
            return;
          } else if (
            declaration.type === 'CallExpression' &&
            declaration.arguments.length > 0
          ) {
            getName(declaration.arguments[0]);
          } else if (declaration.type === 'ClassDeclaration') {
            this.writing = EXPORTDEFAULTCLASS;
            this.comName = declaration.id.name;
          } else if (declaration.type === 'FunctionDeclaration') {
            this.writing = EXPORTDEFAULTFUNCTION;
            this.comName = declaration.id.name;
          }
        };
        const body = path.node.body;

        const exportDefaultNode = body.filter(
          (nd) => nd.type === 'ExportDefaultDeclaration'
        );
        if (exportDefaultNode) {
          getName(exportDefaultNode);
        }

        const classDeclarationNode = body.filter(
          (nd) => nd.type === 'ClassDeclaration'
        );

        if (classDeclarationNode) {
          this.comType = CLASS;
        } else {
          this.comType = FUNCTION;
        }
      },
      ExportDefaultDeclaration(path) {
        if (this.writing === EXPORTDEFAULTCLASS) {
          const name = path.node.declaration.id.name;
          path.replaceWith(path.node.declaration);
          path.insertAfter(
            t.exportDefaultDeclaration(
              t.callExpression(t.identifier('withReactDevLogger'), [
                t.identifier(name),
              ])
            )
          );
        }
        if (this.writing === ARROWFUNCTION || this.writing === NORMALFUNCTION) {
          if (path.node.declaration.type === 'Identifier') {
            this.comName = path.node.declaration.name;
          }
        }
      },

      BlockStatement(path) {
        const parentNode = path.parentPath.node;

        if (this.writing === EXPORTDEFAULTFUNCTION) {
          const parentNode = path.parentPath.node;

          let props = '',
            comName = parentNode.id.name;
          if (parentNode.params && parentNode.params.length) {
            props = parentNode.params[0].name;
          }
          path.insertBefore(
            t.callExpression(t.identifier('useReactDevLogger'), [
              t.StringLiteral(comName),
              t.identifier(props),
            ])
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
