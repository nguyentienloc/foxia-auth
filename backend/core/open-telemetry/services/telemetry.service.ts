import { Inject, Injectable } from '@nestjs/common';
import { Span, SpanStatusCode, trace } from '@opentelemetry/api';
import { TelemetryOptions } from '../interfaces/telemetry-options.interface';

@Injectable()
export class TelemetryService {
  constructor(
    @Inject('TELEMETRY_OPTIONS')
    private readonly options: TelemetryOptions,
  ) {}

  private getTracer() {
    return trace.getTracer(this.options.serviceName, this.options.version);
  }

  createSpan(name: string, attributes: Record<string, any> = {}) {
    const tracer = this.getTracer();

    // Thêm default attributes từ config
    const defaultAttributes = {
      'service.name': this.options.serviceName,
      'service.version': this.options.version,
      'service.environment': this.options.environment,
      ...this.options.tags,
    };

    return tracer.startSpan(name, {
      attributes: { ...defaultAttributes, ...attributes },
    });
  }

  setSpanError(span: Span, error: Error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    span.recordException(error);
  }
}
