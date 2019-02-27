import { IncomingMessage, ServerResponse } from 'http';
import { SpanContext } from './span-context';
import * as Tags from './tags';
import * as Hdrs from './headers';
import { Tracer } from './tracer';
import { SpanOptions, SpanTags } from './shared';
import FetchTemp, { Request, RequestInit, Headers } from 'node-fetch';
type Fetch = typeof FetchTemp;

export function setupHttpTracing(
  tracer: Tracer,
  req: IncomingMessage,
  res: ServerResponse,
  fetch?: Fetch,
) {
  const spanOptions = getSpanOptions(req);
  const span = tracer.startSpan('top', spanOptions);
  const spanContext = span.context();

  res.on('finish', () => {
    const { statusCode = 200 } = res;
    span.setTag(Tags.HTTP_STATUS_CODE, statusCode);
    if (statusCode >= 400) {
      span.setTag(Tags.ERROR, true);
    }
    span.finish();
  });

  fetch = setupFetch(fetch, spanContext);

  return { spanContext, fetch };
}

function getFirstHeader(req: IncomingMessage, key: string) {
  const value = req.headers[key];
  return Array.isArray(value) ? value[0] : value;
}

function getSpanOptions(req: IncomingMessage) {
  const tags: SpanTags = {};
  tags[Tags.HTTP_METHOD] = req.method;
  tags[Tags.HTTP_URL] = req.url;

  const priority = getFirstHeader(req, Hdrs.PRIORITY);
  if (typeof priority !== 'undefined') {
    tags[Tags.SAMPLING_PRIORITY] = Number.parseInt(priority);
  }

  let childOf: SpanContext | undefined;
  const traceId = getFirstHeader(req, Hdrs.TRACE_ID);
  const parentId = getFirstHeader(req, Hdrs.PARENT_ID);
  if (traceId) {
    childOf = new SpanContext(traceId, parentId, tags);
  }

  const options: SpanOptions = { tags, childOf };
  return options;
}

function setupFetch(fetch: Fetch | undefined, spanContext: SpanContext) {
  let fetchOriginal: Fetch;
  if (fetch) {
    fetchOriginal = fetch;
  } else {
    fetchOriginal = require('node-fetch');
  }

  function fetchTracing(url: string | Request, opts?: RequestInit) {
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
  }

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
