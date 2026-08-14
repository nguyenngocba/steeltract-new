import { randomUUID } from 'node:crypto';

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { ObservabilityService } from './observability.service';

@Injectable()
export class RequestObservabilityMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HttpRequest');

  constructor(private readonly observability: ObservabilityService) {}

  use(request: Request, response: Response, next: NextFunction) {
    const requestId = this.requestId(request.header('x-request-id'));
    const startedAt = performance.now();

    response.setHeader('X-Request-Id', requestId);
    response.once('finish', () => {
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
      const route = this.routeLabel(request);

      this.observability.recordHttpRequest(
        request.method,
        route,
        response.statusCode,
        durationMs,
      );
      this.logger.log(
        JSON.stringify({
          event: 'http.request.completed',
          requestId,
          method: request.method,
          route,
          statusCode: response.statusCode,
          durationMs,
          ip: request.ip,
          userAgent: request.header('user-agent') ?? null,
        }),
      );
    });

    next();
  }

  private requestId(value?: string) {
    return value && /^[A-Za-z0-9._-]{1,128}$/.test(value)
      ? value
      : randomUUID();
  }

  private routeLabel(request: Request) {
    const routePath = request.route?.path as string | undefined;
    if (routePath) return `${request.baseUrl}${routePath}` || '/';

    return request.path
      .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, ':id')
      .replace(/\b[a-z0-9]{20,}\b/gi, ':id')
      .replace(/\/\d+(?=\/|$)/g, '/:id');
  }
}
