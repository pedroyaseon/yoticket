import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterDto) {
    const email = input.email.trim().toLowerCase();
    if (await this.users.findByEmail(email))
      throw new ConflictException('Este e-mail já está em uso.');
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.users.createCustomer(email, passwordHash);
    return this.issueToken(user.id, user.role, user.email);
  }

  async login(input: LoginDto) {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    return this.issueToken(user.id, user.role, user.email);
  }

  private issueToken(
    id: string,
    role: import('@prisma/client').Role,
    email: string,
  ) {
    return {
      accessToken: this.jwt.sign({ sub: id, role }),
      user: { id, email, role },
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '1h'),
    };
  }
}
