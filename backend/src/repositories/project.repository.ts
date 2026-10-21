import { type Types } from 'mongoose';

import { Project, type ProjectDocument, type ProjectFields, type ProjectMethods, type ProjectVirtuals } from '../models/entities/index.js';
import { BaseRepository, type RepositoryOptions } from './base.repository.js';

export class ProjectRepository extends BaseRepository<ProjectFields, ProjectMethods, ProjectVirtuals> {
  constructor() {
    super(Project);
  }

  findByOwner(ownerId: Types.ObjectId | string, options: RepositoryOptions = {}): Promise<ProjectDocument[]> {
    return this.find({ owner: ownerId }, { ...options, sort: { createdAt: -1 } });
  }

  findByIdForOwner(
    id: Types.ObjectId | string,
    ownerId: Types.ObjectId | string,
    options: RepositoryOptions = {},
  ): Promise<ProjectDocument | null> {
    return this.findOne({ _id: id, owner: ownerId }, options);
  }
}
