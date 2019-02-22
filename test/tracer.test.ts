import test from 'tape';
import { Tracer } from '../src/tracer';
import Libhoney, { HoneyEvent, HoneyOptions } from 'libhoney';

function newDummyHoney(addField?: (key: string, value: any) => void) {
  const noop = () => {};

  class DummyHoney extends Libhoney {
    constructor(options: HoneyOptions) {
      super(options);
    }
    newEvent(): HoneyEvent {
      return {
        addField: addField || noop,
        send: noop,
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
  const tracer = new Tracer('service name', newDummyHoney());
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
  const tracer = new Tracer('service name', newDummyHoney());
  const parentSpan = tracer.startSpan('parent');
  const childSpan = tracer.startSpan('child', { childOf: parentSpan });
  t.equal(parentSpan.context().toTraceId(), childSpan.context().toTraceId());
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
  const tracer = new Tracer('service name', newDummyHoney(addField));
  const tags = { key1: 'value1', key2: 'value2' };
  const span = tracer.startSpan('hello', { tags });
  span.finish();
});
