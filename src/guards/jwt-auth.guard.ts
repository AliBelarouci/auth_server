import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
  
  @Injectable()
  export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
      private readonly reflector: Reflector,
      private readonly jwtservice: JwtService,
      private readonly jwtStrategy : JwtStrategy
    ){
      super();

    }
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const canactivate:any = await super.canActivate(context);

      if(canactivate){
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles',[
          context.getHandler(),
          context.getClass(),
        ]);
        if (!requiredRoles){
          return true;
        }
        const request:any = context.switchToHttp().getRequest();
        
       // const token = request.headers.authorization.split(' ')[1];
        try{
          //const decodedToken = this.jwtservice.verify(token);
          const userRoles:[string] = request.user.roles;
          return requiredRoles.some((role:any)=>userRoles?.includes(role));
        }
        catch(e:any){
            console.log('--------\n');           
            console.log(e);
            return false; 
        }
      }
      return canactivate;
    }
  
    // handleRequest(err, user, info) {
    //   // You can throw an exception based on either "info" or "err" arguments
    //   if (err || !user) {
    //     throw err || new UnauthorizedException();
    //   }
    //   return user;
    // }
  }