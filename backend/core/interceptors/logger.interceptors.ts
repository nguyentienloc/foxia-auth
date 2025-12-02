import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { getCurl } from 'core/utils/CurlUtils';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { format, Logger, transports } from 'winston';
import StringUtils from '../utils/StringUtils';

const winston = require('winston');
const { combine, colorize, timestamp, prettyPrint, align, json } = format;

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private logger: Logger = winston.createLogger({
    format: combine(timestamp(), json()),
    transports: [new transports.Console()],
  });
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.logger.child({ service: serviceName, hostname: process.env.HOSTNAME });

    const originalConsole = Object.assign({}, console);

    console.log = (message?: any, ...optionalParams: any[]) => {
      originalConsole.log(message, ...optionalParams);
      const logData = {
        response: [
          ...optionalParams.map((item) => StringUtils.getString(item)),
        ],
        type: 'LOG',
      };
      try {
        this.logger.log('info', StringUtils.getString(message), logData);
      } catch (e) {}
    };

    console.error = (message?: any, ...optionalParams: any[]) => {
      originalConsole.error(message, ...optionalParams);
      const logData = {
        response: [
          StringUtils.getString(message),
          ...optionalParams.map((item) => StringUtils.getString(item)),
        ],
        type: 'LOG_ERROR',
      };
      this.logger.log({
        level: 'error',
        message: StringUtils.getString(message),
        ...logData,
      });
    };

    console.warn = (message?: any, ...optionalParams: any[]) => {
      originalConsole.warn(message, ...optionalParams);
      const logData = {
        response: [
          StringUtils.getString(message),
          ...optionalParams.map((item) => StringUtils.getString(item)),
        ],
        serviceName,
        type: 'LOG_WARN',
      };
      this.logger.log({
        level: 'warn',
        message: StringUtils.getString(message),
        ...logData,
      });
    };
  }

  intercept(context: ExecutionContext, next: CallHandler) {
    let logData;
    if (isRabbitContext(context)) {
      const body = context.switchToRpc().getData();
      const originalUrl =
        context.switchToRpc().getContext()?.fields?.exchange +
          '/' +
          context.switchToRpc().getContext()?.fields?.routingKey || '';
      logData = {
        originalUrl,
        body,
        serviceName: this.serviceName,
        method: 'RMQ',
      };
    } else {
      const req = context.switchToHttp().getRequest();
      if (!req) {
        return next.handle();
      }
      const { originalUrl, method, params, query, body, user, headers } = req;
      const ip =
        (headers || {})['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection?.socket?.remoteAddress : null);
      logData = {
        originalUrl,
        method,
        params,
        query,
        body: StringUtils.getString(body),
        userId: String(user?.id),
        serviceName: this.serviceName,
        ip,
        headers,
        curl: getCurl(req),
      };
    }

    return next.handle().pipe(
      tap((response) => {
        try {
          this.logger.log({
            level: 'info',
            message: `${logData.method} request to ${logData.originalUrl}`,
            ...logData,
            type: 'REQUEST',
          });
        } catch (e) {}
      }),
      catchError((error) => {
        this.logger.log({
          level: 'error',
          message: `${logData.method} request to ${logData.originalUrl} error`,
          ...logData,
          response: String(error.stack),
          type: 'REQUEST_ERROR',
        });
        return throwError(error);
      }),
    );
  }
}
