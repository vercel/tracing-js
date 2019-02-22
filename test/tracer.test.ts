import test from 'tape';
import { Tracer } from '../src/tracer';
import Libhoney, { HoneyEvent, HoneyOptions } from 'libhoney';

const noop = () => {};

test('test tracer traceId', t => {
  t.plan(1);
  class DummyHoney {
    constructor(options: HoneyOptions) {
      if (options) {
      }
    }
    newEvent() {
      const event: HoneyEvent = {
        timestamp: new Date(),
        metadata: {},
        addField: noop,
        send: noop,
      };
      return event;
    }
  }
  const honey: Libhoney = new DummyHoney({
    writeKey: 'test',
    dataset: 'test',
    serviceName: 'test',
  });
  const tracer = new Tracer('service name', honey);
  const parentName = 'parent';
  const childName = 'child';
  const parentSpan = tracer.startSpan(parentName);
  const childSpan = tracer.startSpan(childName, { childOf: parentSpan });
  t.equal(parentSpan.context().toTraceId(), childSpan.context().toTraceId());
});
