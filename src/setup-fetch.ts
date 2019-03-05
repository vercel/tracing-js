import { SpanContext } from './span-context';
import * as Tags from './tags';
import * as Hdrs from './headers';
import FetchTemp, { Request, RequestInit, Headers } from 'node-fetch';
type Fetch = typeof FetchTemp;

interface SetupFetchTracingOptions {
  spanContext: SpanContext;
  fetch?: Fetch;
}

export function setupFetchTracing(options: SetupFetchTracingOptions) {
  const { fetch, spanContext } = options;
  let fetchOriginal: Fetch;
  if (fetch) {
    fetchOriginal = fetch;
  } else {
    fetchOriginal = require('node-fetch');
  }

  const fetchTracing = (url: string | Request, opts?: RequestInit) => {
    if (!opts) {
      opts = { headers: new Headers() };
    }
    const headers =
      opts.headers instanceof Headers
        ? opts.headers
        : new Headers(opts.headers as any);

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

  fetchTracing.default = fetchTracing;
  fetchTracing.isRedirect = fetchOriginal.isRedirect;

  // TS doesn't know about decorated runtime data
  // so we copy from the original just to be safe.
  for (const key of Object.keys(fetchOriginal)) {
    const tracing = fetchTracing as any;
    const original = fetchOriginal as any;
    tracing[key] = original[key];
  }

  return fetchTracing;
}
