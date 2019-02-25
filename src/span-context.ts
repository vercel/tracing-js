import { SpanTags } from './shared';
import { generateId } from './generate-id';

export class SpanContext {
  constructor(
    private traceId: string,
    private spanId: string | undefined,
    private tags: SpanTags,
  ) {
    this.traceId = traceId;
    this.spanId = spanId || generateId();
    this.tags = tags;
  }
  toSpanId() {
    return this.spanId;
  }
  toTraceId() {
    return this.traceId;
  }
  getTag(key: string) {
    return this.tags[key];
  }
}
