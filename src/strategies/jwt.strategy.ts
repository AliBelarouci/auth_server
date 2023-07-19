import { Inject, Injectable,  UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaClient } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';


const prisma = new PrismaClient()

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor( @Inject(REQUEST) private request: Request,) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY
    });
  }

  async validate(payload: any ) {
    const token = this.request.headers.authorization.split(' ')[1];

  /*   const p = await prisma.session.findFirstOrThrow({
      where:{ token:token  }
    }).catch(()=>{
      throw new UnauthorizedException()
    }    
    );  */ 
    payload.token=token;
    return payload;
  }
}
 

