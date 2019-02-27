import { IncomingMessage, ServerResponse, createServer } from 'http';
import {
  Tracer,
  SpanContext,
  DeterministicSampler,
  setupHttpTracing,
} from '../src/index';

const tracer = new Tracer(
  {
    serviceName: 'db-example',
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
async function getDocumentById(ms: number, childOf: SpanContext) {
  const span = tracer.startSpan(getDocumentById.name, { childOf });
  return new Promise(resolve =>
    setTimeout(() => {
      span.finish();
      resolve({ name: 'child', date: new Date() });
    }, ms),
  );
}

// example parent function we wish to trace
async function handler(req: IncomingMessage, res: ServerResponse) {
  const { spanContext } = setupHttpTracing(tracer, req, res);
  console.log(spanContext.toTraceId(), spanContext.toSpanId());
  let statusCode: number;
  let data: any;

  try {
    statusCode = 200;
    data = await getDocumentById(3100, spanContext);
  } catch (e) {
    statusCode = 500;
    data = { error: e.message };
  }

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.write(JSON.stringify(data));
  res.end();
}

createServer(handler).listen(8080);
