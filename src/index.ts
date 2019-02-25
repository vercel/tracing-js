import { Tracer } from './tracer';
import { Span as PrivateSpan } from './span';
import { SpanContext } from './span-context';
import * as Tags from './tags';
import { DeterministicSampler } from './deterministic-sampler';
import { SamplerBase } from './shared';

const Span = typeof PrivateSpan;

export { Tracer, Span, SpanContext, Tags, DeterministicSampler, SamplerBase };
