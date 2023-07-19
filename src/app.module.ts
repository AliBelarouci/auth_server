import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AuthService } from './auth.service';

import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';

@Module({
  imports: [
    UsersModule,    
    AdminModule,
    PassportModule,
    JwtModule.register({

      secret:    process.env.JWT_SECRET_KEY,      
      signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXIRES_IN },
      
    }),

  ],
  controllers: [AppController],
  providers: [AuthService, LocalStrategy, JwtStrategy,UsersService],
  
})
export class AppModule {}
