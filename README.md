# <img src="https://cdn.jsdelivr.net/npm/octicons@8.4.2/build/svg/bug.svg" alt="bug" width="20" /> tracing-js 

A partial implementation of the [OpenTracing JavaScript API](https://opentracing-javascript.surge.sh) for [honeycomb.io](https://www.honeycomb.io) backend.


[![homecomb-ui](https://user-images.githubusercontent.com/229881/53273403-ed56fd80-36c1-11e9-95b5-d5277bb621ff.png)](https://ui.honeycomb.io)

## Usage

```ts
import { Tracer } from '@zeit/tracing-js';

const tracer = new Tracer('service-name', {
  writeKey: process.env.HONEYCOMB_KEY,
  dataset: process.env.HONEYCOMB_DATASET
});

// example child function we wish to trace
async function sleep(ms, parentSpan) {
    const span = tracer.startSpan(sleep.name, { childOf: parentSpan });
    return new Promise(resolve =>
        setTimeout(() => {
            span.finish();
            resolve();
        }, ms)
    );
}

// example parent function we wish to trace
async function handler(req, res) {
    const span = tracer.startSpan(handler.name);
    await sleep(300, span);
    console.log('end trace');
    span.finish();
};

handler('req', 'res')
    .then(() => console.log('done'))
    .catch(e => console.error(e));
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
