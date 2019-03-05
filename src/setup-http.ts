import { SpanContext } from './span-context';
import * as Tags from './tags';
import * as Hdrs from './headers';
import { Tracer } from './tracer';
import { SpanOptions, SpanTags, HttpRequest, HttpResponse } from './shared';

interface SetupHttpTracingOptions {
  name?: string;
  tracer: Tracer;
  req: HttpRequest;
  res: HttpResponse;
}

export function setupHttpTracing(options: SetupHttpTracingOptions) {
  const { name = 'setupHttpTracing', tracer, req, res } = options;
  const spanOptions = getSpanOptions(req);
  const span = tracer.startSpan(name, spanOptions);
  const spanContext = span.context();

  res.on('finish', () => {
    const { statusCode = 200 } = res;
    span.setTag(Tags.HTTP_STATUS_CODE, statusCode);
    if (statusCode >= 400) {
      span.setTag(Tags.ERROR, true);
    }
    span.finish();
  });

  return spanContext;
}

function getFirstHeader(req: HttpRequest, key: string): string | undefined {
  const value = req.headers[key];
  return Array.isArray(value) ? value[0] : value;
}

function getSpanOptions(req: HttpRequest): SpanOptions {
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

  return { tags, childOf };
}
