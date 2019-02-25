import test from 'tape';
import { Tracer } from '../src/tracer';
import Libhoney, { HoneyEvent, HoneyOptions } from 'libhoney';
import { SAMPLING_PRIORITY } from '../src/tags';

const noop = () => {};

function newDummyHoney(
  addField?: (key: string, value: any) => void,
  send?: () => void,
) {
  class DummyHoney extends Libhoney {
    constructor(options: HoneyOptions) {
      super(options);
    }
    newEvent(): HoneyEvent {
      return {
        addField: addField || noop,
        send: send || noop,
      };
    }
  }

  return new DummyHoney({
    writeKey: 'test',
    dataset: 'test',
    disabled: true,
  });
}

test('test tracer with no options', t => {
  t.plan(3);
  const tracer = new Tracer({ serviceName: 'service name' }, newDummyHoney());
  const span = tracer.startSpan('hello');
  const ctx = span.context();
  const traceId = ctx.toTraceId();
  const spanId = ctx.toSpanId();
  t.notEqual(traceId, '');
  t.notEqual(spanId, '');
  t.notEqual(traceId, spanId);
});

test('test tracer traceId is same for parent & child', t => {
  t.plan(1);
  const tracer = new Tracer({ serviceName: 'service name' }, newDummyHoney());
  const parentSpan = tracer.startSpan('parent');
  const childSpan = tracer.startSpan('child', { childOf: parentSpan });
  t.equal(parentSpan.context().toTraceId(), childSpan.context().toTraceId());
});

test('test tracer sample priority is same for parent & child', t => {
  t.plan(2);
  const tracer = new Tracer({ serviceName: 'service name' }, newDummyHoney());
  const tags = { [SAMPLING_PRIORITY]: 75 };
  const parentSpan = tracer.startSpan('parent', { tags });
  const childSpan = tracer.startSpan('child', { childOf: parentSpan });
  const parentPriority = parentSpan.context().getTag(SAMPLING_PRIORITY);
  const childPriority = childSpan.context().getTag(SAMPLING_PRIORITY);
  t.equal(parentPriority, 75);
  t.equal(childPriority, 75);
});

test('test tracer tags', t => {
  t.plan(2);
  const addField = (key: string, value: any) => {
    if (key === 'tag.key1') {
      t.equal(value, 'value1');
    } else if (key === 'tag.key2') {
      t.equal(value, 'value2');
    }
  };
  const tracer = new Tracer(
    { serviceName: 'service name' },
    newDummyHoney(addField),
  );
  const tags = { key1: 'value1', key2: 'value2' };
  const span = tracer.startSpan('hello', { tags });
  span.finish();
});
