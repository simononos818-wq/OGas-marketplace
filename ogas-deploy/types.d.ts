// types.d.ts - Override React JSX types for React Native compatibility
import 'react';

declare module 'react' {
  interface Component<P = {}, S = {}, SS = any> extends ComponentLifecycle<P, S, SS> { }
  class Component<P, S> {
    constructor(props: P);
    render(): ReactNode;
    // Add other methods as needed
  }

  // Override JSX element constructor to accept React Native components
  namespace JSX {
    interface Element extends React.JSX.Element {}
    interface IntrinsicElements {
      // Add any custom elements if needed
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

// Make React Native components compatible with React 19 JSX
declare global {
  namespace React {
    // Extend JSX namespace to accept class components
    namespace JSX {
      type ElementType = 
        | string 
        | ((props: any) => ReactNode)
        | (new (props: any) => Component<any, any>)
        | ForwardRefExoticComponent<any>;
    }
  }
}