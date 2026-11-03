"use client";

import { Suspense } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MotionConfig } from "motion/react";
import { useToast } from "@/components/toast/toast-provider";
import { useGetProjectQuery, useListAnalysesQuery, useGetAnalysisQuery, useLaunchAnalysisMutation } from "@/store/analyses-api";
import type { Analysis, AnalysisListResponse } from "@/types/analysis";
import type { Project as ProjectType } from "@/types/project";

const TABS = ["overview", "analyses", "recommendations"] as const;
type Tab = (typeof TABS)[number];

function ProjectDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const tabParam = (searchParams.get("tab") ?? "overview") as Tab;
  const tab: Tab = TABS.includes(tabParam) ? tabParam : "overview";
  const analysisParam = searchParams.get("analysis");

  const [page, setPage] = useState(1);

  const projectQuery = useGetProjectQuery({ id }, { skip: !id });
  const analysesQuery = useListAnalysesQuery(
    { projectId: id, page, limit: 50 },
    { skip: !id },
  );
  const recentQuery = useListAnalysesQuery(
    { projectId: id, page: 1, limit: 4 },
    { skip: !id },
  );

  const [launchAnalysis, launchMeta] = useLaunchAnalysisMutation();

  const project = projectQuery.data?.data as ProjectType | undefined;
  const analyses = analysesQuery.data?.data ?? [];
  const pagination = analysesQuery.data?.pagination;
  const recent = recentQuery.data?.data ?? [];

  const latest = analyses[0] ?? null;
  const selectedId = analysisParam ?? latest?.id ?? null;
  const selectedAnalysis = analyses.find((a) => a.id === selectedId) ?? null;

  const [runningId, setRunningId] = useState<string | null>(null);
  const polled = usePolledAnalysis(id, runningId);

  useEffect(() => {
    if (!polled.data) return;
    const a = polled.data.data;
    if (a.status === "COMPLETED" || a.status === "FAILED") {
      const id = window.setTimeout(() => setRunningId(null), 0);
      return () => window.clearTimeout(id);
      if (a.status === "COMPLETED") {
        toast.push({
          tone: "mint",
          title: `Analysis #${a.number} completed`,
          message: "Results are ready to review.",
        });
      } else if (a.status === "FAILED") {
        toast.push({
          tone: "crimson",
          title: `Analysis #${a.number} failed`,
          message: a.error?.message ?? "The analysis could not finish.",
        });
      }
      analysesQuery.refetch();
      recentQuery.refetch();
    }
  }, [polled.data, analysesQuery, recentQuery, toast]);

  // sync running state from latest analysis on load
  useEffect(() => {
    if (latest && (latest.status === "PENDING" || latest.status === "RUNNING")) {
      const id = window.setTimeout(() => setRunningId((current) => current ?? latest.id), 0);
      return () => window.clearTimeout(id);
    }
  }, [latest]);

  const setTab = (next: Tab) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("tab", next);
    router.replace(`/projects/${id}?${sp.toString()}`, { scroll: false });
  };

  const selectAnalysis = (aid: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("analysis", aid);
    if (!sp.get("tab")) sp.set("tab", "overview");
    router.replace(`/projects/${id}?${sp.toString()}`, { scroll: false });
  };

  async function handleRunAnalysis() {
    if (launchMeta.isLoading) return;
    try {
      const res = await launchAnalysis({ projectId: id }).unwrap();
      const a = res.data;
      setRunningId(a.id);
      toast.push({ tone: "ice", title: "Analysis started", message: `Analysis #${a.number} is running.` });
      analysesQuery.refetch();
      recentQuery.refetch();
    } catch (err) {
      const code = (err as { data?: { error?: { code?: string; message?: string } } })?.data?.error?.code;
      const message = (err as { data?: { error?: { message?: string } } })?.data?.error?.message;
      if (code === "CONFLICT") {
        // already in progress — switch to running state
        if (latest) setRunningId(latest.id);
        toast.push({ tone: "champagne", title: "Analysis in progress", message: "An analysis is already running for this project." });
      } else if (code === "INVARIANT_VIOLATION") {
        toast.push({ tone: "crimson", title: "Cannot run analysis", message: message ?? "Repository is not verified or workflow is unreachable." });
      } else {
        toast.push({ tone: "crimson", title: "Could not start analysis", message: message ?? "Try again in a moment." });
      }
    }
  }

  if (projectQuery.isLoading) {
    return <ProjectDetailSkeleton />;
  }
  if (projectQuery.isError) {
    const status = (projectQuery.error as { status?: number })?.status;
    if (status === 404) {
      return <ProjectNotFound id={id} />;
    }
    return <ProjectErrorState message={extractMessage(projectQuery.error)} onRetry={() => projectQuery.refetch()} />;
  }
  if (!project) {
    return <ProjectNotFound id={id} />;
  }

  const invalidRepo = !project.repository || !project.repository.isValid;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex w-full flex-col gap-6 p-8">
        <ProjectHeader project={project} tab={tab} onTab={setTab} onRun={handleRunAnalysis} running={!!runningId} launchPending={launchMeta.isLoading} invalidRepo={invalidRepo} />
        {invalidRepo ? (
          <InvalidRepositoryState project={project} onReverify={() => {}} onUpdate={() => {}} />
        ) : tab === "overview" ? (
          <OverviewTab project={project} selected={selectedAnalysis} analyses={recent} onSelect={selectAnalysis} runningId={runningId} />
        ) : tab === "analyses" ? (
          <AnalysesTab project={project} analyses={analyses} pagination={pagination} page={page} onPage={setPage} onSelect={selectAnalysis} />
        ) : (
          <RecommendationsTab project={project} analysis={selectedAnalysis ?? latest} />
        )}
      </div>
    </MotionConfig>
  );
}

