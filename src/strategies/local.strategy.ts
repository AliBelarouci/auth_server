import { Injectable, UnauthorizedException,BadRequestException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from 'src/auth.service';


@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
  
    const user = await this.authService.validateUser(username, password);
    
    if(!user.validPassword){
      throw new UnauthorizedException();
    }
    if (user==null) {      
      throw new BadRequestException();
    }
    user.sub=user.id
    return user;
  }
}
