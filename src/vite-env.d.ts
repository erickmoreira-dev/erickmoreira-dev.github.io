/// <reference types="vite/client" />

declare module '*.jsx' {
  import React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module '*.styl' {
  const content: any;
  export default content;
}

declare module 'howler' {
  export class Howl {
    constructor(options: any);
    play(): void;
  }
  
  export class Howler {
    static volume(volume: number): void;
  }
}
