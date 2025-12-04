import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] || request.headers['api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key is required');
    }

    const validApiKey = this.configService.get<string>('apiKey');

    console.log('📨 API Key recibida:', apiKey);
    console.log('✅ API Key válida esperada:', validApiKey);
    console.log('🔍 ¿Son iguales?:', apiKey === validApiKey);

    if (!validApiKey) {
      throw new UnauthorizedException('API Key not configured');
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    return true;
  }
}
