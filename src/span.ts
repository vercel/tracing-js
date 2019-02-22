import { HoneyEvent } from 'libhoney';
import { SpanContext } from './span-context';
import { generateId } from './generate-id';

export class Span {
  private event: HoneyEvent;
  private serviceName: string;
  private name: string;
  private traceId: string;
  private parentId: string | undefined;
  private spanId: string;
  private start: Date;
  private ctx: SpanContext;

  constructor(
    event: HoneyEvent,
    serviceName: string,
    name: string,
    traceId = generateId(),
    parentId?: string,
  ) {
    const spanId = generateId();
    this.event = event;
    this.name = name;
    this.serviceName = serviceName;
    this.traceId = traceId;
    this.spanId = spanId;
    this.parentId = parentId;
    this.start = new Date();
    console.log(
      JSON.stringify({ serviceName, name, traceId, spanId, parentId }),
    );
    this.ctx = new SpanContext(traceId, spanId);
  }
  context() {
    return this.ctx;
  }
  setTag() {
    // TODO: add metadata
  }
  log() {
    /// Timestamp→ UTC
    // duration_ms
    // meta.beeline_version
    // meta.instrumentation_count
    // meta.instrumentations
    // meta.local_hostname
    // meta.node_version
    // name
    // service_name
    // trace.parent_id
    // trace.span_id
    // trace.trace_id
  }

  finish() {
    const duration = Date.now() - this.start.getTime();
    this.event.addField('duration_ms', duration);
    this.event.addField('name', this.name);
    this.event.addField('service_name', this.serviceName);
    this.event.addField('trace.trace_id', this.traceId);
    this.event.addField('trace.span_id', this.spanId);
    this.event.addField('trace.parent_id', this.parentId);
    this.event.timestamp = this.start;
    this.event.send();
  }
}
