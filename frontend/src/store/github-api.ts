import { apiSlice } from "@/store/api";
import type {
  GithubConnectionResponse,
  GithubConnectionStartResponse,
  GithubRepositoryListResponse,
} from "@/types/github";

export const githubApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getGithubConnection: build.query<GithubConnectionResponse, void>({
      query: () => "/github/connection",
      providesTags: ["GithubConnection"],
    }),
    startGithubConnection: build.mutation<GithubConnectionStartResponse, { returnTo: string }>({
      query: (body) => ({ url: "/github/connection", method: "POST", body }),
    }),
    disconnectGithub: build.mutation<GithubConnectionResponse, void>({
      query: () => ({ url: "/github/connection", method: "DELETE" }),
      invalidatesTags: ["GithubConnection", "GithubRepositories"],
    }),
    listGithubRepositories: build.query<GithubRepositoryListResponse, void>({
      query: () => "/github/repositories",
      providesTags: ["GithubRepositories"],
    }),
  }),
});

export const {
  useGetGithubConnectionQuery,
  useStartGithubConnectionMutation,
  useDisconnectGithubMutation,
  useListGithubRepositoriesQuery,
} = githubApi;
