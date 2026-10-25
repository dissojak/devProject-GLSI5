import { User, type UserDocument } from '../models/entities/index.js';

export class UserCredentialsRepository {
  async findByIdWithPassword(id: string): Promise<UserDocument | null> {
    const query = User.findById(id)
      .setOptions({ withDeleted: true })
      .select('+passwordHash');

    return await query.exec();
  }
}