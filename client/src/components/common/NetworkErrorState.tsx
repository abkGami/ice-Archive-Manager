import { WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "./Button";

interface NetworkErrorStateProps {
  onRetry?: () => void;
  isRetrying?: boolean;
  message?: string;
  type?: "offline" | "slow" | "error";
}

export function NetworkErrorState({
  onRetry,
  isRetrying = false,
  message,
  type = "error",
}: NetworkErrorStateProps) {
  const getIcon = () => {
    switch (type) {
      case "offline":
        return <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />;
      case "slow":
        return <AlertCircle className="h-16 w-16 text-[#D97706] mb-4" />;
      default:
        return <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "offline":
        return "No Internet Connection";
      case "slow":
        return "Slow Network Detected";
      default:
        return "Network Error";
    }
  };

  const getDescription = () => {
    if (message) return message;

    switch (type) {
      case "offline":
        return "Please check your internet connection and try again.";
      case "slow":
        return "Your network connection is slow. This may affect loading times.";
      default:
        return "Unable to load data due to network issues. Please check your connection.";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      {getIcon()}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {getTitle()}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {getDescription()}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          isLoading={isRetrying}
          className="gap-2"
        >
          {!isRetrying && <RefreshCw className="h-4 w-4" />}
          {isRetrying ? "Retrying..." : "Try Again"}
        </Button>
      )}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg max-w-md">
        <p className="text-sm text-muted-foreground">
          <strong>Troubleshooting Tips:</strong>
        </p>
        <ul className="text-sm text-muted-foreground text-left mt-2 space-y-1">
          <li>• Check your WiFi or ethernet connection</li>
          <li>• Restart your router if needed</li>
          <li>• Try moving closer to your WiFi router</li>
          <li>• Contact your network administrator</li>
        </ul>
      </div>
    </div>
  );
}
