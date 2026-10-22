
import { ConflictError } from '../../domain/errors/index.js';
import { User, type UserDocument } from '../../models/entities/index.js';
import { UserRepository } from '../../repositories/user.repository.js';
import type { RegisterInput } from './register.schema.js';
import { UnauthorizedError } from '../../domain/errors/index.js';
import type { LoginInput } from './login.schema.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthServiceContract {
  register(input: RegisterInput): Promise<AuthUser>;
  login(input: LoginInput): Promise<AuthUser>;
}

function toAuthUser(user: UserDocument): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export class AuthService implements AuthServiceContract {
  constructor(
    private readonly users: UserRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthUser> {
    // Inclure les comptes désactivés :
    // leur adresse email reste réservée.
    const existing = await this.users.findByEmail(
      input.email,
      { withDeleted: true },
    );

    if (existing) {
      throw new ConflictError('Email already registered');
    }

    try {
      // Le modèle existant réalise le hashage Argon2.
      const user = await User.register({
        name: input.name,
        email: input.email,
        password: input.password,
      });

      return toAuthUser(user);
    } catch (error: unknown) {
      // Protection contre deux inscriptions simultanées.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictError('Email already registered');
      }

      throw error;
    }
  }

async login(input: LoginInput): Promise<AuthUser> {
  const user = await this.users.findForAuthentication(input.email);

  if (!user) {
    throw new UnauthorizedError(
      'Invalid email or password',
    );
  }

  // Le modèle existant refuse les comptes désactivés.
  user.assertCanAuthenticate();

  // Utilise Argon2 via user.model.ts.
  const isValid = await user.verifyPassword(input.password);

  if (!isValid) {
    throw new UnauthorizedError(
      'Invalid email or password',
    );
  }

  await user.recordLogin();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
}
