import { Injectable, CanActivate, ExecutionContext, BadRequestException, Logger } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class FirebaseProtectionGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseProtectionGuard.name);
  private readonly suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /automated/i,
  ];

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    
    // 1. Verificar User-Agent sospechoso
    const userAgent = request.headers['user-agent'] || '';
    if (this.isSuspiciousUserAgent(userAgent)) {
      this.logger.warn(`Blocked suspicious user-agent: ${userAgent}`);
      throw new BadRequestException('Invalid request');
    }

    // 2. Verificar origen (si está configurado CORS)
    const origin = request.headers.origin;
    if (process.env.NODE_ENV === 'production' && origin) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
        this.logger.warn(`Blocked request from unauthorized origin: ${origin}`);
        throw new BadRequestException('Unauthorized origin');
      }
    }

    // 3. Verificar tamaño del token (Firebase tokens tienen un tamaño específico)
    const body = request.body;
    if (body?.firebaseToken) {
      const tokenLength = body.firebaseToken.length;
      // Firebase ID tokens suelen tener entre 800-2000 caracteres
      if (tokenLength < 50 || tokenLength > 3000) {
        this.logger.warn(`Blocked request with suspicious token length: ${tokenLength}`);
        throw new BadRequestException('Invalid token format');
      }
    }

    return true;
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    if (!userAgent || userAgent.length < 10) {
      return true; // User-Agent muy corto o vacío es sospechoso
    }

    return this.suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
} 