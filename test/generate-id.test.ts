import test from 'tape';
import { generateId } from '../src/generate-id';

test('generate-id test length', t => {
  t.plan(1);
  const bytes = 1024;
  const id = generateId(bytes);
  t.equal(id.length, bytes * 2, 'each byte is represented as 2 chars');
});
