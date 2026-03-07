import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Brain, LogIn, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back, trader!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 grid-lines">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto glow-primary">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-display tracking-wider">TRADEJOURNAL</h1>
          <p className="text-sm text-muted-foreground">Track. Analyze. Evolve.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 glow-primary">
            <h2 className="text-lg font-semibold text-foreground">
              {isLogin ? "Sign In" : "Create Account"}
            </h2>

            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your trader alias"
                  className="bg-secondary border-border"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@example.com"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Password</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary border-border"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2">
              {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
