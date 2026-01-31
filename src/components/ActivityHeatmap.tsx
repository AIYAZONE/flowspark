'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  subDays, format, getDay, startOfWeek, eachDayOfInterval, 
  differenceInCalendarDays, startOfYear, endOfYear, getYear, isSameYear 
} from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import { Button } from '@/components/ui/button'

interface ActivityHeatmapProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
  data: { date: string; count: number }[]
}

export function ActivityHeatmap({ dict, data }: ActivityHeatmapProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Config - Compact
  const blockSize = 10
  const blockMargin = 2
  const fontSize = 10
  const weekWidth = blockSize + blockMargin
  
  // Calculate date range based on selected year
  const { startDate, endDate, totalDays } = useMemo(() => {
    const start = startOfWeek(startOfYear(new Date(selectedYear, 0, 1)))
    const end = endOfYear(new Date(selectedYear, 0, 1))
    // Extend end to the end of the week to complete the grid
    const endAligned = new Date(end)
    endAligned.setDate(endAligned.getDate() + (6 - getDay(endAligned)))
    
    return {
      startDate: start,
      endDate: endAligned,
      totalDays: differenceInCalendarDays(endAligned, start) + 1
    }
  }, [selectedYear])

  // Process data map
  const activityMap = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(d => {
      const dateStr = d.date.split('T')[0]
      map.set(dateStr, d.count)
    })
    return map
  }, [data])

  // Generate all days for the grid
  const allDays = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return {
        date,
        dateStr,
        count: activityMap.get(dateStr) || 0,
        inYear: isSameYear(date, new Date(selectedYear, 0, 1))
      }
    })
  }, [startDate, endDate, activityMap, selectedYear])

  // Group by weeks
  const weeks = useMemo(() => {
    const weeksArr: typeof allDays[] = []
    let currentWeek: typeof allDays = []
    
    allDays.forEach(day => {
      if (getDay(day.date) === 0 && currentWeek.length > 0) {
        weeksArr.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(day)
    })
    if (currentWeek.length > 0) weeksArr.push(currentWeek)
    return weeksArr
  }, [allDays])

  // Month Labels Logic (Precise alignment)
  const monthLabels = useMemo(() => {
    const labels: { x: number, text: string }[] = []
    
    weeks.forEach((week, index) => {
      const firstDayOfWeek = week[0]?.date
      if (!firstDayOfWeek) return

      // Logic: Place label on the first week that contains the 1st of the month
      // Or simpler: If the week contains the 1st of the month
      const hasFirstOfMonth = week.some(d => d.date.getDate() === 1)
      
      if (hasFirstOfMonth) {
        // Find which month it is (based on the day that is the 1st)
        const firstDay = week.find(d => d.date.getDate() === 1)?.date || firstDayOfWeek
        // Avoid adding label for Jan if it's too close to start (optional)
        if (index === 0 && firstDay.getMonth() === 0 && firstDay.getDate() > 7) return 

        labels.push({ 
          x: index * weekWidth, 
          text: format(firstDay, 'MMM', { locale: dict.common.locale === 'zh-CN' ? zhCN : enUS }) 
        })
      }
    })
    return labels
  }, [weeks, weekWidth, dict.common.locale])

  // Color Scale
  const getColor = (count: number, inYear: boolean) => {
    if (!inYear) return 'fill-transparent' // Hide days outside selected year if desired, or just dim them
    if (count === 0) return 'fill-muted/20' // Lighter empty
    if (count <= 2) return 'fill-emerald-200 dark:fill-emerald-900/60'
    if (count <= 4) return 'fill-emerald-400 dark:fill-emerald-700'
    return 'fill-emerald-600 dark:fill-emerald-500'
  }

  const graphWidth = weeks.length * weekWidth
  const graphHeight = 7 * (blockSize + blockMargin) + 20

  const availableYears = Array.from(new Set(data.map(d => getYear(new Date(d.date))))).sort((a, b) => b - a)
  if (!availableYears.includes(new Date().getFullYear())) {
    availableYears.unshift(new Date().getFullYear())
  }

  return (
    <Card className="col-span-1 shadow-sm border-border/60">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{dict.dashboard.stats.heatmap}</CardTitle>
            <p className="text-sm text-muted-foreground">{dict.dashboard.stats.heatmapDesc}</p>
          </div>
          <div className="flex items-center gap-2">
            {availableYears.map(year => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto custom-scrollbar pb-2">
          <svg 
            width={graphWidth + 30} 
            height={graphHeight} 
            className="min-w-full"
            style={{ minWidth: '600px' }} 
          >
            {/* Weekday Labels */}
            <g transform={`translate(0, 20)`}>
              <text x="0" y={1 * (blockSize + blockMargin) + 9} fontSize={fontSize} className="fill-muted-foreground/60 text-[9px]">Mon</text>
              <text x="0" y={3 * (blockSize + blockMargin) + 9} fontSize={fontSize} className="fill-muted-foreground/60 text-[9px]">Wed</text>
              <text x="0" y={5 * (blockSize + blockMargin) + 9} fontSize={fontSize} className="fill-muted-foreground/60 text-[9px]">Fri</text>
            </g>

            <g transform="translate(25, 0)">
              {/* Month Labels */}
              {monthLabels.map((label, i) => (
                <text 
                  key={i} 
                  x={label.x} 
                  y={fontSize} 
                  fontSize={fontSize} 
                  className="fill-muted-foreground text-[10px]"
                >
                  {label.text}
                </text>
              ))}

              {/* Grid */}
              <g transform="translate(0, 20)">
                {weeks.map((week, wIdx) => (
                  <g key={wIdx} transform={`translate(${wIdx * weekWidth}, 0)`}>
                    {week.map((day, dIdx) => {
                       const dayIndex = getDay(day.date) 
                       return (
                        <rect
                          key={dIdx}
                          y={dayIndex * (blockSize + blockMargin)}
                          width={blockSize}
                          height={blockSize}
                          rx={2}
                          ry={2}
                          className={`${getColor(day.count, day.inYear)} transition-all hover:opacity-80 cursor-pointer`}
                        >
                          {day.inYear && <title>{`${day.dateStr}: ${day.count} activities`}</title>}
                        </rect>
                      )
                    })}
                  </g>
                ))}
              </g>
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>{dict.dashboard.stats.less}</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-sm bg-muted/20" />
            <div className="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/60" />
            <div className="h-3 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
            <div className="h-3 w-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
          </div>
          <span>{dict.dashboard.stats.more}</span>
        </div>
      </CardContent>
    </Card>
  )
}
