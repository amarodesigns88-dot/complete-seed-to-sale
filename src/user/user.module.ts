import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module'; // adjust path as needed

@Module({
  imports: [PrismaModule], // PrismaService is usually provided here
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService], // export if used outside this module
})
export class UserModule {}