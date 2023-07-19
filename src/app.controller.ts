import { BadRequestException, Body, Controller, Get, Post, Query, Request, SetMetadata, UseGuards,  Param, HttpException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users/users.service';
const speakeasy = require('speakeasy');
@Controller('user')
export class AppController {
  constructor(private readonly authService: AuthService,private readonly jwtService: JwtService,private readonly usersService: UsersService) {}
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {   
    return this.authService.login(req.user);
  }
  @Post('pass_reco')
  async password_recovry(@Body() req){
    return this.authService.password_recovry(req.username);
  }
  @Post('change_password_by_recovery')
  async change_password_by_recovery(@Body() req){
    const pr= await this.authService.get_password_recovery(req.hash);
   if(this.authService.changePassword('',req.newPassword,(await pr).user_id,true)){
    await this.authService.password_recovery_done(pr.hash,pr.user_id)
    return {"status":"Ok"}
   }else{
    throw new HttpException(`you can't change password`,500);
   }

  }
  @Post('token')
  async getToken(@Request() req){
    const auth=req.header('authorization');
    if(!!auth){
      const token=auth.split(' ')[1]
       return this.authService.gettoken(req.body.refresh_token,this.jwtService.decode(token));
    }
   
  }

  @Get('pass_recovery/:hash')
  async pass_recovery(@Param() params) {
   return await this.authService.get_password_recovery(params.hash);

  }
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles',['authenticated'])
  @Get('verify_TFA')
  async verify_TFA(@Request() req) {
    const token:any=req.query.token;
    if(token==null){
      throw new BadRequestException('You do not have access to this resource');
    }

    const secret= await this.authService.getTFASecret(req.user.sub)
    let isVerified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      period:60
  });
  if (isVerified) {
     return await this.authService.TFA_is_success(req.user)
  }
  throw new BadRequestException('Token is not valid');
  
    
  }

  @Post('signup')
  signUp(@Body() body: Object){
    return this.authService.signUp(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('changepassword')
  changePassword(@Body() body: Object,@Request() Req){
    return this.authService.changePassword(body['old_password'],body['new_password'],Req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/tfa/setup')
  async setupTFA( @Query() query: { uname: string },@Request() Req) {
    try {
      let uname=(Req.user.username)?Req.user.username:query.uname
      const secret = speakeasy.generateSecret({
        length: 10,
        name: uname,
        issuer: 'eTarbia',
        period:60
    });
    var url = speakeasy.otpauthURL({
        secret: secret.base32,
        label: uname,
        issuer: 'eTarbia',
        encoding: 'base32',
        period:60
    });
    await this.authService.setupTFA(Req.user.sub,secret.base32)
    return { tempSecret:secret.base32, tfaURL: url};
    } catch (error) {
      return error.message;
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('/tfa/active')
  async activeTFA( @Query() query: {token:string },@Request() Req) {
    try {
      const secret= await this.authService.getTFASecret(Req.user.sub)
      let isVerified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: query.token,
        period:60
    });
    if (isVerified) {
      await this.authService.activeTFA(Req.user.sub)
        return await this.authService.getTokensWheneActive(Req.user)
    }
    console.log(`ERROR: TFA is verified to be wrong`);
  
    throw new BadRequestException('Invalid Auth Code, verification failed. Please verify the system Date and Time');
    } catch (error) {
      return error.message;
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('/tfa/verify')
  async verifyTFA( @Query() query: {token:string },@Request() Req) {
    try {
      const secret= await this.authService.getTFASecret(Req.user.sub)
      let isVerified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: query.token,
        period:60
    });
    if (isVerified) {
        console.log(`DEBUG: TFA is verified to be enabled`);
        return {
            "status": 200,
            "message": "Two-factor Auth is enabled successfully"
        };
    }
    console.log(`ERROR: TFA is verified to be wrong`);
  
    throw new BadRequestException('Invalid Auth Code, verification failed. Please verify the system Date and Time');
    } catch (error) {
      return error.message;
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('/tfa/disabled')
  async disabledTFA( @Query() query: {token:string },@Request() Req) {
    try {
      const secret= await this.authService.getTFASecret(Req.user.sub)
      let isVerified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: query.token,
        period:60
    });
    if (isVerified) {
       await this.authService.desabledTFA(Req.user.sub)
        return  await this.authService.getTokensWhenDisabled(Req.user)
    }
    console.log(`ERROR: TFA is verified to be wrong`);
  
    throw new BadRequestException('Invalid Auth Code, verification failed. Please verify the system Date and Time');
    } catch (error) {
      return error.message;
    }
  }
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles',['authenticated'])
  @Get('requestgold')
  async requestgold(@Request() req) {
    try {
    return await  this.usersService.requestGold(req.user)
    } catch (error) {
      
    }
  }
  @UseGuards(JwtAuthGuard)
  @SetMetadata('roles',['authenticated'])
  @Get('activegold/:code')
  async Activegold(@Request() req,@Param() params) {
    try {
      let user=req.user;
    const result= await  this.usersService.activeGold(user,params.code)
    if(result.status=="ok"){
      user.is_gold=true;
     const payload=this.usersService.FormatPayloadToken(user,true,true)
      await this.usersService.deleteSession(req.user['session_id'])
      return this.authService.create_session(payload)
    }
    
    } catch (error) {
      throw new HttpException(error.message,500);
      return error.message
    }
  }

}


