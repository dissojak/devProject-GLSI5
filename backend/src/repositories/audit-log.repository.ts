import type { Types } from 'mongoose';

import { type AuditLevel } from '../domain/enums/audit.enums.js';
import { AuditLog, type AuditLogDocument, type AuditLogFields } from '../models/entities/index.js';
import { BaseRepository, type RepositoryOptions } from './base.repository.js';

export class AuditLogRepository extends BaseRepository<AuditLogFields, object> {
  constructor() {
    super(AuditLog);
  }

  /** History of one entity, newest first. */
  async listForEntity(
    entityType: string,
    entityId: Types.ObjectId | string,
    options: RepositoryOptions = {},
  ): Promise<AuditLogDocument[]> {
    const query = this.model
      .find({ 'entity.type': entityType, 'entity.id': entityId })
      .sort({ createdAt: -1 })
      .session(options.session ?? null);
    if (options.withDeleted) {
      query.setOptions({ withDeleted: true });
    }
    return (await query.exec()) as AuditLogDocument[];
  }

  /** Level listing for the admin error view (newest first). */
  async listErrors(
    levels: AuditLevel[],
    options: RepositoryOptions = {},
  ): Promise<AuditLogDocument[]> {
    const query = this.model
      .find({ level: { $in: levels } })
      .sort({ createdAt: -1 })
      .session(options.session ?? null);
    if (options.withDeleted) {
      query.setOptions({ withDeleted: true });
    }
    return (await query.exec()) as AuditLogDocument[];
  }
}
