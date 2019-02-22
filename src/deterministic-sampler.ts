import { createHash } from 'crypto';
// TODO: add browser support with Web Crypto
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest

const MAX_UINT32 = Math.pow(2, 32) - 1;

export class DeterministicSampler {
  private upperBound: number;
  constructor(sampleRate: number) {
    this.upperBound = (MAX_UINT32 / sampleRate) >>> 0;
  }

  sample(data: string) {
    let sum = createHash('SHA1')
      .update(data)
      .digest();
    return sum.readUInt32BE(0) <= this.upperBound;
  }
}
