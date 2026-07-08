import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  classifyQueryBudget,
  QUERY_BUDGET_MS,
} from './query-budget';
import { PerformanceMetricsService } from './performance-metrics.service';

@Injectable()
export class RuntimeMetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly metrics: PerformanceMetricsService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const method = request?.method ?? 'UNKNOWN';
    const endpoint =
      request?.route?.path ??
      request?.originalUrl ??
      request?.url ??
      'unknown';
    const fullPath =
      request?.originalUrl ??
      request?.url ??
      endpoint;
    const budgetClass = classifyQueryBudget(method, fullPath);
    const budgetMs = QUERY_BUDGET_MS[budgetClass];
    const requestMetrics = this.metrics.createRequestContext({
      endpoint,
      method,
      budgetClass,
      budgetMs,
    });

    const stream = this.metrics.runWithRequest(
      requestMetrics,
      () =>
        next.handle().pipe(
          finalize(() => {
            const contentLength =
              Number(response?.getHeader?.('content-length') ?? 0) || undefined;

            this.metrics.finishRequest(requestMetrics, {
              statusCode: response?.statusCode ?? 0,
              responseSizeBytes: contentLength,
            });
          }),
        ),
    );

    return stream;
  }
}

