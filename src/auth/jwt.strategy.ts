// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
    });
  }

  async validate(payload: any) {
    const userId = payload.sub;
    if (!userId) return null;

    const user: any = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: true,
        parentLocation: true,
      },
    });

    if (!user) return null;

    const permissions =
      (user.permissions || []).map((p: any) => {
        const modules = Array.isArray(p.modules) ? p.modules : (p.modules ? JSON.parse(p.modules as any) : []);
        return {
          locationId: p.locationId,
          modules,
        };
      });

    return {
      userId: user.id,
      role: user.role,
      parentLocationId: user.parentLocationId,
      name: user.name,
      email: user.email,
      permissions,
    };
  }
}