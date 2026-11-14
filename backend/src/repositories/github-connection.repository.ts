import mongoose, { type Types } from 'mongoose';

import { GithubConnection, type GithubConnectionDocument, type GithubConnectionFields, type GithubConnectionMethods, type GithubConnectionVirtuals } from '../models/entities/index.js';
import { BaseRepository, type RepositoryOptions } from './base.repository.js';

export class GithubConnectionRepository extends BaseRepository<GithubConnectionFields, GithubConnectionMethods, GithubConnectionVirtuals> {
  constructor() {
    super(GithubConnection);
  }

  findByUser(
    userId: Types.ObjectId | string,
    options: RepositoryOptions = {},
  ): Promise<GithubConnectionDocument | null> {
    return this.findOne({ user: userId }, options);
  }

  connectUser(
    key: Uint8Array,
    input: { userId: Types.ObjectId | string; login: string; token: string; scopes: string[] },
  ): Promise<GithubConnectionDocument> {
    return GithubConnection.connect(key, {
      ...input,
      userId: new mongoose.Types.ObjectId(String(input.userId)),
    });
  }

  async findByUserWithToken(
    userId: Types.ObjectId | string,
  ): Promise<GithubConnectionDocument | null> {
    return (await this.model
      .findOne({ user: userId })
      .select('+accessToken')
      .exec()) as GithubConnectionDocument | null;
  }
}
