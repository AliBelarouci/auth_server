import { Injectable, UnauthorizedException,BadRequestException,HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient, session,password_recovery } from '@prisma/client';
import { UsersService } from './users/users.service';


const prisma = new PrismaClient()

@Injectable()export class AuthService {
async password_recovery_done(hash:string,user_id:string){
  
  return await prisma.password_recovery.updateMany({
    where:{
      hash:hash,
      user_id:user_id
    },
    data:{password_recovered:true}
  })
}
async get_password_recovery(hash:string){
   let state='bad';
  try {
   
    const pr = await prisma.password_recovery.findFirstOrThrow({
      where: {
        hash: hash,
        password_recovered:false
      }
    })
    const now:any = new Date();
    const create_time:any = new Date(pr.create_time);

// Calculate the difference between the two times
const difference = now - create_time;

// Check if the difference is greater than 1 hour
if (difference > 1000 * 60 * 60) {
 state='error'
 throw new HttpException('The create_time value is longer than 1 hour',500);
} else {
  return pr
}
  } catch (error) {
    if(state=='bad')
    throw new BadRequestException();
    if(state='error')
    throw new HttpException('The create_time value is longer than 1 hour',500);
  }
}
 async password_recovry(username: string) {
  try {
    const user = await this.usersService.findOne(username);
    if(user==null){
      throw new BadRequestException()
    }
    if(user.email==null||user.email==''|| !user.email){
      throw new UnauthorizedException()
    }
const pr:any=  await prisma.password_recovery.create({
    data:{
      user_id:user.id,
      hash:this.usersService.hashTxt()
    }
  })
  // send email
  return {...pr,email:this.usersService.formatEmail(user.email)}
  } catch (error) {
    throw new BadRequestException()
  }
    
  }

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    const hpass = this.usersService.hashTxt(pass);

    if (user && user.password === hpass) {
      const { password, ...result } = user;
     const result1 = {
        ...result,
        validPassword: true,
      };
      return result1;
    }
    if(user){
      return {validPassword:false}
    }
    return null;
  }

  generate_tockens(payload: any) {
    let { iat, exp, ...rest } = payload;
    return {
      access_token: this.jwtService.sign(rest),
      refresh_token: this.jwtService.sign({ username: payload.username, sub: payload.sub ,session_id:payload.session_id,
        tfa_is_active:payload.tfa_is_active,tfa_is_passed:payload.tfa_is_passed}, { expiresIn: process.env.REFRESH_TOKEN_EXIRES_IN })
    }
  }
  async create_session(payload:any) {
    try {
          const session= await prisma.session.create({
      data: {
        user_id: payload.sub,
        refresh_token: '',
      },
    });
    payload.session_id=session.id;
    let tokens = this.generate_tockens(payload)
    await prisma.session.update({
      where:{id:session.id},
      data:{
        refresh_token:tokens.refresh_token
      }
    })
    return tokens;
    } catch (error) {
      throw new HttpException(error.message,500);
    }

  }

  async regenerate_session(session_id: string,sub:string,token:any={}) {
    const user:any= await this.usersService.findOne('',sub)
    let roles: [any] = user.roles;
    roles.push('authenticated');
    await prisma.session.delete({
     where:{id:parseInt(session_id)}
    })
     /* const payload = {username: user.username, sub: user.id,email:user.email, roles: roles, permissions: user.permissions, 
      tfa_is_active: token.tfa_is_active, tfa_is_passed: token.tfa_is_passed }; //,org_id:user.profile.org_id */
      const payload =this.usersService.FormatPayloadToken(token,token.tfa_is_active,token.tfa_is_passed)
     return this.create_session(payload);
   } 

  async login(user: any) {
    let roles: [any] = user.roles;
    roles.push('authenticated');
   /*  const payload = { username: user.username, sub: user.id,email:user.email, roles: roles,
       permissions: user.permissions, tfa_is_active: user.tfa, tfa_is_passed:  false };  *///,org_id:user.profile.org_id
       const payload = this.usersService.FormatPayloadToken(user,user.tfa,false);
    try {
      await this.usersService.updatUserLoginTime(user.id)   
    return  this.create_session(payload)
      
    } catch {
      return null;
    }
  }

  async gettoken(refresh_token: any,token:any) {
    try {
      this.jwtService.verify(refresh_token);
    } catch (er: any) {
       await this.usersService.delete_session_by_refresh_token(refresh_token)
      throw new UnauthorizedException()
    }
    const rt=this.jwtService.decode(refresh_token);
     
    return this.regenerate_session( rt['session_id'],rt['sub'],token);
  /*   const sess = await this.usersService.get_session(refresh_token);
    const token_decoded: any = this.jwtService.decode(sess.token)
    let ct = new Date().getTime()
    //TODO:: why 20000    
    if ((parseInt(token_decoded.exp) * 1000 - ct) < 20000) {
      if (sess && sess.id) {
        return this.regenerate_session(sess, this.jwtService.decode(sess.token));
      } else {
        throw new UnauthorizedException()
      }
    } else {
      return {
        refresh_token: sess.refresh_token,
        access_token: sess.token
      }
    } */



  }
  async getTFASecret(sub: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: sub }
      })
      if (user) {
        return user.secret_tfa
      }
    } catch (error) {

    }
  }
  async activeTFA(sub: string) {
    await prisma.user.update({
      where: { id: sub },
      data: {
        tfa: true,
      }
    })
  }
  async desabledTFA(sub: string) {
    await prisma.user.update({
      where: { id: sub },
      data: {
        secret_tfa: null,
        tfa: false,
      }
    })
  }
  async setupTFA(sub: string, secret: string) {
    await prisma.user.update({
      where: { id: sub },
      data: {
        secret_tfa: secret
      }
    })
  }

  async getTokensWhenDisabled(user) {
    let is_valid = true;
    const payload =this.usersService.FormatPayloadToken(user,false,false) // { username: user.username, sub: user.sub,email:user.email, roles: user.roles, permissions: user.permissions, tfa_is_active: false, tfa_is_passed: false }; //,org_id:user.profile.org_id


    try {

      // do not repeat session for logged in users     
      await this.usersService.deleteSession(user.session_id)
    return this.create_session(payload)
  
    } catch {
      return null;
    }
  }
  async getTokensWheneActive(user) {
    let is_valid = true;
    //const payload = { username: user.username, sub: user.sub,email:user.email, roles: user.roles, permissions: user.permissions, tfa_is_active: true, tfa_is_passed: true }; //,org_id:user.profile.org_id
    const payload = this.usersService.FormatPayloadToken(user,true,true)

    try {
      await this.usersService.deleteSession(user.session_id)
      return this.create_session(payload)
    
    } catch {
      return null;
    }
  }
  async TFA_is_success(user) {
   // const payload = { username: user.username, sub: user.sub,email:user.email, roles: user.roles, permissions: user.permissions, tfa_is_active: user.tfa_is_active, tfa_is_passed: true }; //,org_id:user.profile.org_id
   const payload = this.usersService.FormatPayloadToken(user,user.tfa_is_active,true)

    try {
      // do not repeat session for logged in users     
      await this.usersService.deleteSession(user.session_id)
    return this.create_session(payload)
  
    } catch {
      return null;
    }
  }
  signUp(body: Object) {
    return this.usersService.signUp(body);
  }

  async changePassword(old_password: string,new_password:string, sub: string,isRecoveryPw:boolean=false) {
    ////body: {old_password , new_password }

    const hash_old_password = this.usersService.hashTxt(old_password)
   let conditions:any= {
      id: sub,
      password: hash_old_password,
    }
    if(isRecoveryPw){
      delete conditions.password
    }
    const usr = await prisma.user.findFirst({
      where: conditions
    });
    if (usr) {
      const hash_new_password = this.usersService.hashTxt(new_password);
      await prisma.user.update({
        where: { id: sub },
        data: {
          password: hash_new_password
        }
      })
      return true;
    }
    return false
  }

}

