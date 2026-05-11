"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { TrendingDown } from "lucide-react";


const chartData = [
    { month: "January", desktop: 186, mobile: 92 },
    { month: "February", desktop: 305, mobile: 178 },
    { month: "March", desktop: 237, mobile: 145 },
    { month: "April", desktop: 273, mobile: 203 },
    { month: "May", desktop: 209, mobile: 167 },
    { month: "June", desktop: 298, mobile: 132 },
    { month: "July", desktop: 245, mobile: 189 },
    { month: "August", desktop: 312, mobile: 156 },
    { month: "September", desktop: 187, mobile: 210 },
    { month: "October", desktop: 263, mobile: 124 },
    { month: "November", desktop: 229, mobile: 198 },
    { month: "December", desktop: 276, mobile: 172 },
];

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "#3b82f6", // Blue-500
    },
    mobile: {
        label: "Mobile",
        color: "#8b5cf6", // Violet-500
    },
} satisfies ChartConfig;

export function CombinedRadarChart() {
    return (
        <Card className="h-full">
            <CardHeader className="items-center pb-4">
                <CardTitle className="font-mono uppercase tracking-tight text-lg flex items-center gap-2">
                    User Engagement Radar
                    <Badge
                        variant="outline"
                        className="text-red-500 bg-red-500/10 border-none ml-2 font-mono"
                    >
                        <TrendingDown className="h-4 w-4 mr-1" />
                        <span>5.2%</span>
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Showing total visitors for the last 6 months
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto w-full h-full min-h-[250px]"
                >
                    <RadarChart
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius="65%"
                    >
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <PolarAngleAxis dataKey="month" />
                        <PolarGrid strokeDasharray="3 3" />

                        <Radar
                            stroke="var(--color-desktop)"
                            strokeWidth={3}
                            dataKey="desktop"
                            fill="none"
                            fillOpacity={0.5}
                        />

                        <Radar
                            stroke="var(--color-mobile)"
                            strokeWidth={3}
                            dataKey="mobile"
                            fill="none"
                            fillOpacity={0.5}
                        />
                    </RadarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
