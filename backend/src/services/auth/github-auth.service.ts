import mongoose from 'mongoose';
import {
  ConflictError,
  UnauthorizedError,
} from '../../domain/errors/index.js';

import {type UserDocument,} from '../../models/entities/index.js';
import {  UserRepository } from '../../repositories/user.repository.js';
import { AuthIdentityRepository } from '../../repositories/auth-identity.repository.js';

import type { GithubProfile } from './github-oauth.service.js';

export class GithubAuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly identities: AuthIdentityRepository,
  ) {}

  async login(profile: GithubProfile): Promise<UserDocument> {
    const identity = await this.identities.findGithubIdentity(
      profile.githubId,
    );

    if (identity) {
      const user = await this.users.findById(
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

    const existingUser = await this.users.findByEmail(
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
      const user = await this.users.create(
        {
          name: profile.name,
          email: profile.email,
          role: 'DEVELOPER',
        },
        { session },
      );

      await this.identities.createGithubIdentity(
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
}
