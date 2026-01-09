import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common/decorators';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new InternalServerErrorException('User not found');
    return !data ? user : user[data];
  },
);
