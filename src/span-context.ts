import { SpanTags } from './shared';

export class SpanContext {
  constructor(
    private traceId: string,
    private spanId: string,
    private tags: SpanTags,
  ) {
    this.traceId = traceId;
    this.spanId = spanId;
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
