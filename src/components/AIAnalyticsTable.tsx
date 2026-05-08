import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AIMetricRow, AIRecentRecommendationRow } from '@/lib/ai/analyticsStore'

interface AnalyticsTableProps {
  title: string
  columns: string[]
  rows: Array<Array<ReactNode>>
}

export function AIAnalyticsTable({ title, columns, rows }: AnalyticsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                {columns.map(column => (
                  <th key={column} className="px-3 py-2 font-medium">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${title}-${index}`} className="border-b last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`${title}-${index}-${cellIndex}`} className="px-3 py-3 align-top">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function formatMetricRows(
  rows: AIMetricRow[],
  mapper: (row: AIMetricRow) => Array<ReactNode>
) {
  return rows.map(mapper)
}

export function formatRecentRows(
  rows: AIRecentRecommendationRow[],
  mapper: (row: AIRecentRecommendationRow) => Array<ReactNode>
) {
  return rows.map(mapper)
}
