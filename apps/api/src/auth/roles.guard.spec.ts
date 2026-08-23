import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as jest.Mocked<Reflector>;
  const guard = new RolesGuard(reflector);

  beforeEach(() => jest.clearAllMocks());

  function context(user?: { role: Role }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  it('denies unauthenticated and unauthorized users for a protected role', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ORGANIZER]);

    expect(guard.canActivate(context())).toBe(false);
    expect(guard.canActivate(context({ role: Role.CUSTOMER }))).toBe(false);
    expect(guard.canActivate(context({ role: Role.ORGANIZER }))).toBe(true);
  });
});
