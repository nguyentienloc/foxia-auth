// core/open-telemetry/services/otel-collector.service.ts
import { Injectable } from '@nestjs/common';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
@Injectable()
export class OtelCollectorService {
  private sdk: NodeSDK;

  constructor(serviceName: string) {
    if (process.env.DEBUG) {
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    }
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });

    // Cấu hình trace exporter
    const traceExporter = new OTLPTraceExporter({
      url:
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
        'http://localhost:4318/v1/traces',
      headers: {},
      timeoutMillis: 15000,
    });

    const spanProcessor = new BatchSpanProcessor(traceExporter, {
      maxQueueSize: 1000,
      scheduledDelayMillis: 5000,
    });
    this.sdk = new NodeSDK({
      resource,
      spanProcessor,
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new NestInstrumentation(),
      ],
    });
  }

  async start() {
    try {
      await this.sdk.start();
      console.log('OpenTelemetry Collector initialized');
    } catch (error) {
      console.error('Error initializing OpenTelemetry:', error);
    }
  }

  async shutdown() {
    try {
      await this.sdk.shutdown();
      console.log('OpenTelemetry Collector shut down');
    } catch (error) {
      console.error('Error shutting down OpenTelemetry:', error);
    }
  }
}
