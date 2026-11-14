import type {
  DockerfileProposal,
  DockerfileProposalFile,
} from "@/types/dockerfile-proposals";

export function fileNameOf(path: string): string {
  return path.split("/").at(-1) || path;
}

export function proposalFiles(proposal: DockerfileProposal): DockerfileProposalFile[] {
  const listed = new Set(proposal.files.map((file) => file.path));
  const core: DockerfileProposalFile[] = [
    { path: proposal.path, content: proposal.content },
    {
      path: proposal.path.replace(/[^/]*$/, ".dockerignore"),
      content: proposal.dockerignore,
    },
  ];
  return [...core.filter((file) => !listed.has(file.path)), ...proposal.files];
}

export function codeLines(content: string): string[] {
  return content.replace(/\n$/, "").split("\n");
}
