import { SpanContext } from './span-context';
import * as Tags from './tags';
import * as Hdrs from './headers';
import { Request, RequestInit, Headers } from 'node-fetch';
type Fetch = (url: string | Request, opts?: RequestInit) => void;

interface SetupFetchTracingOptions<T> {
  spanContext: SpanContext;
  fetch?: T;
}

export function setupFetchTracing<T>(options: SetupFetchTracingOptions<T>): T {
  const { fetch, spanContext } = options;
  let fetchOriginal: Fetch;
  if (fetch) {
    fetchOriginal = (fetch as unknown) as Fetch;
  } else {
    fetchOriginal = require('node-fetch');
  }

  const fetchTracing = (url: string | Request, opts?: RequestInit) => {
    if (!opts) {
      opts = { headers: new Headers() };
    }
    const headers = new Headers(opts.headers as any);
    opts.headers = headers;

    const traceId = spanContext.toTraceId();
    const parentId = spanContext.toSpanId();
    const priority = spanContext.getTag(Tags.SAMPLING_PRIORITY);

    headers.set(Hdrs.TRACE_ID, traceId);
    if (typeof parentId !== 'undefined') {
      headers.set(Hdrs.PARENT_ID, parentId);
    }
    if (typeof priority !== 'undefined') {
      headers.set(Hdrs.PRIORITY, priority);
    }

    return fetchOriginal(url, opts);
  };

  // TS doesn't know about decorated runtime data
  // so we copy from the original just to be safe.
  for (const key of Object.keys(fetchOriginal)) {
    const tracing = fetchTracing as any;
    const original = fetchOriginal as any;
    tracing[key] = original[key];
  }

  fetchTracing.default = fetchTracing;

  return (fetchTracing as unknown) as T;
}
