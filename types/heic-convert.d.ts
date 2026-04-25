declare module 'heic-convert' {
  interface Options {
    buffer: Uint8Array | ArrayBuffer
    format: 'JPEG' | 'PNG'
    quality?: number
  }
  function heicConvert(opts: Options): Promise<ArrayBuffer>
  export default heicConvert
}
