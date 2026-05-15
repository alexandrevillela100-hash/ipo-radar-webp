import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Insights from "./pages/Insights";
import InsightArticle from "./pages/InsightArticle";

// Path A static-deploy routing — now with the Insights section added.
//
// Routes:
//   /                      — public landing page (Home)
//   /insights              — editorial article index (Sanity-backed)
//   /insights/<slug>       — single article view (Sanity-backed)
//   /404 + fallback        — NotFound
//
// All the auth-gated app pages (AppCalendar, Watchlist, etc.) remain
// removed in this build; restore them when Path B (full-stack) ships.

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/insights"} component={Insights} />
      <Route path={"/insights/:slug"} component={InsightArticle} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
