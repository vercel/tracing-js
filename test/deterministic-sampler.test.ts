import test from 'tape';
import { DeterministicSampler } from '../src/deterministic-sampler';
import { generateId } from '../src/generate-id';

function testSampleRate(sampleRate: number, variancePercent: number) {
  const total = 100;
  const expected = total / sampleRate;
  const s = new DeterministicSampler(sampleRate);
  const actual = Array.from({ length: total })
    .map(() => generateId())
    .filter(id => s.sample(id)).length;
  const variance = total * variancePercent;
  const lower = expected - variance;
  const upper = expected + variance;
  return lower < actual && actual < upper;
}

test('deterministic sampler same result each time', t => {
  t.plan(1);
  const s = new DeterministicSampler(17);
  const first = s.sample('hello');
  const second = s.sample('hello');
  t.equal(first, second);
});

test('deterministic sampler allow 0%', t => {
  t.plan(1);
  const passed = testSampleRate(0, 1);
  t.false(passed);
});

test('deterministic sampler allow 100%', t => {
  t.plan(1);
  const passed = testSampleRate(1, 1);
  t.true(passed);
});

test('deterministic sampler allow 50%', t => {
  t.plan(1);
  const passed = testSampleRate(2, 0.1);
  t.true(passed, 'this test may not always pass due to random inputs');
});

test('deterministic sampler allow 25%', t => {
  t.plan(1);
  const passed = testSampleRate(4, 0.1);
  t.true(passed, 'this test may not always pass due to random inputs');
});

test('deterministic sampler allow 20%', t => {
  t.plan(1);
  const passed = testSampleRate(5, 0.1);
  t.true(passed, 'this test may not always pass due to random inputs');
});
