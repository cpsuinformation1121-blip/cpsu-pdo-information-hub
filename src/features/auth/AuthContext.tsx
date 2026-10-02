import { useQueryClient } from "@tanstack/react-query";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { AuthContext, type AuthContextValue } from "./authContextValue";
import { getFirebaseAuth } from "./firebaseAuth";

type AuthenticationStatus =
  | "initializing"
  | "authenticated"
  | "unauthenticated";

function initializeAuthentication() {
  try {
    return { auth: getFirebaseAuth(), configurationError: null };
  } catch (error) {
    return {
      auth: null,
      configurationError:
        error instanceof Error
          ? error.message
          : "Administrator login is not configured for this environment.",
    };
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [initialization] = useState(initializeAuthentication);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthenticationStatus>(
    initialization.auth ? "initializing" : "unauthenticated",
  );

  useEffect(() => {
    if (!initialization.auth) return;
    return onAuthStateChanged(initialization.auth, (nextUser) => {
      // Cancel in-flight requests and discard cached staff data at session changes.
      const privateQueries = { predicate: (query: { queryKey: readonly unknown[] }) =>
        typeof query.queryKey[0] === "string" &&
        (query.queryKey[0].startsWith("admin") || query.queryKey[0] === "administrators") };
      void queryClient.cancelQueries(privateQueries);
      queryClient.removeQueries(privateQueries);
      setUser(nextUser);
      setStatus(nextUser ? "authenticated" : "unauthenticated");
    });
  }, [initialization, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      configurationError: initialization.configurationError,
      async signIn(email, password) {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      },
      async signOut() {
        await firebaseSignOut(getFirebaseAuth());
      },
    }),
    [initialization.configurationError, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
