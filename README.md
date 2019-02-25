# <img src="https://cdn.jsdelivr.net/npm/octicons@8.4.2/build/svg/bug.svg" alt="bug" width="20" /> tracing-js 

A partial implementation of the [OpenTracing JavaScript API](https://opentracing-javascript.surge.sh) for [honeycomb.io](https://www.honeycomb.io) backend.


[![homecomb-ui](https://user-images.githubusercontent.com/229881/53273403-ed56fd80-36c1-11e9-95b5-d5277bb621ff.png)](https://ui.honeycomb.io)

## Usage

```ts
import micro from 'micro';
import { Tracer, Tags, DeterministicSampler, SpanContext } from '@zeit/tracing-js';

const tracer = new Tracer(
  {
    serviceName: 'service-name',
    sampler: new DeterministicSampler(process.env.HONEYCOMB_SAMPLERATE),
  },
  {
    writeKey: process.env.HONEYCOMB_KEY,
    dataset: process.env.HONEYCOMB_DATASET,
  },
);

// example child function we wish to trace
async function sleep(ms: number, parentSpan: any) {
  const span = tracer.startSpan(sleep.name, { childOf: parentSpan });
  return new Promise(resolve =>
    setTimeout(() => {
      span.finish();
      resolve();
    }, ms),
  );
}

// example parent function we wish to trace
async function handler(req: any, res: any) {
  const tags = {};
  if (req.headers && req.headers['x-now-trace-priority']) {
    const priority = Number.parseInt(req.headers['x-now-trace-priority']);
    tags[Tags.SAMPLING_PRIORITY] = priority;
  }

  let childOf: SpanContext | undefined;
  if (req.headers && req.headers['x-now-id']) {
    const traceId = req.headers['x-now-id'];
    const parentId = req.headers['x-now-parent-id'];
    childOf = new SpanContext(traceId, parentId, tags);
  }

  const span = tracer.startSpan(handler.name, { tags, childOf });

  await sleep(300, span);
  await sleep(300, span);

  span.finish();
}

micro(handler).listen(3000);
```

## Connecting traces across multiple services

You can set a parent trace, even if you don't have a reference to the `Span` object.

Instead, you can create a new `SpanContext`.

You'll need the `parentTraceId` and `parentSpanId` (typically found in `req.headers`).

```ts
const context = new SpanContext(parentTraceId, parentSpanId);
const childSpan = tracer.startSpan('child', { childOf: context });
// ...do stuff like normal
childSpan.finish();
```
