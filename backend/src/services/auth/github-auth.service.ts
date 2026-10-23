import mongoose from 'mongoose';
import {
  ConflictError,
  UnauthorizedError,
} from '../../domain/errors/index.js';

import type { UserDocument } from '../../models/entities/index.js';
import { UserRepository } from '../../repositories/user.repository.js';
import { AuthIdentityRepository } from '../../repositories/auth-identity.repository.js';

import type { GithubProfile } from '../../types/index.js';

/**
 * Functional service factory (docs/conventions.md, "Services"). Same rule as
 * every service: closures, dependencies as parameters, default-wired values.
 */
export function createGithubAuthService(
  users: UserRepository = new UserRepository(),
  identities: AuthIdentityRepository = new AuthIdentityRepository(),
) {
  async function login(profile: GithubProfile): Promise<UserDocument> {
    const identity = await identities.findGithubIdentity(
      profile.githubId,
    );

    if (identity) {
      const user = await users.findById(
        identity.userId,
        { withDeleted: true },
      );

      if (!user) {
        throw new UnauthorizedError('Account not found');
      }

      user.assertCanAuthenticate();

      await user.recordLogin();
      return user;
    }

    const existingUser = await users.findByEmail(
      profile.email,
      { withDeleted: true },
    );

    if (existingUser) {
      throw new ConflictError(
        'Email already registered. Sign in locally to link GitHub.',
      );
    }

    let createdUser: UserDocument | undefined;

    await mongoose.connection.transaction(async (session) => {
      const user = await users.create(
        {
          name: profile.name,
          email: profile.email,
          role: 'DEVELOPER',
        },
        { session },
      );

      await identities.createGithubIdentity(
        user._id,
        profile.githubId,
        session,
      );

      createdUser = user;
    });

    if (!createdUser) {
      throw new Error('User creation failed');
    }

    return createdUser;
  }

  return { login };
}

/**
 * Service contract, derived at its SOURCE - never redeclared elsewhere.
 */
export type GithubAuthService = ReturnType<typeof createGithubAuthService>;
