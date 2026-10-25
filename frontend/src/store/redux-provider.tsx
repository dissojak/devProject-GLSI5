"use client";

import { useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { appStore } from "@/store/store";
import { parseStoredSession, sessionRestored } from "@/store/auth-session";

const STORAGE_KEY = "deployment-planner-ai.auth-session";

export function ReduxProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    appStore.dispatch(sessionRestored(parseStoredSession(window.localStorage.getItem(STORAGE_KEY))));
  }, []);

  useEffect(() => {
    const persist = () => {
      const session = appStore.getState().authSession;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    };
    persist();
    return appStore.subscribe(persist);
  }, []);

  return <Provider store={appStore}>{children}</Provider>;
}
