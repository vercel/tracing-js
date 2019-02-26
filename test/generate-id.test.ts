import test from 'tape';
import { generateId } from '../src/generate-id';

test('generate-id test', t => {
  t.plan(3);
  const id = generateId();
  t.true(typeof id === 'string');
  t.true(id.length > 5);
  t.true(id.length < 64);
});
