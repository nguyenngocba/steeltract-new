import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../core/prisma/prisma.service'

import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(
    username: string,
    password: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          username,
        },
      })

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      )
    }

    const valid =
      await bcrypt.compare(
        password,
        user.password,
      )

    if (!valid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      )
    }

    const token =
      await this.jwtService.signAsync({
        sub: user.id,
        username: user.username,
      })

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
      },
    }
  }
}
