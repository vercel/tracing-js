export const generateId = (bytes = 32) =>
  range(bytes)
    .map(getRandomByte)
    .map(toHex)
    .join('');

const range = (length: number) => Array.from({ length });

const getRandomBit = () => Math.round(Math.random());

const concatenateBits = (accumulator: number, bit: number, i: number) =>
  accumulator + (bit << i);

const getRandomByte = () =>
  range(8)
    .map(getRandomBit)
    .reduce(concatenateBits);

const toHex = (n: number) =>
  n
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
