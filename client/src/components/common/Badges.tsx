import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Badge({ children, className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const isApproved = status === "Approved";
  return (
    <Badge
      className={cn(
        "border-transparent",
        isApproved 
          ? "bg-[#1A6B45]/10 text-[#1A6B45]" 
          : "bg-[#D97706]/10 text-[#D97706]"
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", isApproved ? "bg-[#1A6B45]" : "bg-[#D97706]")} />
      {status}
    </Badge>
  );
}

export function FileBadge({ type }: { type: string }) {
  const ext = type.toLowerCase().replace('.', '');
  
  let colorClass = "bg-file-other";
  if (ext === "pdf") colorClass = "bg-file-pdf";
  if (ext === "docx" || ext === "doc") colorClass = "bg-file-docx";
  if (ext === "xlsx" || ext === "xls") colorClass = "bg-file-xlsx";

  return (
    <div className={cn("w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold uppercase tracking-wider", colorClass)}>
      {ext}
    </div>
  );
}

export function RoleBadge({ role }: { role: string }) {
  let styles = "bg-muted text-foreground";
  
  if (role === "Administrator") {
    styles = "bg-primary text-primary-foreground border-transparent";
  } else if (role === "Lecturer") {
    styles = "bg-accent text-accent-foreground border-transparent";
  }

  return (
    <Badge className={styles}>
      {role}
    </Badge>
  );
}
