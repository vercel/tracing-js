import test from 'tape';
import { Span } from '../src/span';
import { HoneyEvent } from 'libhoney';
import { DeterministicSampler } from '../src/deterministic-sampler';
import { SAMPLING_PRIORITY } from '../src/tags';

const noop = () => {};

test('test span context', t => {
  t.plan(2);
  const serviceName = 'service name';
  const name = 'function name';
  const traceId = 'trace123';
  const parentId = undefined;
  const tags = {};
  const sampler = new DeterministicSampler(1);
  const event: HoneyEvent = {
    addField: noop,
    send: noop,
  };
  const span = new Span(
    event,
    serviceName,
    name,
    traceId,
    parentId,
    tags,
    sampler,
  );
  const ctx = span.context();
  t.equal(ctx.toTraceId(), traceId);
  t.notEqual(ctx.toSpanId(), '');
});

test('test span setTag', t => {
  t.plan(2);
  const serviceName = 'service name';
  const name = 'function name';
  const traceId = 'trace123';
  const parentId = undefined;
  const tags = {};
  const sampler = new DeterministicSampler(1);
  const event: HoneyEvent = {
    addField: (key: string, value: any) => {
      if (key === 'tag.key1') {
        t.equal(value, 'value1');
      } else if (key === 'tag.key2') {
        t.equal(value, 'value2');
      }
    },
    send: noop,
  };
  const span = new Span(
    event,
    serviceName,
    name,
    traceId,
    parentId,
    tags,
    sampler,
  );
  span
    .setTag('key1', 'value1')
    .setTag('key2', 'value2')
    .finish();
});

test('test span addTags', t => {
  t.plan(2);
  const serviceName = 'service name';
  const name = 'function name';
  const traceId = 'trace123';
  const parentId = undefined;
  const tags = {};
  const sampler = new DeterministicSampler(1);
  const event: HoneyEvent = {
    addField: (key: string, value: any) => {
      if (key === 'tag.key1') {
        t.equal(value, 'value1');
      } else if (key === 'tag.key2') {
        t.equal(value, 'value2');
      }
    },
    send: noop,
  };
  const span = new Span(
    event,
    serviceName,
    name,
    traceId,
    parentId,
    tags,
    sampler,
  );
  span.addTags({ key1: 'value1', key2: 'value2' }).finish();
});

test('test span addField', t => {
  t.plan(7);
  const serviceName = 'service name';
  const name = 'function name';
  const traceId = 'trace123';
  const parentId = 'parent123';
  const tags = {};
  const sampler = new DeterministicSampler(1);
  const event: HoneyEvent = {
    send: () => {
      t.true(event.timestamp && event.timestamp > new Date(0));
    },
    addField: (key: string, value: any) => {
      switch (key) {
        case 'duration_ms':
          t.true(0 < value && value < 100);
          break;
        case 'name':
          t.equal(value, name);
          break;
        case 'service_name':
          t.equal(value, serviceName);
          break;
        case 'trace.trace_id':
          t.equal(value, traceId);
          break;
        case 'trace.span_id':
          t.notEqual(value, '');
          break;
        case 'trace.parent_id':
          t.equal(value, parentId);
          break;
      }
    },
  };
  const span = new Span(
    event,
    serviceName,
    name,
    traceId,
    parentId,
    tags,
    sampler,
  );
  setTimeout(() => span.finish(), 50);
});

test('test span sample rate 0 should not send', t => {
  t.plan(1);
  const serviceName = 'service name';
  const name = 'function name';
  const traceId = 'trace123';
  const parentId = 'parent123';
  const event: HoneyEvent = {
    addField: noop,
    send: () => {
      t.true(false, 'should not send');
    },
  };
  const tags = {};
  const sampler = new DeterministicSampler(0);
  const span = new Span(
    event,
    serviceName,
    name,
    traceId,
    parentId,
    tags,
    sampler,
  );
  span.finish();
  t.true(true, 'finish');
});

test('test span sample rate 0, tag priority 1 should send', t => {
  t.plan(2);
  const serviceName = 'service name';
  const name = 'function name';
  const traceId = 'trace123';
  const parentId = 'parent123';
  const event: HoneyEvent = {
    addField: noop,
    send: () => {
      t.true(true, 'should send');
    },
  };
  const tags = { [SAMPLING_PRIORITY]: 1 };
  const sampler = new DeterministicSampler(0);
  const span = new Span(
    event,
    serviceName,
    name,
    traceId,
    parentId,
    tags,
    sampler,
  );
  span.finish();
  t.true(true, 'finish');
});

test('test span sample rate 1, tag priority 0 should not send', t => {
  t.plan(1);
  const serviceName = 'service name';
  const name = 'function name';
  const traceId = 'trace123';
  const parentId = 'parent123';
  const event: HoneyEvent = {
    addField: noop,
    send: () => {
      t.true(false, 'should not send');
    },
  };
  const tags = { [SAMPLING_PRIORITY]: 0 };
  const sampler = new DeterministicSampler(1);
  const span = new Span(
    event,
    serviceName,
    name,
    traceId,
    parentId,
    tags,
    sampler,
  );
  span.finish();
  t.true(true, 'finish');
});
