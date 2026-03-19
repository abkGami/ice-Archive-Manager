import { Loader2 } from "lucide-react";

type PageLoaderProps = {
  message?: string;
};

export function PageLoader({
  message = "Loading data...",
}: PageLoaderProps) {
  return (
    <div className="min-h-[300px] w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-accent/20" />
          <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-accent" />
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}