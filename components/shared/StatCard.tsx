import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: React.ReactNode
  valueClassName?: string
  className?: string
}

/** Compact stat card used on detail pages (big number + label). */
export function StatCard({ label, value, valueClassName, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className={cn('text-2xl font-bold text-gray-900', valueClassName)}>{value}</div>
        <p className="text-sm text-gray-600">{label}</p>
      </CardContent>
    </Card>
  )
}
