module.exports = `
    function withReactDevLogger(WrappedComponent) {
      const name = WrappedComponent.name;
    
      return class extends WrappedComponent {
        start = 0;
    
        updateStart = 0;
    
        UNSAFE_componentWillUpdate() {
          this.updateStart = +Date.now();
          console.debug(name, 'update starting...');
        }
    
        // 开发环境下查看引起 render 的 props
        componentDidUpdate(previousProps, previousState) {
          console.debug(name, ${'`'}update costs ${'$'}{+Date.now() - this.updateStart}ms${'`'});
    
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
              console.debug(name, 'why-did-you-update', changesObj);
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
    
          console.debug(name, 'didMount');
          console.debug(name, ${'`'}render costs ${'$'}{+Date.now() - this.start}ms${'`'});
        }
        componentWillUnmount() {
          if (super.componentWillUnmount) {
            super.componentWillUnmount();
          }
    
          console.debug(name, 'unMount');
          this.logger = null;
        }
    
        componentDidHide() {
          // @ts-ignore
          if (super.componentDidHide) {
            // @ts-ignore
            super.componentDidHide();
            console.debug(name, 'didHide');
          }
        }
    
        componentDidShow() {
          // @ts-ignore
          if (super.componentDidShow) {
            // @ts-ignore
            super.componentDidShow();
            console.debug(name, 'didShow');
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
        console.debug(name, 'didMount');
        return () => {
          console.debug(name, 'unMount');
        };
      }, []);
    
      const previousProps = React.useRef({});
    
      useEffect(() => {
        console.debug(name, ${'`'}render costs ${'$'}{+Date.now() - start}ms${'`'});
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
            console.debug(name, '[why-did-you-update]', changesObj);
          }
        }
        previousProps.current = props;
      });
    }
    `;
