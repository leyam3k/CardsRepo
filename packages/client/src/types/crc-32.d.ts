declare module 'crc-32' {
  export function buf(buffer: Uint8Array, crc?: number): number;
  export function str(str: string, crc?: number): number;
}