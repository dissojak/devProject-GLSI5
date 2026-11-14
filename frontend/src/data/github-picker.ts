export const GITHUB_PICKER_COPY = {
  title: "Pick from your GitHub",
  connectHint: "Connect GitHub to list your repositories, private ones included.",
  connect: "Connect GitHub",
  connecting: "Waiting for GitHub…",
  connectedAs: "Connected as",
  disconnect: "Disconnect",
  search: "Search repositories",
  loading: "Loading your repositories…",
  empty: "No repository matches your search.",
  none: "This GitHub account has no repositories yet.",
  retry: "Retry",
  orManual: "or paste a repository URL below",
  private: "Private",
  public: "Public",
} as const;

export const GITHUB_CONNECTED_ROUTE = "/github/connected";

export const GITHUB_CONNECTED_COPY = {
  "repositories-connected": {
    title: "GitHub connected",
    message: "You can close this window. Your repositories are ready to pick.",
  },
  "repositories-failed": {
    title: "GitHub connection failed",
    message: "Close this window and try Connect GitHub again.",
  },
} as const;
