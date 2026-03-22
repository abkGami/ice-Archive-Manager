import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

function toText(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function isInternalServerErrorToast(title: unknown, description: unknown) {
  const combined = `${toText(title)} ${toText(description)}`.toLowerCase()
  return (
    combined.includes("internal server error") ||
    combined.includes("500:") ||
    /^500\b/.test(combined.trim())
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isServerError = isInternalServerErrorToast(title, description)

        return (
          <Toast
            key={id}
            {...props}
            className={`${props.className ?? ""} ${
              isServerError
                ? "border-rose-200/70 bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50"
                : ""
            }`.trim()}
          >
            {isServerError ? (
              <div className="relative w-full overflow-hidden">
                <div className="absolute right-2 top-1 h-2 w-2 rounded-full bg-rose-300 animate-soft-pop" />
                <div className="absolute right-8 top-5 h-1.5 w-1.5 rounded-full bg-amber-300 animate-soft-pop [animation-delay:160ms]" />
                <div className="grid gap-1">
                  <ToastTitle className="text-rose-900 animate-soft-sway">
                    It&apos;s not you, It&apos;s me!
                  </ToastTitle>
                  <ToastDescription className="text-rose-800/90">
                    We hit an internal server hiccup. Please try again in a
                    moment.
                  </ToastDescription>
                </div>
              </div>
            ) : (
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            )}
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
