import { IncomingMessage, ServerResponse, createServer } from 'http';
import { Tracer, SpanContext, Tags, DeterministicSampler } from '../src/index';

const tracer = new Tracer(
  {
    serviceName: 'routing-example',
    environment: process.env.ENVIRONMENT,
    dc: process.env.DC,
    podName: process.env.PODNAME,
    hostName: process.env.HOSTNAME,
    sampler: new DeterministicSampler(process.env.TRACE_SAMPLE_RATE),
  },
  {
    writeKey: process.env.HONEYCOMB_KEY!,
    dataset: process.env.HONEYCOMB_DATASET!,
  },
);

// example child function we wish to trace
async function sleep(ms: number, childOf: SpanContext) {
  const span = tracer.startSpan(sleep.name, { childOf });
  return new Promise(resolve =>
    setTimeout(() => {
      span.finish();
      resolve();
    }, ms),
  );
}

// example child function we wish to trace
async function route(path: string, childOf: SpanContext) {
  const span = tracer.startSpan(route.name, { childOf });
  const spanContext = span.context();

  await sleep(200, spanContext);

  if (!path || path === '/') {
    span.finish();
    return 'Home page';
  } else if (path === '/next') {
    span.finish();
    return 'Next page';
  }

  span.finish();
  throw new Error('Page not found');
}

// example parent function we wish to trace
async function handler(req: IncomingMessage, res: ServerResponse) {
  const { tags, childOf } = parseRequest(req);
  const span = tracer.startSpan(handler.name, { tags, childOf });
  const spanContext = span.context();
  let statusCode = 200;

  try {
    const { url = '/' } = req;
    await sleep(100, spanContext);
    const output = await route(url, spanContext);
    res.write(output);
  } catch (error) {
    statusCode = 500;
    tags[Tags.ERROR] = true;
    res.write(error.message);
  }

  tags[Tags.HTTP_STATUS_CODE] = statusCode;
  res.statusCode = statusCode;
  res.end();
  span.finish();
}

function getFirstHeader(req: IncomingMessage, key: string) {
  const value = req.headers[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseRequest(req: IncomingMessage) {
  const tags: { [key: string]: any } = {};
  tags[Tags.HTTP_METHOD] = req.method;
  tags[Tags.HTTP_URL] = req.url;

  const priority = getFirstHeader(req, 'x-now-trace-priority');
  if (typeof priority !== 'undefined') {
    tags[Tags.SAMPLING_PRIORITY] = Number.parseInt(priority);
  }

  let childOf: SpanContext | undefined;
  const traceId = getFirstHeader(req, 'x-now-id');
  const parentId = getFirstHeader(req, 'x-now-parent-id');
  if (traceId) {
    childOf = new SpanContext(traceId, parentId, tags);
  }

  return { tags, childOf };
}

createServer(handler).listen(3000);
