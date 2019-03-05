import test from 'tape';
import { setupHttpTracing } from '../src/setup-http';
import { Tracer } from '../src';
import { HttpResponse, HttpRequest } from '../src/shared';
import * as Tags from '../src/tags';
import { newDummyHoney } from './dummy-honey';

test('setup-http test trace id exists', t => {
    t.plan(1);
    const req: HttpRequest = {
      headers: {},
    };
    const res: HttpResponse = {
      statusCode: 200,
      on: () => res,
    };
    const tracer = new Tracer({ serviceName: 'service' }, newDummyHoney());
    const spanContext = setupHttpTracing({ tracer, req, res });
    const traceId = spanContext.toTraceId();
    t.equal(typeof traceId, 'string');
  });


test('setup-http test tags with success', t => {
    t.plan(6);
    const req: HttpRequest = {
      headers: {},
      method: 'POST',
      url: '/foo',
    };
    const res: HttpResponse = {
      statusCode: 200,
      on: (event: string, listener: () => void) => {
        t.equal(event, 'finish', 'expected to listen to finish event');
        t.true(!!listener, 'expected a listener');
        listener();
        return res;
      },
    };
    const tracer = new Tracer({ serviceName: 'service' }, newDummyHoney());
    const spanContext = setupHttpTracing({ tracer, req, res });
    t.equal(spanContext.getTag(Tags.HTTP_STATUS_CODE), res.statusCode);
    t.equal(spanContext.getTag(Tags.HTTP_METHOD), req.method);
    t.equal(spanContext.getTag(Tags.HTTP_URL), req.url);
    t.equal(spanContext.getTag(Tags.ERROR), undefined);
  });

  test('setup-http test tags with error', t => {
    t.plan(6);
    const req: HttpRequest = {
      headers: {},
      method: 'GET',
      url: '/notfound',
    };
    const res: HttpResponse = {
      statusCode: 404,
      on: (event: string, listener: () => void) => {
        t.equal(event, 'finish', 'expected to listen to finish event');
        t.true(!!listener, 'expected a listener');
        listener();
        return res;
      },
    };
    const tracer = new Tracer({ serviceName: 'service' }, newDummyHoney());
    const spanContext = setupHttpTracing({ tracer, req, res });
    t.equal(spanContext.getTag(Tags.HTTP_STATUS_CODE), res.statusCode);
    t.equal(spanContext.getTag(Tags.HTTP_METHOD), req.method);
    t.equal(spanContext.getTag(Tags.HTTP_URL), req.url);
    t.equal(spanContext.getTag(Tags.ERROR), true);
  });
