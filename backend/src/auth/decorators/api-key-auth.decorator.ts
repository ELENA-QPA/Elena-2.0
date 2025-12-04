import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiHeader } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';

export function ApiKeyAuth() {
    return applyDecorators(
        UseGuards(ApiKeyGuard),
        ApiSecurity('api-key'),
        ApiHeader({
            name: 'x-api-key',
            description: 'API Key for authentication',
            required: true,
            schema: {
                type: 'string',
                example: 'your-api-key-here'
            }
        })
    );
}