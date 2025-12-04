import { UnauthorizedException, Injectable } from '@nestjs/common';
 import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { PassportStrategy } from "@nestjs/passport";
import { Model } from "mongoose";
 import { ExtractJwt, Strategy } from "passport-jwt";

import { User } from '../entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
 export class JwtStrategy extends PassportStrategy( Strategy ) {

    constructor(
        @InjectModel( User.name )
        private readonly userModel: Model<User>,
        // super({...})
        configService: ConfigService
        ) {
    
            super({
                secretOrKey: configService.get('JWT_SECRET'),
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            });
    }

    async validate (payload:JwtPayload):Promise<any> {
       const {id} = payload;
       const user = await this.userModel.findById({_id:id});
       if(!user)
       throw new UnauthorizedException('Token no valido')
    //    if(!user.isActive )
    //    throw new UnauthorizedException('User is inactive')
       return user;     
    }
 }

