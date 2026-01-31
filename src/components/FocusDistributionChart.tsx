'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface FocusDistributionChartProps {
  dict: any
  data: { name: string; value: number; color: string }[]
}

export function FocusDistributionChart({ dict, data }: FocusDistributionChartProps) {
  // Fallback for empty data
  const chartData = data.length > 0 ? data : [{ name: 'None', value: 1, color: '#e5e7eb' }]

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>{dict.dashboard.stats.focusDistribution}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--popover-foreground))'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
