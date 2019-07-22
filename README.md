# @zeit/tracing-js 

[![npm](https://badgen.net/npm/v/@zeit/tracing-js)](https://www.npmjs.com/package/@zeit/tracing-js) [![install size](https://badgen.net/packagephobia/install/@zeit/tracing-js)](https://packagephobia.now.sh/result?p=@zeit/tracing-js) [![circleci](https://badgen.net/circleci/github/zeit/tracing-js)](https://circleci.com/gh/zeit/workflows/tracing-js)

A partial implementation of the [OpenTracing JavaScript API](https://opentracing-javascript.surge.sh) for [honeycomb.io](https://www.honeycomb.io) backend.

[![homecomb-ui](https://user-images.githubusercontent.com/229881/53371218-a1a09000-391d-11e9-9956-8ee2b5d62a0f.png)](https://ui.honeycomb.io)

## Getting Started

The minimum code you need to get started is the following:

```ts
import { Tracer } from '@zeit/tracing-js';
const tracer = new Tracer({ serviceName }, { writeKey, dataset });
const span = tracer.startSpan(spanName);
functionToTrace();
span.finish();
```

## Connecting Traces Across Multiple Services

You can set a parent trace, even if you don't have a reference to the `Span` object.

Instead, you can create a new `SpanContext`.

You'll need the `traceId` and `parentSpanId` (typically found in `req.headers`).

```ts
const spanContext = new SpanContext(traceId, parentSpanId);
const childSpan = tracer.startSpan('child', { childOf: spanContext });
// ...do work here, call function, etc
childSpan.finish();
```

But a better solution is to use the `setupHttpTracing` helper function like the following:

```ts
async function handler(req: IncomingMessage, res: ServerResponse) {
  const spanContext = setupHttpTracing({ tracer, req, res });
  const fetch = setupFetchTracing({ spanContext });
  await sleep(100, spanContext);
  const output = await fetch(upstreamUrl);
  res.write(output);
}
```

## Advanced Usage

This is the canonical usage in most API services with a couple of example child functions we can trace called `sleep` and `route`.

We take advantage of the `SpanContext` of the parent span when creating a child span.

We also use a `DeterministicSampler` so that all services will use the same sample rate because one trace might have multiple services and we don't want to lose part of a trace due to sampling.

```ts
import micro from 'micro';
import { Tracer, SpanContext, DeterministicSampler } from '@zeit/tracing-js';

const tracer = new Tracer(
  {
    serviceName: 'my-first-service',
    environment: process.env.ENVIRONMENT,
    dc: process.env.DC,
    podName: process.env.POD_NAME,
    nodeName: process.env.NODE_NAME,
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
  await sleep(200, span.context());

  if (!path || path === '/') {
    span.finish();
    return 'Home page';
  } else if (path === '/next') {
    span.finish();
    return 'Next page';
  } else {
    span.finish();
    throw new Error('Page not found');
  }
}

// example parent function we wish to trace
async function handler(req: IncomingMessage, res: ServerResponse) {
  const span = tracer.startSpan(handler.name);
  const spanContext = span.context();
  await sleep(100, spanContext);
  const output = await route(req.url, spanContext);
  res.end(output);
  span.finish();
}

micro(handler).listen(3000);
```

See a complete example of multi-service tracing in the [examples](https://github.com/zeit/tracing-js/tree/master/examples) directory.
