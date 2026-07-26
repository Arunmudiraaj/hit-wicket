import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../lib/auth";
import { Loader2 } from "lucide-react";

export function ProtectedRoute() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-muted-foreground font-medium">Loading...</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
