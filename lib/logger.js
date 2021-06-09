module.exports = `

    const SUCCESS_COLOR = '#228B22';
    const ERROR_COLOR = '#FF0000';
    const PRIMARY_COLOR = '#1E90FF';
    const WARNING_COLOR = '#DAA520';
    const DISABLED_COLOR = '#8c8c8c';

    function withReactDevLogger(WrappedComponent) {
      const name = WrappedComponent.name;
      
      return class extends WrappedComponent {
        start = 0;
    
        updateStart = 0;

        renderCount = 0;
    
        UNSAFE_componentWillUpdate() {
          this.updateStart = +Date.now();
        }
    
        // 开发环境下查看引起 render 的 props
        componentDidUpdate(previousProps, previousState) {
          console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color: ${'$'}{PRIMARY_COLOR}; ${'`'},  ${'`'}update costs ${'$'}{+Date.now() - this.updateStart}ms${'`'});
    
          if (super.componentDidUpdate) {
            super.componentDidUpdate(previousProps, previousState);
          }
    
          if (previousProps) {
            // 获取改变前后所有的props的key值
            const allKeys = Object.keys({ ...previousProps, ...this.props });
            const changesObj = {};
            allKeys.forEach((key) => {
              // 判断改变前的值是否和当前的一致
              if (previousProps[key] !== this.props[key]) {
                changesObj[key] = {
                  from: previousProps[key],
                  to: this.props[key],
                };
              }
            });
    
            if (Object.keys(changesObj).length) {
              console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color: ${'$'}{WARNING_COLOR}; ${'`'},  'why-did-you-update', changesObj);
            }
          }
        }
    
        UNSAFE_componentWillMount() {
          if (super.componentWillMount) {
            super.componentWillMount();
          }
          this.start = +Date.now();
        }
        componentDidMount() {
          if (super.componentDidMount) {
            super.componentDidMount();
          }
          this.renderCount++;
          if (this.renderCount === 1) {
            console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color: ${'$'}{SUCCESS_COLOR}; ${'`'},  ${'`'}didMount, render costs ${'$'}{+Date.now() - this.start}ms${'`'});
          } else {
            console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color:${'$'}{ERROR_COLOR}; ${'`'},  ${'`'}didMount, render costs ${'$'}{+Date.now() - this.start}ms${'`'});
          }
        }
        componentWillUnmount() {
          if (super.componentWillUnmount) {
            super.componentWillUnmount();
          }
    
          console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color: ${'$'}{DISABLED_COLOR}; ${'`'},  'unMount');
          this.logger = null;
        }
    
        componentDidHide() {
          // @ts-ignore
          if (super.componentDidHide) {
            // @ts-ignore
            super.componentDidHide();
            console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color: ${'$'}{PRIMARY_COLOR}; ${'`'},  'didHide');
          }
        }
    
        componentDidShow() {
          // @ts-ignore
          if (super.componentDidShow) {
            // @ts-ignore
            super.componentDidShow();
            console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color: ${'$'}{PRIMARY_COLOR}; ${'`'},  'didShow');
          }
        }
        render() {
          return super.render();
        }
      };
    }
    
    function useReactDevLogger(name, props) {
      const start = +Date.now();
      name = name ? name : 'component';

      const renderCount = React.useRef(0);
      
      useEffect(() => {
        renderCount.current++;
        if (renderCount.current === 1) {
          console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color: ${'$'}{SUCCESS_COLOR}; ${'`'},  ${'`'}didMount, render costs ${'$'}{+Date.now() - start}ms${'`'});
        } else {
          console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color: ${'$'}{ERROR_COLOR}; ${'`'},  ${'`'}didMount, render costs ${'$'}{+Date.now() - start}ms${'`'});
        }
        return () => {
          console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color: ${'$'}{DISABLED_COLOR}; ${'`'},  'unMount');
        };
      }, []);
    
      const previousProps = React.useRef({});
    
      useEffect(() => {
        console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color: ${'$'}{PRIMARY_COLOR}; ${'`'},  ${'`'}update costs ${'$'}{+Date.now() - start}ms${'`'});
        if (previousProps.current) {
          const allKeys = Object.keys({ ...previousProps.current, ...props });
          const changesObj = {};
          allKeys.forEach((key) => {
            if (previousProps.current[key] !== props[key]) {
              changesObj[key] = {
                from: previousProps.current[key],
                to: props[key],
              };
            }
          });
    
          if (Object.keys(changesObj).length) {
            console.log(${'`'}%c ${'$'}{name}${'`'}, ${'`'}color: white; background-color: ${'$'}{WARNING_COLOR}; ${'`'},  '[why-did-you-update]', changesObj);
          }
        }
        previousProps.current = props;
      });
    }
    `;
