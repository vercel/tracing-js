import {
  Tracer,
  Tags,
  DeterministicSampler,
  SpanContext,
} from '../dist/src/index';

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

handler('req', 'res')
  .then(() => console.log('done'))
  .catch(e => console.error(e));
