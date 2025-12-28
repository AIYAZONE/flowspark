'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { subDays, format, isSameDay, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ScoreTrendChart({ data, title, scoreLabel = 'Score' }: { data: { date: string, score: number }[], title: string, scoreLabel?: string }) {
  // Generate last 30 days to ensure consistent X-axis spacing
  const today = new Date()
  const chartData = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(today, 29 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dataPoint = data.find(d => {
      // Handle both ISO strings and YYYY-MM-DD
      const dDate = d.date.includes('T') ? parseISO(d.date) : parseISO(d.date + 'T00:00:00')
      // simpler: just compare string if we know format, but safe is check same day
      return isSameDay(parseISO(d.date), date)
    })

    return {
      date: dateStr,
      score: dataPoint ? dataPoint.score : undefined
    }
  })

  return (
    <Card className="col-span-1 sm:col-span-2 lg:col-span-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getMonth() + 1}/${date.getDate()}`
                }}
                interval={4} // Show fewer ticks to avoid clutter
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
              />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                labelFormatter={(label) => {
                  const d = new Date(label as string)
                  return `${d.getMonth() + 1}/${d.getDate()}`
                }}
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return [value, scoreLabel]
                  }
                  return [value as unknown as number, scoreLabel]
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
