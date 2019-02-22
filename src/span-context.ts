export class SpanContext {
  constructor(private traceId: string, private spanId: string) {
    this.traceId = traceId;
    this.spanId = spanId;
  }
  toSpanId() {
    return this.spanId;
  }
  toTraceId() {
    return this.traceId;
  }
}
