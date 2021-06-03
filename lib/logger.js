module.exports = `
    function withReactDevLogger(WrappedComponent) {
      const name = WrappedComponent.name;
    
      return class extends WrappedComponent {
        start = 0;
    
        updateStart = 0;
    
        UNSAFE_componentWillUpdate() {
          this.updateStart = +Date.now();
          // console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  'update starting...');
        }
    
        // 开发环境下查看引起 render 的 props
        componentDidUpdate(previousProps, previousState) {
          console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  ${'`'}update costs ${'$'}{+Date.now() - this.updateStart}ms${'`'});
    
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
              console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  'why-did-you-update', changesObj);
            }
          }
        }
    
        componentWillMount() {
          if (super.componentWillMount) {
            super.componentWillMount();
          }
          this.start = +Date.now();
        }
        componentDidMount() {
          if (super.componentDidMount) {
            super.componentDidMount();
          }
    
          console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  'didMount');
          console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  ${'`'}render costs ${'$'}{+Date.now() - this.start}ms${'`'});
        }
        componentWillUnmount() {
          if (super.componentWillUnmount) {
            super.componentWillUnmount();
          }
    
          console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  'unMount');
          this.logger = null;
        }
    
        componentDidHide() {
          // @ts-ignore
          if (super.componentDidHide) {
            // @ts-ignore
            super.componentDidHide();
            console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  'didHide');
          }
        }
    
        componentDidShow() {
          // @ts-ignore
          if (super.componentDidShow) {
            // @ts-ignore
            super.componentDidShow();
            console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  'didShow');
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
    
      useEffect(() => {
        console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  'didMount');
        return () => {
          console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  'unMount');
        };
      }, []);
    
      const previousProps = React.useRef({});
    
      useEffect(() => {
        console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  ${'`'}render costs ${'$'}{+Date.now() - start}ms${'`'});
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
            console.log(${'`'}%c ${'$'}{name}${'`'}, 'color: white; background-color: #2274A5; text-align: center',  '[why-did-you-update]', changesObj);
          }
        }
        previousProps.current = props;
      });
    }
    `;
