import {
     HttpException,
  Injectable,
} from "@nestjs/common";
import { PrismaClient, session,user } from "@prisma/client";
import { createHash } from "crypto";


const prisma = new PrismaClient();
export type User = any;

@Injectable()
export class UsersService {
  FormatPayloadToken(user:any,tfa_is_active,tfa_is_passed){
    return  { username: user.username, sub: user.sub,email:user.email,is_gold:user.is_gold, roles: user.roles, permissions: user.permissions, 
      tfa_is_active: tfa_is_active, tfa_is_passed: tfa_is_passed}; //,org_id:user.profile.org_id
  }
 async activeGold(user: any, code: any) {
   return await prisma.user.findFirstOrThrow({
      where:{
        id:user.sub,
        gold_code:code
      }
    }).then(async (u: any) =>{

      const now:any = new Date();
      const create_time:any = new Date(u.date_request_gold);
  
  // Calculate the difference between the two times
  const difference = now - create_time;
// Check if the difference is greater than 1 hour
    if (difference > 1000 * 60 * 60) {
      throw new HttpException('The date_request_gold value is longer than 1 hour',500);
    }
      const user= await prisma.user.updateMany({
        where:{id:u.id},
        data:{
          is_gold:true
        }
      })
      u.is_gold=true;
      
      return {'status':'ok'}
 
    })
  }
 async requestGold(user: any) {
    
    try {
      if(!user.is_gold&&!!user.email){
        const random = Math.random();
        const max=999999;
        const min=100000;
        let code=Math.floor(random * (max - min) + min)
          await  prisma.user.update({
            where:{id:user.sub},
            data:{
              date_request_gold:new Date(),
              gold_code:code.toString()
            }
          }).catch(err=>{
            throw new HttpException(err.message, 500)
          })
          return {"status":"ok"}
      }

    } catch (error) {
      
    }
  }
 async updatUserLoginTime(sub: any) {
  return await prisma.user
  .findFirst({
    where:  {id:sub}
  })
  .then(async (u: any) => {
     return await prisma.user.updateMany({
        where:{id:sub},
        data:{
          current_login_time:new Date(),
          last_login_time:u.current_login_time

        }
      })
  })
  }
  async deleteSession(session_id: any) {
    try {
       await prisma.session.delete({
      where:{id:parseInt(session_id)}
     })
    } catch (error) {
      
    }
   
  }
async  getUserBySub(sub: string) {
   return await prisma.user.findUnique({
    where:{id:sub}
   })
    
  }
  private readonly users: User[];

  constructor() { }
   formatEmail(email) {
    // Split the email address into its parts.
    const parts = email.split('@');
  
    // Get the first part of the email address.
    const username = parts[0];
  
    // Get the second part of the email address.
    const domain = parts[1];
  
    // Replace the first three characters of the username with asterisks.
    const formattedUsername = username.slice(0, 3) + '...';
  
    // Replace the first two characters of the domain with asterisks.
    const formattedDomain = domain.slice(0, 2) + '...';
  
    // Return the formatted email address.
    return `${formattedUsername}@${formattedDomain}`;
  }
  async findOne(username: string,sub:string=''): Promise<user | undefined> {
    
    return await prisma.user
      .findFirst({
        where: (sub!='')?{id:sub}:{username:username},
      })
      .then(async (u: any) => {
        const r: [{}] = await prisma.$queryRaw`
           select r.machine_name,r.id from (select * from users_in_roles where user_id=${u.id}) ur
           left join role r on r.id = ur.role_id           
        `;
        let rr = r.map((e: any) => e.machine_name);

        let role_ids: number[] = r.map((e: any) => e.id); //.join();
        let pppp: any[] = await prisma.permissions_in_roles.findMany({
          where: {
            role_id: {
              in: role_ids,
            },
          },
          include: {
            permission: true,
          },
        }).catch(err=>{
          return null
          //throw new HttpException(err.message, 500);
        });
       
        /* const p:any[] = await prisma.$queryRaw`
           select p.machine_name from (select * from permissions_in_roles where role_id in (${role_ids})) rp  
           left join permission p on p.id = rp.permission_id                      
        `; */
        let pp = pppp.map((e: any) => e.permission.machine_name);
        //TODO:: unify names machime_name == name_machine

        // let profile= await prisma.profile.findFirst({
        //   where:{
        //     user_id:u.id
        //   }
        // })

        return { ...u, roles: rr, permissions: [...new Set(pp)] }; //,profile:profile||{org_id:0}
      });
  }

  async signUp(params) {
    let usr: any = {};
    try {
      if (params.email == null) {
        params.email = params.username + "@gmail.com";
      }
      usr = await prisma.user.create({
        data: {
          username: params.username,
          password: this.hashTxt(params.password),
          email: params.email,
          group_id: 1, // must be sent and must exist in db
        },
      });
    } catch (er: any) {
      if (er.code == 'P2002') return -2;//duplicate username
    }
    return usr.id;
  }
  generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
  
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  
    return result;
  }
  hashTxt(txt2hash: string=''): string {
    if(txt2hash==''){
      txt2hash=this.generateRandomString(32);
    }
    const hash = createHash("md5");
    hash.update(txt2hash + process.env.PASSWORD_SALT);
    return hash.digest("hex");
  }

  async update_session(session_id: number, user_id: string,  refresh_token: string) {
    const data = {
      user_id: user_id,
      refresh_token: refresh_token,
    }

    let id = await prisma.session.update({
      where: { id: session_id },
      data: data
    })
    return id;
  }
  async get_session(refresh_token: string): Promise<session> {
    return await prisma.session.findFirst({
      where: { refresh_token: refresh_token },
    });
  }
 
  async delete_session_by_refresh_token(refresh_token: string): Promise<any> {

    return await prisma.session.deleteMany({
      where: { refresh_token: refresh_token },
    });
  }
 
}
