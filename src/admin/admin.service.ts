import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UsersService } from 'src/users/users.service';

const prisma = new PrismaClient()

@Injectable()
export class AdminService {
  constructor( private usersService:UsersService ) {  }

  setUser(body: any): Promise<Object> {
      //console.log(body);
      return this.usersService.signUp(
        {username:body.username,
         password:body.password,
         email:body.email
        });

  }
  async getRoles() {
    return await prisma.role.findMany();
     
  }
  async setRole(role) {
    let {id,...rest} = role;
    return await prisma.role.upsert({
        where: { id: id },
        create: rest,
        update: rest
    });    
  }
}