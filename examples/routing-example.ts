import { IncomingMessage, ServerResponse, createServer } from 'http';
import {
  Tracer,
  SpanContext,
  DeterministicSampler,
  setupHttpTracing,
  setupFetchTracing,
} from '../src/index';

import nodeFetch from 'node-fetch';

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
    return 'Next Page';
  } else if (path === '/another') {
    span.finish();
    return 'Another Page';
  }

  span.finish();
  throw new Error('Page not found');
}

// example parent function we wish to trace
async function handler(req: IncomingMessage, res: ServerResponse) {
  const spanContext = setupHttpTracing({ tracer, req, res });
  const fetch = setupFetchTracing({ spanContext, fetch: nodeFetch });
  console.log(spanContext.toTraceId(), spanContext.toSpanId());
  let statusCode = 200;

  try {
    const { url = '/' } = req;
    await sleep(100, spanContext);
    const title = await route(url, spanContext);
    const response = await fetch('http://localhost:8080');
    const data = await response.json();
    data.title = title;
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(data));
  } catch (error) {
    statusCode = 500;
    res.write(error.message);
  }

  res.statusCode = statusCode;
  res.end();
}

createServer(handler).listen(3000);
