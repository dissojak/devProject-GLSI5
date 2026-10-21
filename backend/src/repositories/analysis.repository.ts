import type { Types } from 'mongoose';

import { Analysis, type AnalysisDocument, type AnalysisFields, type AnalysisMethods, type AnalysisVirtuals } from '../models/entities/index.js';
import { BaseRepository, type RepositoryOptions } from './base.repository.js';

export class AnalysisRepository extends BaseRepository<AnalysisFields, AnalysisMethods, AnalysisVirtuals> {
  constructor() {
    super(Analysis);
  }

  /** The most recent analysis of a project (any status). */
  async findLatestByProject(
    projectId: Types.ObjectId | string,
    options: RepositoryOptions = {},
  ): Promise<AnalysisDocument | null> {
    const query = this.model
      .findOne({ project: projectId })
      .sort({ createdAt: -1 })
      .session(options.session ?? null);
    if (options.withDeleted) {
      query.setOptions({ withDeleted: true });
    }
    return (await query.exec()) as AnalysisDocument | null;
  }

  /** All analyses of a project, newest first. */
  listByProject(projectId: Types.ObjectId | string, options: RepositoryOptions = {}): Promise<AnalysisDocument[]> {
    return this.find({ project: projectId }, { ...options, sort: { createdAt: -1 } });
  }
}