// placeholder components (filled in next steps) — kept minimal so the route compiles
function ProjectDetailSkeleton() {
  return <div className="p-8 text-mist">Loading project…</div>;
}
function ProjectNotFound({ id }: { id: string }) {
  return (
    <div className="p-8">
      <p className="font-display text-headline-md text-foam">Project not found</p>
      <p className="mt-2 font-display text-body-md text-mist">No project matches “{id}”.</p>
      <Link href="/projects" className="mt-4 inline-block font-display text-body-md text-ice hover:underline">Back to projects</Link>
    </div>
  );
}
function ProjectErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-8">
      <p className="font-display text-headline-md text-foam">Could not load project</p>
      <p className="mt-2 font-display text-body-md text-mist">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 font-display text-body-md text-ice hover:underline">Retry</button>
    </div>
  );
}
function InvalidRepositoryState({ project, onReverify, onUpdate }: { project: ProjectType; onReverify: () => void; onUpdate: () => void }) {
  return (
    <div className="rounded-xl border border-crimson/40 bg-basin/80 p-6">
      <p className="font-display text-headline-sm text-crimson">Invalid repository</p>
      <p className="mt-2 font-display text-body-md text-mist">
        {project.repository?.lastVerificationError ?? "The linked repository could not be verified."}
      </p>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={onReverify} className="rounded-full border border-steel px-4 py-2 font-display text-body-md text-foam">Re-verify</button>
        <button type="button" onClick={onUpdate} className="rounded-full bg-ice px-4 py-2 font-display text-body-md font-semibold text-navy">Update repository</button>
      </div>
    </div>
  );
}
function ProjectHeader(props: { project: ProjectType; tab: Tab; onTab: (t: Tab) => void; onRun: () => void; running: boolean; launchPending: boolean; invalidRepo: boolean }) {
  void props;
  return <div className="text-mist">Project header — wiring in progress</div>;
}
function OverviewTab(props: { project: ProjectType; selected: Analysis | null; analyses: Analysis[]; onSelect: (id: string) => void; runningId: string | null }) {
  void props;
  return <div className="text-mist">Overview — wiring in progress</div>;
}
function AnalysesTab(props: { project: ProjectType; analyses: Analysis[]; pagination: AnalysisListResponse["pagination"] | undefined; page: number; onPage: (p: number) => void; onSelect: (id: string) => void }) {
  void props;
  return <div className="text-mist">Analyses — wiring in progress</div>;
}
function RecommendationsTab(props: { project: ProjectType; analysis: Analysis | null }) {
  void props;
  return <div className="text-mist">Recommendations — wiring in progress</div>;
}

function usePolledAnalysis(projectId: string, analysisId: string | null) {
  return useGetAnalysisQuery(
    { projectId, analysisId: analysisId ?? "" },
    { skip: !analysisId, pollingInterval: analysisId ? 3000 : 0, skipPollingIfUnfocused: true },
  );
}

function extractMessage(error: unknown): string {
  const e = error as { data?: { error?: { message?: string } }; message?: string };
  return e?.data?.error?.message ?? e?.message ?? "Unknown error";
}

export function ProjectDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-mist">Loading…</div>}>
      <ProjectDetailInner />
    </Suspense>
  );
}
