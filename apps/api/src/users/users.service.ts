import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  // PrismaService is injected by Nest; we never instantiate it manually.
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user:
   * - Hashes the password with bcrypt
   * - Stores only the hash in the database
   * - Returns the user object *without* the password field
   *
   * Throws:
   * - ConflictException if the email is already taken (Prisma P2002)
   */
  async createUser(email: string, name: string, password: string) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: { email, name, password: hashedPassword },
      });

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      // P2002 = Unique constraint violation (e.g., duplicate email).
      if ((error as any).code === 'P2002') {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  /**
   * Look up a user by email.
   *
   * Used mainly for login (Auth module later).
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Look up a user by primary key ID.
   */
  async findByID(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
