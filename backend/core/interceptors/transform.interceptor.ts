import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isNil } from 'lodash';
import { RawResponse } from 'core/raw/raw-response';
import {
  createRequestContext,
  getRequestContext,
} from 'core/hooks/request-context.hook';
import { Response } from 'core/interfaces';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    response.header && response.header('hostname', process.env.HOSTNAME);

    const ctxType = context.getType<string>();

    switch (ctxType) {
      case 'rmq': {
        const req = context.getArgs()[1].properties.headers;
        createRequestContext({ req }, req?.requestId);
        req.requestId = getRequestContext().requestId;
        break;
      }
      default: {
        const req = context.switchToHttp().getRequest();
        createRequestContext({ req });
        break;
      }
    }
    response.header &&
      response.header('request-id', getRequestContext().requestId);
    return next.handle().pipe(
      map((data) => {
        if (data instanceof RawResponse) {
          return data.data;
        }
        if (['graphql', 'rpc'].includes(ctxType)) {
          if (data?.constructor?.name === 'PubSubAsyncIterator') {
            return data;
          }
          return instanceToPlain(data, {
            excludeExtraneousValues: true,
          });
        }
        if (isNil(data)) {
          throw new NotFoundException();
        }
        if (
          Array.isArray(data) &&
          data.length === 2 &&
          data[0].constructor.name !== data[1].constructor.name &&
          typeof data[1] === 'number'
        ) {
          return {
            data: instanceToPlain(data[0], {
              excludeExtraneousValues: true,
              excludePrefixes: ['_'],
            }),
            count: data[1],
          };
        }
        if (data.cursor) {
          return {
            data: instanceToPlain(data.data, {
              excludeExtraneousValues: true,
            }),
            cursor: data.cursor,
          };
        }
        return {
          data: instanceToPlain(data, {
            excludeExtraneousValues: true,
          }),
        };
      }),
      catchError((err) => {
        return throwError(err);
      }),
    );
  }
}
