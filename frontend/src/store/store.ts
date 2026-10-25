import { configureStore } from "@reduxjs/toolkit";
import { authSessionSlice } from "@/store/auth-session";

export const appStore = configureStore({
  reducer: { authSession: authSessionSlice.reducer },
});

export type AppState = ReturnType<typeof appStore.getState>;
export type AppDispatch = typeof appStore.dispatch;
