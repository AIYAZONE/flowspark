import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        active:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400",
        completed:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400",
        abandoned:
          "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400",
        default:
          "border-border bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
)

export interface GoalStatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  Omit<VariantProps<typeof badgeVariants>, 'status'> {
  status: string
  label?: string
}

export function GoalStatusBadge({ className, status, label, ...props }: GoalStatusBadgeProps) {
  // Map backend status strings to variant keys if they differ, 
  // currently assuming 'active' -> active, 'completed' -> completed.
  // If status is not found in variants, fallback to default.

  const variant = (status === 'active' || status === 'completed' || status === 'abandoned')
    ? status
    : 'default'

  return (
    <div className={cn(badgeVariants({ status: variant as "active" | "completed" | "abandoned" | "default" }), className)} {...props}>
      {label || status}
    </div>
  )
}
