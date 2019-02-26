import test from 'tape';
import { SpanContext } from '../src/span-context';
import { SpanTags } from '../src/shared';

test('span-context test public methods', t => {
  t.plan(3);
  const traceId = 'trace-id';
  const spanId = 'span-id';
  const tags: SpanTags = { foo: 'bar' };
  const ctx = new SpanContext(traceId, spanId, tags);
  t.equal(ctx.toTraceId(), traceId);
  t.equal(ctx.toSpanId(), spanId);
  t.equal(ctx.getTag('foo'), 'bar');
});

test('span-context test undefined parent spanId', t => {
  t.plan(3);
  const traceId = 'trace-id';
  const parentId = undefined;
  const tags: SpanTags = {};
  const ctx = new SpanContext(traceId, parentId, tags);
  t.equal(ctx.toTraceId(), traceId);
  t.equal(ctx.toSpanId(), parentId);
  t.equal(ctx.getTag('not-found'), tags['not-found']);
});
