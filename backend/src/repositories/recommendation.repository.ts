import type { Types } from 'mongoose';

import { Recommendation, type RecommendationDocument, type RecommendationFields, type RecommendationMethods } from '../models/entities/index.js';
import { BaseRepository, type RepositoryOptions } from './base.repository.js';

export class RecommendationRepository extends BaseRepository<RecommendationFields, RecommendationMethods> {
  constructor() {
    super(Recommendation);
  }

  /** All recommendations of an analysis, newest first. */
  listByAnalysis(
    analysisId: Types.ObjectId | string,
    options: RepositoryOptions = {},
  ): Promise<RecommendationDocument[]> {
    return this.find({ analysis: analysisId }, { ...options, sort: { createdAt: -1 } });
  }
}
