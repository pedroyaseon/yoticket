import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  const users = {
    findByEmail: jest.fn(),
    createCustomer: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;
  const jwt = {
    sign: jest.fn(() => 'signed-token'),
  } as unknown as jest.Mocked<JwtService>;
  const config = {
    get: jest.fn(() => '1h'),
  } as unknown as jest.Mocked<ConfigService>;
  const service = new AuthService(users, jwt, config);

  beforeEach(() => jest.clearAllMocks());

  it('issues a JWT for valid credentials', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'customer-id',
      email: 'customer@demo.com',
      passwordHash: await bcrypt.hash('demo123', 4),
      role: Role.CUSTOMER,
    } as Awaited<ReturnType<UsersService['findByEmail']>>);

    await expect(
      service.login({ email: 'customer@demo.com', password: 'demo123' }),
    ).resolves.toMatchObject({
      accessToken: 'signed-token',
      user: { id: 'customer-id', role: Role.CUSTOMER },
    });
  });

  it('does not disclose which credential is invalid', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@demo.com', password: 'demo123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects passwords that exceed the bcrypt byte limit', async () => {
    await expect(
      service.register({
        email: 'customer@demo.com',
        password: 'á'.repeat(37),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(users.findByEmail.mock.calls).toHaveLength(0);
    expect(users.createCustomer.mock.calls).toHaveLength(0);
  });

  it('keeps an oversized login indistinguishable from invalid credentials', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@demo.com',
        password: 'á'.repeat(37),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
