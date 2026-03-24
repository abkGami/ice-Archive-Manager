import { useCallback, useEffect, useState } from "react";
import { useLogin, useUser } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/common/Button";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { PageLoader } from "@/components/common/PageLoader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Login() {
  const [uniqueId, setUniqueId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const { data: user, isLoading: isAuthLoading } = useUser();

  const navigateWithLoader = useCallback(
    (path: string) => {
      setIsRouting(true);
      window.setTimeout(() => setLocation(path), 150);
    },
    [setLocation],
  );

  useEffect(() => {
    if (isAuthLoading || !user) return;

    const redirectPath =
      user.role === "Administrator"
        ? "/admin/dashboard"
        : user.role === "Lecturer"
          ? "/lecturer/dashboard"
          : "/student/dashboard";
    navigateWithLoader(redirectPath);
  }, [isAuthLoading, navigateWithLoader, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate(
      { uniqueId, password },
      {
        onSuccess: (user) => {
          // Redirect to home page, which will then redirect to appropriate dashboard
          navigateWithLoader("/");
        },
        onError: (err) => {
          setError(err.message);
        },
      },
    );
  };

  if (isAuthLoading || isRouting) {
    return (
      <div className="min-h-screen bg-[#0A2240] flex items-center justify-center p-4">
        <PageLoader message="Preparing secure sign-in..." />
      </div>
    );
  }

  // AFIT backdrop - simple pattern or wash since we can't use images easily without external URLs
  return (
    <div className="min-h-screen bg-[#0A2240] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-8%] left-[-18%] w-[65vw] h-[65vw] sm:w-1/2 sm:h-1/2 rounded-full bg-[#1A6BAF] blur-[70px] sm:blur-[100px]"></div>
        <div className="absolute bottom-[-12%] right-[-18%] w-[68vw] h-[68vw] sm:w-1/2 sm:h-1/2 rounded-full bg-[#C8A84B] blur-[80px] sm:blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-card rounded-xl shadow-2xl p-5 sm:p-8 relative z-10 border border-border/50">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="h-16 w-16  rounded-lg flex items-center justify-center mb-4 shadow-inner">
            <img
              src="/logo.png"
              alt="E-Archive Logo"
              className="h-16 w-16 object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center">
            ICT Department E-Archive
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-center">
            Sign in with your institutional credentials to gain access
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive font-medium leading-tight">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="uniqueId" className="text-foreground font-semibold">
              Unique ID / Matric Number
            </Label>
            <Input
              id="uniqueId"
              placeholder="e.g. U22CE1210 or SS/CE/0061"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              className="h-11 border-border focus-visible:ring-[#1A6BAF] bg-background"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-foreground font-semibold"
              >
                Password
              </Label>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-xs text-[#1A6BAF] hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 border-border focus-visible:ring-[#1A6BAF] bg-background pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-bold bg-[#1A6BAF] hover:bg-[#0D3060] text-white mt-4"
            isLoading={login.isPending || isRouting}
          >
            {login.isPending ? "Authenticating..." : "Sign In"}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            No account yet?{" "}
            <button
              type="button"
              onClick={() => navigateWithLoader("/signup")}
              className="text-[#1A6BAF] hover:underline font-semibold"
            >
              Create account
            </button>
          </p>
        </form>

        <div className="mt-6 sm:mt-8 text-center text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Air Force Institute of Technology.
            All rights reserved.
          </p>
        </div>
      </div>

      <AlertDialog
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      >
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Forgot Password</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Contact your course-rep to reach out to the admin to restart your
              account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsForgotPasswordOpen(false)}>
              Okay, got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
