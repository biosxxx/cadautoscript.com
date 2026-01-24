import PngDecoder from './PngDecoder.js';
import PngEncoder from './PngEncoder.js';
export { hasPngSignature } from './helpers/signature.js';
export * from './types.js';
function decodePng(data, options) {
    const decoder = new PngDecoder(data, options);
    return decoder.decode();
}
function encodePng(png, options) {
    const encoder = new PngEncoder(png, options);
    return encoder.encode();
}
function decodeApng(data, options) {
    const decoder = new PngDecoder(data, options);
    return decoder.decodeApng();
}
export { decodePng as decode, encodePng as encode, decodeApng };
export { convertIndexedToRgb } from './convertIndexedToRgb.js';
//# sourceMappingURL=index.js.map

