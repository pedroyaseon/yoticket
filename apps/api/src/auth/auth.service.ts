import {
  BadRequestException,
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

const BCRYPT_MAX_BYTES = 72;
const INVALID_PASSWORD_HASH =
  '$2b$12$cYsZmTfAAIzFFsVsKv8bXe4CjiUPxx8gziQbVVXTQvoWuf9pesA02';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterDto) {
    if (Buffer.byteLength(input.password, 'utf8') > BCRYPT_MAX_BYTES) {
      throw new BadRequestException('A senha deve possuir no máximo 72 bytes.');
    }
    const email = input.email.trim().toLowerCase();
    if (await this.users.findByEmail(email))
      throw new ConflictException('Este e-mail já está em uso.');
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.users.createCustomer(email, passwordHash);
    return this.issueToken(user.id, user.role, user.email);
  }

  async login(input: LoginDto) {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    const passwordWithinLimit =
      Buffer.byteLength(input.password, 'utf8') <= BCRYPT_MAX_BYTES;
    const passwordMatches = await bcrypt.compare(
      passwordWithinLimit ? input.password : '',
      user?.passwordHash ?? INVALID_PASSWORD_HASH,
    );
    if (!user || !passwordWithinLimit || !passwordMatches) {
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
