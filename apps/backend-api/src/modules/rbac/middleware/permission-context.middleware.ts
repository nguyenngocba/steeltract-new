import { Injectable, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';

@Injectable()
export class PermissionContextMiddleware implements NestMiddleware {
  use(
    req: Request & {
      permissionContext?: {
        path: string;
        method: string;
      };
    },
    res: Response,
    next: NextFunction,
  ) {
    req.permissionContext = {
      path: req.path,
      method: req.method,
    };

    next();
  }
}
