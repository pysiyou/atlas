/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT?: string;
  /** Instance light palette: studio-light | playful-light | aurora-light */
  readonly VITE_THEME_LIGHT?: string;
  /** Instance dark palette: noir-studio | github */
  readonly VITE_THEME_DARK?: string;
}

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
  const value: Record<string, unknown> | unknown[];
  export default value;
}
