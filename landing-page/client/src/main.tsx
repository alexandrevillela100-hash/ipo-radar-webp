import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Path A static-deploy bootstrap:
// - tRPC client removed (no backend in this build)
// - Auth redirect logic removed (no auth)
// - Kept QueryClient for any client-side caching needs by components
//   that might still use React Query (e.g. lucide icon preloads, etc.)
//
// When Path B (full backend) ships, restore the original main.tsx
// which wires up the tRPC HTTP batch link and superjson transformer.

const queryClient = new QueryClient();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
