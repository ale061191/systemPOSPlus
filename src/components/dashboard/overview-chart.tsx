"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

import { useLanguage } from "@/providers/language-provider"

interface OverviewChartProps {
    data: { name: string; total: number; date?: string }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {payload[0].payload.date || label}
                        </span>
                        <span className="font-bold text-muted-foreground">
                            {label}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                    <span className="font-bold text-violet-600">
                        ${payload[0].value.toFixed(2)}
                    </span>
                </div>
            </div>
        )
    }
    return null
}

export function OverviewChart({ data }: OverviewChartProps) {
    const { t } = useLanguage()
    return (
        <Card className="col-span-4 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t.sales_overview}</CardTitle>
                <Select defaultValue="week">
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">{t.week}</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                activeDot={{ r: 6, className: "fill-violet-600" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
