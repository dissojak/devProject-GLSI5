"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Fragment, useId, useState } from "react";
import { Button } from "@/shared/button";
import { MaterialIcon } from "@/shared/material-icon";
import { cn } from "@/utils/class-names";
import { codeLines, fileNameOf } from "@/utils/dockerfile-files";
import type { DockerfileProposalFile } from "@/types/dockerfile-proposals";

function downloadFile(file: DockerfileProposalFile): void {
  const url = URL.createObjectURL(new Blob([file.content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileNameOf(file.path);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function DockerfileFileBrowser({ files }: { files: DockerfileProposalFile[] }) {
  const uid = useId();
  const [activePath, setActivePath] = useState(files[0]?.path ?? "");
  const active = files.find((file) => file.path === activePath) ?? files[0];

  if (!active) return null;

  const tabId = (path: string) => `${uid}-tab-${path}`;
  const panelId = `${uid}-panel`;

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid min-w-0 overflow-hidden rounded-xl border border-steel/50 bg-abyss md:grid-cols-[13rem_minmax(0,1fr)]">
        <div
          role="tablist"
          aria-label="Generated files"
          className="flex gap-1 overflow-x-auto border-b border-steel/40 bg-basin p-2 md:flex-col md:overflow-x-visible md:border-b-0 md:border-r"
        >
          <p className="hidden px-2 pb-1 pt-1.5 font-mono text-label-sm uppercase text-cinder md:block">
            Files · {files.length}
          </p>
          {files.map((file) => {
            const selected = file.path === active.path;
            return (
              <button
                key={file.path}
                type="button"
                role="tab"
                id={tabId(file.path)}
                aria-selected={selected}
                aria-controls={panelId}
                onClick={() => setActivePath(file.path)}
                className={cn(
                  "relative flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left font-mono text-code-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice/40",
                  selected ? "text-foam" : "text-mist hover:bg-panel/50 hover:text-foam",
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId={`${uid}-file-indicator`}
                    className="absolute inset-0 rounded-lg border border-ice/30 bg-ice/10"
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  />
                ) : null}
                <MaterialIcon
                  name="description"
                  className={cn("relative text-[16px]", selected ? "text-ice" : "text-steel")}
                />
                <span className="relative truncate">{fileNameOf(file.path)}</span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={panelId}
          aria-labelledby={tabId(active.path)}
          className="flex min-w-0 flex-col"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-steel/40 px-4 py-2.5">
            <p className="min-w-0 truncate font-mono text-label-sm text-mist">{active.path}</p>
            <Button
              variant="teal"
              onClick={() => downloadFile(active)}
              className="gap-1.5 px-3 py-1 text-body-sm"
            >
              <MaterialIcon name="download" className="text-[16px]" />
              Download {fileNameOf(active.path)}
            </Button>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.pre
              key={active.path}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="max-h-[26rem] min-h-48 overflow-auto p-4 font-mono text-code-md text-ice"
            >
              <code className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4">
                {codeLines(active.content).map((line, index) => (
                  <Fragment key={`${active.path}:${index}`}>
                    <span aria-hidden="true" className="select-none text-right text-steel">
                      {index + 1}
                    </span>
                    <span className="whitespace-pre">{line || " "}</span>
                  </Fragment>
                ))}
              </code>
            </motion.pre>
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}
