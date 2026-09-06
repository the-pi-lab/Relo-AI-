import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

import { useEffect, useState } from "react";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

  const [isLoading, setIsLoading] = useState(true);

  // This effect updates the loading state once auth is loaded
  // It ensures we only show content when authentication state is ready
  useEffect(() => {
    if (!isAuthLoading) {
      // If not authenticated, we don't need to wait for user data
      if (!isAuthenticated) {
        setIsLoading(false);
      } else if (user !== undefined) {
        // If authenticated, wait for user data to be available
        setIsLoading(false);
      }
    }
  }, [isAuthLoading, isAuthenticated, user]);

  return {
    isLoading,
    isAuthenticated,
    user,
    signIn,
    signOut,
  };
}