import test from 'tape';
import { setupFetchTracing } from '../src/setup-fetch';
import { SpanContext } from '../src/span-context';
import * as Tags from '../src/tags';
import * as Hdrs from '../src/headers';
import { RequestInit, Headers } from 'node-fetch';

test('setup-fetch test empty fetch', t => {
  t.plan(1);
  const spanContext = new SpanContext('trace-id', 'span-id', {});
  const fetch = setupFetchTracing({ spanContext });
  t.equal(typeof fetch, 'function');
});

test('setup-fetch test fetch properties', t => {
  t.plan(1);
  const spanContext = new SpanContext('trace-id', 'span-id', {});
  const oldFetch = (_: string) => {};
  oldFetch.dummy = true;
  const newFetch = setupFetchTracing({ spanContext, fetch: oldFetch });
  t.equal(newFetch.dummy, oldFetch.dummy);
});

test('setup-fetch test fetch response', async t => {
  t.plan(1);
  const spanContext = new SpanContext('trace-id', 'span-id', {});
  const oldFetch = (_: string) => {
    return 'hello';
  };
  const newFetch = setupFetchTracing({ spanContext, fetch: oldFetch });
  const oldResponse = await oldFetch('fake-url');
  const newResponse = await newFetch('fake-url');
  t.equal(newResponse, oldResponse);
});

test('setup-fetch test fetch headers when empty', async t => {
  t.plan(3);
  const spanContext = new SpanContext('trace-id', 'span-id', {
    [Tags.SAMPLING_PRIORITY]: 99,
  });
  const oldFetch = (_: string, opts?: RequestInit) => {
    if (opts && opts.headers) {
      const headers =
        opts.headers instanceof Headers
          ? opts.headers
          : new Headers(opts.headers as any);
      t.equal(headers.get(Hdrs.TRACE_ID), 'trace-id');
      t.equal(headers.get(Hdrs.PARENT_ID), 'span-id');
      t.equal(headers.get(Hdrs.PRIORITY), '99');
    }
    return 'hello';
  };
  const newFetch = setupFetchTracing({ spanContext, fetch: oldFetch });
  await newFetch('fake-url');
});

test('setup-fetch test fetch headers when non-empty', async t => {
  t.plan(4);
  const spanContext = new SpanContext('trace-id', 'span-id', {
    [Tags.SAMPLING_PRIORITY]: 99,
  });
  const oldFetch = (_: string, opts?: RequestInit) => {
    if (opts && opts.headers) {
      const headers = new Headers(opts.headers as any);
      t.equal(headers.get(Hdrs.TRACE_ID), 'trace-id');
      t.equal(headers.get(Hdrs.PARENT_ID), 'span-id');
      t.equal(headers.get(Hdrs.PRIORITY), '99');
      t.equal(headers.get('x-test-header'), 'the-value');
    }
    return 'hello';
  };
  const newFetch = setupFetchTracing({ spanContext, fetch: oldFetch });
  await newFetch('fake-url', { headers: { 'x-test-header': 'the-value' } });
});
