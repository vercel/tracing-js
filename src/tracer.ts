import Libhoney from 'libhoney';
import { Span } from './span';
import { SpanContext } from './span-context';
import { HoneyOptions } from 'libhoney';

interface SpanOptions {
  childOf?: SpanContext | Span;
  tags?: object;
}

type TracerOptions = HoneyOptions | Libhoney;

export class Tracer {
  private hny: Libhoney;
  private serviceName: string;

  constructor(serviceName: string, tracerOptions: TracerOptions) {
    this.serviceName = serviceName;
    if (tracerOptions instanceof Libhoney) {
      this.hny = tracerOptions;
    } else {
      this.hny = new Libhoney(tracerOptions);
    }
  }
  startSpan(name: string, spanOptions: SpanOptions = {}) {
    const { childOf } = spanOptions;
    let traceId: string | undefined;
    let parentId: string | undefined;
    if (childOf instanceof Span) {
      traceId = childOf.context().toTraceId();
      parentId = childOf.context().toSpanId();
    } else if (childOf instanceof SpanContext) {
      traceId = childOf.toTraceId();
      parentId = childOf.toSpanId();
    } else if (childOf) {
      throw new Error('Expected `childOf` to be Span or SpanContext');
    }
    return new Span(
      this.hny.newEvent(),
      this.serviceName,
      name,
      traceId,
      parentId,
    );
  }
}
