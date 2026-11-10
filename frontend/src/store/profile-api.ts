import { apiSlice } from "@/store/api";
import type {
  ChangePasswordBody,
  ProfileResponse,
  ProfileUpdateBody,
} from "@/types/profile";

/**
 * Self-scoped `/profile` endpoints. Password rotation leaves caches untouched:
 * the response carries no data (`data: null`), and changing a password does
 * not mutate the account identity fields.
 */
export const profileApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getProfile: build.query<ProfileResponse, void>({
      query: () => "/profile",
      providesTags: ["Profile"],
    }),
    updateProfile: build.mutation<ProfileResponse, ProfileUpdateBody>({
      query: (body) => ({ url: "/profile", method: "PATCH", body }),
      invalidatesTags: ["Profile"],
    }),
    changePassword: build.mutation<ProfileResponse, ChangePasswordBody>({
      query: (body) => ({ url: "/profile/password", method: "POST", body }),
    }),
  }),
});

export const { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation } =
  profileApi;
