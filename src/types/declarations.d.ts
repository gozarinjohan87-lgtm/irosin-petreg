declare module 'jsqr' {
  interface QRCodePoint {
    x: number;
    y: number;
  }
  interface QRCode {
    binaryData: number[];
    data: string;
    chunks: any[];
    version: number;
    location: {
      topRightCorner: QRCodePoint;
      topLeftCorner: QRCodePoint;
      bottomRightCorner: QRCodePoint;
      bottomLeftCorner: QRCodePoint;
      topRightFinderPattern: QRCodePoint;
      topLeftFinderPattern: QRCodePoint;
      bottomLeftFinderPattern: QRCodePoint;
      bottomRightAlignmentPattern?: QRCodePoint;
    };
  }
  function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    providedOptions?: {
      inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'both' | 'attemptBoth';
    }
  ): QRCode | null;
  export default jsQR;
}
