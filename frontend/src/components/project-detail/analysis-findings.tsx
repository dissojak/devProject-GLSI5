import type { Analysis } from "@/types/analysis";
import { KubernetesEvidenceCard } from "@/components/analysis/kubernetes-evidence-card";

const CATEGORY_LABEL: Record<string, string> = {
  LANGUAGE: "Languages",
  FRAMEWORK: "Frameworks",
  LIBRARY: "Libraries",
  DATABASE: "Databases",
  BUILD_TOOL: "Build tools",
  RUNTIME: "Runtimes",
  OTHER: "Other",
};

export function AnalysisFindings({ analysis }: { analysis: Analysis }) {
  return (
    <div className="flex flex-col gap-6">
      <TechnologyGrid technologies={analysis.technologies} />
      <ComponentList components={analysis.components} />
      <KubernetesEvidenceCard components={analysis.components} />
      <DockerBlock docker={analysis.docker} />
      {analysis.detectedFiles.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="font-mono text-label-sm uppercase text-cinder">Detected files</p>
          <div className="flex flex-wrap gap-2">
            {analysis.detectedFiles.map((file) => (
              <span
                key={file}
                className="rounded-lg border border-steel/40 bg-basin px-2.5 py-1 font-mono text-code-md text-mist"
              >
                {file}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TechnologyGrid({ technologies }: { technologies: Analysis["technologies"] }) {
  const grouped: Record<string, string[]> = {};
  for (const t of technologies) {
    const bucket = grouped[t.category] ?? [];
    bucket.push(t.version ? `${t.name} ${t.version}` : t.name);
    grouped[t.category] = bucket;
  }
  const categories = Object.keys(grouped);
  if (categories.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-mono text-label-sm uppercase text-cinder">Technologies</p>
        <p className="font-display text-body-sm text-mist">None detected.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-label-sm uppercase text-cinder">Technologies</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((category) => (
          <div key={category} className="rounded-xl border border-steel/40 bg-basin p-3">
            <p className="font-mono text-label-sm uppercase text-cinder">
              {CATEGORY_LABEL[category] ?? category}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {grouped[category].map((name) => (
                <span
                  key={name}
                  className="rounded-lg bg-surface-high px-2 py-0.5 font-mono text-code-md text-foam"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentList({ components }: { components: Analysis["components"] }) {
  if (components.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-label-sm uppercase text-cinder">Components</p>
      <ul className="flex flex-col gap-2">
        {components.map((component) => (
          <li
            key={component.name}
            className="flex items-center justify-between rounded-xl border border-steel/40 bg-basin px-4 py-3"
          >
            <span className="font-display text-body-md font-semibold text-foam">{component.name}</span>
            <span className="flex items-center gap-3">
              <span className="rounded-full bg-surface-high px-2 py-0.5 font-mono text-label-sm text-mist">
                {component.type}
              </span>
              <span className="font-mono text-label-sm text-mist">{component.rootPath}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DockerBlock({ docker }: { docker: Analysis["docker"] }) {
  const blocking = docker.findings.some((f) => f.severity === "ERROR");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <p className="font-mono text-label-sm uppercase text-cinder">Docker</p>
        <span className="rounded-full bg-surface-high px-2 py-0.5 font-mono text-label-sm text-mist">
          {docker.hasDockerfile ? "Dockerfile" : "no Dockerfile"}
        </span>
        <span className="rounded-full bg-surface-high px-2 py-0.5 font-mono text-label-sm text-mist">
          {docker.hasCompose ? "compose" : "no compose"}
        </span>
      </div>
      {docker.findings.length === 0 ? (
        <p className="font-display text-body-sm text-mint">No Docker findings.</p>
      ) : (
        <>
          {blocking ? (
            <div className="rounded-xl border border-champagne/40 bg-champagne/10 p-4">
              <p className="font-display text-body-md font-semibold text-champagne">
                Blocking Docker issue detected
              </p>
              <p className="mt-1 font-display text-body-sm text-mist">
                AI audit is disabled until the highest-severity finding is resolved.
              </p>
            </div>
          ) : null}
          <ul className="flex flex-col gap-2">
            {docker.findings.map((finding, index) => (
              <li
                key={`${finding.ruleId}-${index}`}
                className="flex items-start gap-3 rounded-xl border border-steel/40 bg-basin px-4 py-3"
              >
                <span
                  className={
                    finding.severity === "ERROR"
                      ? "mt-0.5 rounded-full bg-crimson/15 px-2 py-0.5 font-mono text-label-sm text-crimson"
                      : finding.severity === "WARNING"
                        ? "mt-0.5 rounded-full bg-champagne/15 px-2 py-0.5 font-mono text-label-sm text-champagne"
                        : "mt-0.5 rounded-full bg-mist/15 px-2 py-0.5 font-mono text-label-sm text-mist"
                  }
                >
                  {finding.severity}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-body-sm text-foam">{finding.message}</p>
                  <p className="font-mono text-label-sm text-mist">
                    {finding.ruleId}
                    {finding.file ? ` · ${finding.file}` : ""}
                    {finding.line ? `:${finding.line}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
