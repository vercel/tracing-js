import {
  TracerOptions,
  TracerHoneyOptions,
  SpanOptions,
  SamplerBase,
} from './shared';
import { Span } from './span';
import { SpanContext } from './span-context';
import { SAMPLING_PRIORITY } from './tags';
import Libhoney from 'libhoney';
import { DeterministicSampler } from './deterministic-sampler';

export class Tracer {
  private honey: Libhoney;
  private serviceName: string;
  private sampler: SamplerBase;

  constructor(tracerOptions: TracerOptions, honeyOptions: TracerHoneyOptions) {
    this.serviceName = tracerOptions.serviceName;
    this.sampler = tracerOptions.sampler || new DeterministicSampler(1);
    if (honeyOptions instanceof Libhoney) {
      this.honey = honeyOptions;
    } else {
      this.honey = new Libhoney(honeyOptions);
    }
  }
  startSpan(name: string, spanOptions: SpanOptions = {}) {
    const { childOf, tags = {} } = spanOptions;
    let traceId: string | undefined;
    let parentId: string | undefined;
    let samplingPriority: number | undefined;

    if (childOf instanceof Span) {
      const ctx = childOf.context();
      traceId = ctx.toTraceId();
      parentId = ctx.toSpanId();
      samplingPriority = ctx.getTag(SAMPLING_PRIORITY);
    } else if (childOf instanceof SpanContext) {
      traceId = childOf.toTraceId();
      parentId = childOf.toSpanId();
      samplingPriority = childOf.getTag(SAMPLING_PRIORITY);
    } else if (childOf) {
      throw new Error('Expected `childOf` to be Span or SpanContext');
    }

    // If the parent has a sampling priority, copy value to the child
    if (typeof samplingPriority !== 'undefined') {
      tags[SAMPLING_PRIORITY] = samplingPriority;
    }

    return new Span(
      this.honey.newEvent(),
      this.serviceName,
      name,
      traceId,
      parentId,
      tags,
      this.sampler,
    );
  }
}
