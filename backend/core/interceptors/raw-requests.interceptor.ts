import { json } from 'body-parser';
import { Buffer } from 'buffer';

export const cachedRawBodyRequestKey = 'rawBodyBuffer';

function hasFrom() {
  return Buffer.hasOwnProperty('from') && typeof Buffer.from === 'function';
}

function cloneBuffer(buf: any) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('Can only clone Buffer.');
  }

  if (hasFrom()) {
    return Buffer.from(buf);
  }

  const copy = new Buffer(buf.length);
  buf.copy(copy);
  return copy;
}

export const cacheRawBodyOnRequest = json({
  verify: (req: any, res, buf, encoding) => {
    if (Buffer.isBuffer(buf)) {
      req[cachedRawBodyRequestKey] = cloneBuffer(buf);
    }
    return true;
  },
});
