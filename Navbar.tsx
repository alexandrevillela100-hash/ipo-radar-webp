import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "wouter";

// Path A minimal Navbar — no auth state, no search dialog, no user menu.
// When Path B (backend) ships, restore the original Navbar with useAuth
// and SearchDialog.

export default function Navbar() {
  const handleSignIn = () => {
    toast("Backend coming soon", {
      description: "Sign-in opens when the auth layer ships. Preview build.",
    });
  };

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

          {/* Nav links (placeholder — all go nowhere in this preview build) */}
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <button
              onClick={() => toast("Coming soon", { description: "Product page." })}
              className="hover:text-foreground transition-colors"
            >
              Product
            </button>
            <button
              onClick={() => toast("Coming soon", { description: "Coverage page." })}
              className="hover:text-foreground transition-colors"
            >
              Coverage
            </button>
            <button
              onClick={() => toast("Coming soon", { description: "Pricing page." })}
              className="hover:text-foreground transition-colors"
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