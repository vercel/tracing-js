import Libhoney from 'libhoney';
import { Span } from './span';
import { SpanContext } from './span-context';
import { HoneyOptions } from 'libhoney';

export interface TracerOptions {
  serviceName: string;
  sampler?: SamplerBase;
}

export type TracerHoneyOptions = HoneyOptions | Libhoney;
export type SpanTags = { [key: string]: any };

export interface SpanOptions {
  childOf?: SpanContext | Span;
  tags?: SpanTags;
}

export interface SamplerBase {
  sample(data: string): boolean;
}
