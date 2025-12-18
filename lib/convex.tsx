import { ConvexProvider, ConvexReactClient, useQuery, useMutation, useAction } from "convex/react";
import React from "react";

// This will be replaced by the actual Convex URL from environment variables
const convexUrl = (import.meta as any).env.VITE_CONVEX_URL || "";
export const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

export { useQuery, useMutation, useAction };
export { api } from "../convex/_generated/api";