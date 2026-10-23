
import type { ClientSession, Types } from 'mongoose';

import {
  AuthIdentity,
} from '../models/entities/index.js';

export class AuthIdentityRepository {
  async findGithubIdentity(githubId: string) {
    return AuthIdentity.findOne({
      provider: 'github',
      providerUserId: githubId,
    }).exec();
  }

  async createGithubIdentity(
    userId: Types.ObjectId,
    githubId: string,
    session: ClientSession,
  ) {
    const [identity] = await AuthIdentity.create(
      [{
        userId,
        provider: 'github',
        providerUserId: githubId,
      }],
      { session },
    );

    if (!identity) {
      throw new Error('Identity creation failed');
    }

    return identity;
  }
}
