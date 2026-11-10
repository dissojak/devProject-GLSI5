import { apiSlice } from "@/store/api";
import type {
  AdminPendingResponse,
  AdminUserListResponse,
  AdminUserResponse,
} from "@/types/admin";

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listPendingUsers: build.query<AdminPendingResponse, void>({
      query: () => "/admin/users/pending",
      providesTags: ["PendingUsers"],
    }),
    approveUser: build.mutation<AdminUserResponse, { id: string }>({
      query: ({ id }) => ({ url: `/admin/users/${id}/approve`, method: "POST" }),
      invalidatesTags: ["PendingUsers", "Users"],
    }),
    rejectUser: build.mutation<AdminUserResponse, { id: string }>({
      query: ({ id }) => ({ url: `/admin/users/${id}/reject`, method: "POST" }),
      invalidatesTags: ["PendingUsers", "Users"],
    }),
    listUsers: build.query<
      AdminUserListResponse,
      { q?: string; role?: string; includeDeleted?: boolean; page: number; limit: number }
    >({
      query: ({ q, role, includeDeleted, page, limit }) => ({
        url: "/admin/users",
        params: {
          ...(q ? { q } : {}),
          ...(role ? { role } : {}),
          ...(includeDeleted ? { includeDeleted: "true" } : {}),
          page,
          limit,
        },
      }),
      providesTags: ["Users"],
    }),
    deactivateUser: build.mutation<AdminUserResponse, { id: string }>({
      query: ({ id }) => ({ url: `/admin/users/${id}/deactivate`, method: "POST" }),
      invalidatesTags: ["Users"],
    }),
    reactivateUser: build.mutation<AdminUserResponse, { id: string }>({
      query: ({ id }) => ({ url: `/admin/users/${id}/reactivate`, method: "POST" }),
      invalidatesTags: ["Users"],
    }),
    updateUser: build.mutation<AdminUserResponse, { id: string; name: string }>({
      query: ({ id, name }) => ({ url: `/admin/users/${id}`, method: "PATCH", body: { name } }),
      invalidatesTags: ["Users"],
    }),
    changeUserRole: build.mutation<AdminUserResponse, { id: string; role: string }>({
      query: ({ id, role }) => ({ url: `/admin/users/${id}/role`, method: "PATCH", body: { role } }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useListPendingUsersQuery,
  useApproveUserMutation,
  useRejectUserMutation,
  useListUsersQuery,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useUpdateUserMutation,
  useChangeUserRoleMutation,
} = adminApi;
