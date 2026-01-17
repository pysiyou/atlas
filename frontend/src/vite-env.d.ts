/// <reference types="vite/client" />

declare module 'react-barcode' {
  import * as React from 'react';

  interface BarcodeProps {
    value: string;
    renderer?: 'svg' | 'canvas' | 'img';
    width?: number;
    height?: number;
    format?: string;
    displayValue?: boolean;
    fontOptions?: string;
    font?: string;
    textAlign?: string;
    textPosition?: string;
    textMargin?: number;
    fontSize?: number;
    background?: string;
    lineColor?: string;
    margin?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    className?: string;
  }

  export default class Barcode extends React.Component<BarcodeProps> {}
}

// JSON module support
declare module '*.json' {
  const value: any;
  export default value;
}
