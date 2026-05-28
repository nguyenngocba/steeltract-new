import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common'

@Injectable()
export class RolesGuard
  implements CanActivate
{

  canActivate(
    context: ExecutionContext,
  ): boolean {

    const request =
      context
        .switchToHttp()
        .getRequest()

    request.user = {

      username:
        'admin',

      role:
        'SUPER_ADMIN',
    }

    return true
  }
}
