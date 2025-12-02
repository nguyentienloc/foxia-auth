// libs/telemetry/interceptors/telemetry.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { context, trace } from '@opentelemetry/api';
import { ServerResponse } from 'http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TelemetryService } from '../services/telemetry.service';

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TelemetryInterceptor.name);
  constructor(private readonly telemetryService: TelemetryService) {}

  intercept(
    executionContext: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const ctx = executionContext.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<ServerResponse>();
    const className = executionContext.getClass().name;
    const handlerName = executionContext.getHandler().name;
    const curlCommand = this.generateCurlCommand(request);
    const option = {
      'http.method': request.method,
      'http.url': request.url,
      'http.route': request.route?.path,
      'http.request_id': request.headers['x-request-id'],
      'http.user_agent': request.headers['user-agent'],
      'http.account_id': request.headers['x-account-id'],
      'request.curl': curlCommand,
      // Execution Context
      'context.controller': className,
      'context.handler': handlerName,
      'context.type': executionContext.getType(),
      // User Context (nếu có)
      'user.id': request.user?.id,
      'user.role': request.user?.role,
      // Client Info
      'client.ip': request.ip,
      'client.protocol': request.protocol,
    };

    const span = this.telemetryService.createSpan(
      `${className}.${handlerName}`,
      option,
    );

    const spanContext = trace.getSpan(context.active())?.spanContext();
    if (spanContext?.traceId) {
      response.setHeader('x-trace-id', spanContext.traceId);
    }
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;

          span.setAttributes({
            'response.status': response.statusCode,
            'duration.ms': duration,
          });
          span.end();
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.telemetryService.setSpanError(span, error);
          span.end();
        },
      }),
    );
  }

  private generateCurlCommand(request): string {
    try {
      const method = request.method.toUpperCase();
      // Lấy full URL từ request
      const protocol = request.headers['x-forwarded-proto'] || request.protocol;
      const host = request.headers['x-forwarded-host'] || request.get('host');
      const url = `${protocol}://${host}${request.originalUrl}`;

      // Bắt đầu với command cơ bản
      let curlCmd = [`curl -X ${method}`];

      // Thêm các headers
      const headersToExclude = [
        'host',
        'accept-encoding',
        'connection',
        'content-length',
      ];
      Object.entries(request.headers)
        .filter(([key]) => !headersToExclude.includes(key.toLowerCase()))
        .forEach(([key, value]) => {
          // Escape single quotes trong header value
          const safeValue = value.toString().replace(/'/g, "'\\''");
          curlCmd.push(`-H '${key}: ${safeValue}'`);
        });

      // Thêm URL
      curlCmd.push(`'${url}'`);

      // Thêm body data nếu có
      if (['POST', 'PUT', 'PATCH'].includes(method) && request.body) {
        try {
          const sanitizedBody = request.body;
          const jsonBody = JSON.stringify(sanitizedBody);
          // Escape single quotes trong JSON
          const safeJsonBody = jsonBody.replace(/'/g, "'\\''");
          curlCmd.push(`--data '${safeJsonBody}'`);
        } catch (e) {
          curlCmd.push('# Warning: Could not serialize request body');
        }
      }

      // Thêm các options hữu ích
      curlCmd.push('-i'); // Hiển thị response headers
      curlCmd.push('--compressed'); // Hỗ trợ compression

      return curlCmd.join(' ');
    } catch (error) {
      console.error('Error generating curl command:', error);
      return '[Unable to generate curl command]';
    }
  }
}
