import * as React from 'react';

export type QRCodeSVGProps = React.SVGProps<SVGSVGElement> & {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  marginSize?: number;
  bgColor?: string;
  fgColor?: string;
  title?: string;
};

export declare const QRCodeSVG: React.ForwardRefExoticComponent<
  QRCodeSVGProps & React.RefAttributes<SVGSVGElement>
>;
