import test from 'tape';
import { Span } from '../src/span';
import { HoneyEvent } from 'libhoney';

const noop = () => {};

test('test span context', t => {
  t.plan(2);
  const serviceName = 'service name';
  const name = 'function name';
  const traceId = 'trace123';
  const event: HoneyEvent = {
    timestamp: new Date(),
    metadata: {},
    addField: noop,
    send: noop,
  };
  const span = new Span(event, serviceName, name, traceId);
  const ctx = span.context();
  t.equal(ctx.toTraceId(), traceId);
  t.notEqual(ctx.toSpanId(), '');
});

test('test span addField', t => {
  t.plan(7);
  const serviceName = 'service name';
  const name = 'function name';
  const traceId = 'trace123';
  const parentId = 'parent123';
  const event: HoneyEvent = {
    timestamp: new Date(),
    metadata: {},
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
    send: () => {
      t.true(event.timestamp > new Date(0));
    },
  };
  const span = new Span(event, serviceName, name, traceId, parentId);
  setTimeout(() => span.finish(), 50);
});
