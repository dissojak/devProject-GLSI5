import { ConflictError, NotFoundError } from '../../domain/errors/index.js';
import type { AnalysisDocument, ProjectDocument } from '../../models/entities/index.js';
import type { AnalysisRepository } from '../../repositories/analysis.repository.js';
import type { ProjectRepository } from '../../repositories/project.repository.js';
import type {
  CompleteAnalysisBody,
  FailAnalysisBody,
  ListAnalysesQuery,
} from './analysis.schema.js';
import type { AnalysisTrigger } from './n8n-analysis-trigger.js';

type CompleteAnalysisInput = Parameters<AnalysisDocument['complete']>[0];

export interface AnalysisListResult {
  items: AnalysisDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

export function createAnalysisService(
  analyses: AnalysisRepository,
  projects: ProjectRepository,
  workflow: AnalysisTrigger,
) {
  async function findOwnedProject(
    userId: string,
    projectId: string,
  ): Promise<ProjectDocument> {
    const project = await projects.findByIdForOwner(projectId, userId);

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    return project;
  }

  async function findForWorkflow(analysisId: string): Promise<AnalysisDocument> {
    const analysis = await analyses.findForWorkflow(analysisId);

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    return analysis;
  }

  async function launch(userId: string, projectId: string): Promise<AnalysisDocument> {
    const project = await findOwnedProject(userId, projectId);
    const { repository } = project;

    if (!repository) {
      throw new NotFoundError('Project has no connected repository');
    }

    if (await analyses.hasActive(projectId)) {
      throw new ConflictError('An analysis is already in progress for this project');
    }

    const analysis = await analyses.request(project, userId);

    try {
      await workflow.trigger({
        analysisId: String(analysis.id),
        repository: {
          owner: repository.owner,
          name: repository.name,
          branch: repository.branch,
        },
      });
    } catch (error) {
      await analysis.fail({
        code: 'WORKFLOW_TRIGGER_FAILED',
        message:
          error instanceof Error ? error.message : 'Analysis workflow could not be started',
      });
      throw error;
    }

    return analysis;
  }

  async function list(
    userId: string,
    projectId: string,
    query: ListAnalysesQuery,
  ): Promise<AnalysisListResult> {
    await findOwnedProject(userId, projectId);
    const { items, total } = await analyses.findPage(projectId, userId, query);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pageCount: Math.ceil(total / query.limit),
      },
    };
  }

  async function get(
    userId: string,
    projectId: string,
    analysisId: string,
  ): Promise<AnalysisDocument> {
    const analysis = await analyses.findOneForOwner(analysisId, projectId, userId);

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    return analysis;
  }

  async function start(analysisId: string): Promise<AnalysisDocument> {
    const analysis = await findForWorkflow(analysisId);

    return analysis.start();
  }

  async function complete(
    analysisId: string,
    input: CompleteAnalysisBody,
  ): Promise<AnalysisDocument> {
    const analysis = await findForWorkflow(analysisId);

    return analysis.complete(input as CompleteAnalysisInput);
  }

  async function fail(analysisId: string, error: FailAnalysisBody): Promise<AnalysisDocument> {
    const analysis = await findForWorkflow(analysisId);

    return analysis.fail(error);
  }

  return { launch, list, get, start, complete, fail };
}

export type AnalysisService = ReturnType<typeof createAnalysisService>;