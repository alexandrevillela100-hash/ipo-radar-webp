import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

// Path A minimal Navbar — no auth state, no search dialog, no user menu.
// When Path B (backend) ships, restore the original Navbar with useAuth.
//
// CHANGED: "Insights" added to the public nav and routes to /insights
// (the new editorial section backed by Sanity digestArticle docs).
// Removed "Coverage" placeholder since it didn't go anywhere useful.

export default function Navbar() {
  const [location] = useLocation();

  const handleSignIn = () => {
    toast("Backend coming soon", {
      description: "Sign-in opens when the auth layer ships. Preview build.",
    });
  };

  // Active-state helper — highlights the current section in teal.
  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  const linkClass = (path: string) =>
    `transition-colors text-sm ${
      isActive(path)
        ? "text-primary font-semibold"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Radar className="w-5 h-5 text-primary" />
            <span className="text-base font-bold text-foreground">
              IPO Radar <span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7">
            <Link href="/" className={`${linkClass("/")} no-underline`}>
              Home
            </Link>
            <Link href="/insights" className={`${linkClass("/insights")} no-underline`}>
              Insights
            </Link>
            <button
              onClick={() => toast("Coming soon", { description: "Product page." })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Product
            </button>
            <button
              onClick={() => toast("Coming soon", { description: "Pricing page." })}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </button>
          </div>

          {/* CTA */}
          <Button
            size="sm"
            onClick={handleSignIn}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
          >
            Sign in
          </Button>
        </div>
      </div>
    </nav>
  );
}
