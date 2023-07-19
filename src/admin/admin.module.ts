import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersService } from 'src/users/users.service';
@Module({
  
  providers: [AdminService,UsersService],
  controllers:[AdminController]
})
export class AdminModule {}
