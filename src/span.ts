import { HoneyEvent } from 'libhoney';
import { SpanContext } from './span-context';
import { generateId } from './generate-id';
import { SpanTags, TracerOptions } from './shared';
import { SAMPLING_PRIORITY } from './tags';

export class Span {
  private spanId: string;
  private event: HoneyEvent;
  private tracerOptions: TracerOptions;
  private name: string;
  private traceId: string;
  private parentId: string | undefined;
  private tags: SpanTags;
  private start: Date;

  constructor(
    event: HoneyEvent,
    tracerOptions: TracerOptions,
    name: string,
    traceId: string | undefined,
    parentId: string | undefined,
    tags: SpanTags,
  ) {
    this.spanId = generateId();
    this.event = event;
    this.tracerOptions = tracerOptions;
    this.name = name;
    this.traceId = traceId || generateId();
    this.parentId = parentId;
    this.tags = tags;
    this.start = new Date();
  }

  context() {
    return new SpanContext(this.traceId, this.spanId, this.tags);
  }

  addTags(tags: SpanTags) {
    Object.keys(tags).forEach(key => {
      this.tags[key] = tags[key];
    });
    return this;
  }

  setTag(key: string, value: any) {
    this.tags[key] = value;
    return this;
  }

  setOperationName(name: string) {
    this.name = name;
  }

  private isSendable() {
    const priority = this.tags[SAMPLING_PRIORITY];
    const { sampler } = this.tracerOptions;

    if (typeof priority === 'undefined' && sampler) {
      return sampler.sample(this.traceId);
    }

    return priority > 0;
  }

  finish() {
    if (!this.isSendable()) {
      return;
    }

    const duration = Date.now() - this.start.getTime();
    const {
      serviceName,
      environment,
      dc,
      podName,
      nodeName,
      sampler,
    } = this.tracerOptions;
    this.event.addField('duration_ms', duration);
    this.event.addField('name', this.name);
    this.event.addField('service_name', serviceName);
    this.event.addField('environment', environment);
    this.event.addField('dc', dc);
    this.event.addField('pod_name', podName);
    this.event.addField('node_name', nodeName);
    this.event.addField('trace.trace_id', this.traceId);
    this.event.addField('trace.span_id', this.spanId);
    this.event.addField('trace.parent_id', this.parentId);
    this.event.addField('sample_rate', sampler ? sampler.getRate() : undefined);
    for (const [key, value] of Object.entries(this.tags)) {
      this.event.addField('tag.' + key, value);
    }
    this.event.timestamp = this.start;
    this.event.send();
  }
}
