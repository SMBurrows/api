/* eslint-disable no-bitwise */

const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyz';

function indexCharset(str) {
  const byCode = {};
  const byChar = {};
  const { length } = str;

  let i;
  let char;
  for (i = 0; i < length; i += 1) {
    char = str[i];
    byCode[i] = char;
    byChar[char] = i;
  }
  return { byCode, byChar, length };
}
const charset = indexCharset(CHARSET);

function encode(input) {
  const { byCode } = charset;

  let int = input;
  if (int === 0) {
    return byCode[0];
  }

  let res = '';

  const max = charset.length;
  while (int > 0) {
    res = byCode[int % max] + res;
    int = Math.floor(int / max);
  }
  return res;
}

function murmur(key, seed = 'tfinjs') {
  const remainder = key.length & 3; // key.length % 4
  const bytes = key.length - remainder;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  let h1 = seed;
  let i = 0;
  let h1b;
  let k1;

  while (i < bytes) {
    k1 = (key.charCodeAt(i) & 0xff)
      | ((key.charCodeAt((i += 1)) & 0xff) << 8)
      | ((key.charCodeAt((i += 1)) & 0xff) << 16)
      | ((key.charCodeAt((i += 1)) & 0xff) << 24);
    i += 1;

    k1 = ((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = ((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1b = ((h1 & 0xffff) * 5 + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
    h1 = (h1b & 0xffff) + 0x6b64 + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16);
  }

  k1 = 0;

  if (remainder >= 3) {
    k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
  }
  if (remainder >= 2) {
    k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
  }
  if (remainder >= 1) {
    k1 ^= key.charCodeAt(i) & 0xff;

    k1 = ((k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = ((k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= k1;
  }

  h1 ^= key.length;

  h1 ^= h1 >>> 16;
  h1 = ((h1 & 0xffff) * 0x85ebca6b
      + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16))
    & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = ((h1 & 0xffff) * 0xc2b2ae35
      + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))
    & 0xffffffff;
  h1 ^= h1 >>> 16;

  return encode(h1 >>> 0);
}

export default murmur;
