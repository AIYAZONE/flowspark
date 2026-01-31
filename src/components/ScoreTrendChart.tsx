'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { subDays, format, isSameDay, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ScoreTrendChart({ data, title, description, scoreLabel = 'Score' }: { data: { date: string, score: number }[], title: string, description?: string, scoreLabel?: string }) {
  // Generate last 30 days to ensure consistent X-axis spacing
  const today = new Date()
  const chartData = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(today, 29 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dataPoint = data.find(d => {
      // Handle both ISO strings and YYYY-MM-DD
      const parsed = d.date.includes('T') ? parseISO(d.date) : parseISO(d.date + 'T00:00:00')
      return isSameDay(parsed, date)
    })

    return {
      date: dateStr,
      score: dataPoint ? dataPoint.score : null
    }
  })

  return (
    <Card className="col-span-1 shadow-sm border-border/60">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {format(subDays(today, 29), 'yyyy-MM-dd')} 至 {format(today, 'yyyy-MM-dd')}
        </p>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[200px] w-full [&_.recharts-surface]:outline-none [&_*]:focus:outline-none [&_*]:focus:ring-0 [&_*]:focus:border-none [&_*]:focus:shadow-none">
          <ResponsiveContainer width="100%" height="100%" className="outline-none focus:outline-none focus-visible:outline-none">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
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
                interval={4}
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
                stroke="#059669"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 5, stroke: "#059669", fill: "hsl(var(--background))", strokeWidth: 2 }}
                activeDot={{ r: 7, strokeWidth: 0 }}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
