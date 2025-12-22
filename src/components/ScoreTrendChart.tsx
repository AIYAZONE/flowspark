'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ScoreTrendChart({ data, title }: { data: { date: string, score: number }[], title: string }) {
  // Reverse data to show oldest to newest if needed, but assuming data passed is already sorted or needs sorting
  // Recharts expects array.
  const chartData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <Card className="col-span-4">
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
                contentStyle={{ background: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                labelStyle={{ color: '#333' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 4, fill: "#10B981" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
