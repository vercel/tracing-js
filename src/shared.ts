import Libhoney from 'libhoney';
import { Span } from './span';
import { SpanContext } from './span-context';
import { HoneyOptions } from 'libhoney';

export type TracerOptions = HoneyOptions | Libhoney;
export type SpanTags = { [key: string]: any };

export interface SpanOptions {
  childOf?: SpanContext | Span;
  tags?: SpanTags;
}
