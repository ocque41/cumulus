"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, Cell } from "recharts";
import React, { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion, useSpring, useMotionValueEvent } from "framer-motion";
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
import { cn } from "@/lib/utils";

const chartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
    mobile: {
        label: "Mobile",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig;

export function CombinedBarChart() {
    const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

    // Interaction logic from ValueLineBarChart: Springy Header Value
    const displayValue = useMemo(() => {
        if (activeIndex !== undefined) {
            const data = chartData[activeIndex];
            return data.desktop + data.mobile; // Sum for total interaction
        }
        // Default to total sum of last month or max? Let's do max sum
        return chartData.reduce(
            (max, item) => (item.desktop + item.mobile > max ? item.desktop + item.mobile : max),
            0
        );
    }, [activeIndex]);

    const springValue = useSpring(displayValue, {
        stiffness: 100,
        damping: 20,
    });

    const [formattedValue, setFormattedValue] = useState(displayValue);

    useMotionValueEvent(springValue, "change", (latest) => {
        setFormattedValue(Math.round(latest));
    });

    useEffect(() => {
        springValue.set(displayValue);
    }, [displayValue, springValue]);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="font-mono text-4xl tracking-tighter font-bold">
                        {formattedValue.toLocaleString()}
                    </span>
                    <Badge
                        variant="outline"
                        className="text-red-500 bg-red-500/10 border-none ml-2 font-mono"
                    >
                        <TrendingDown className="h-4 w-4 mr-1" />
                        <span>-5.2%</span>
                    </Badge>
                </CardTitle>
                <CardDescription>January - June 2025</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        onMouseMove={(state) => {
                            if (state.activeTooltipIndex !== undefined) {
                                setActiveIndex(state.activeTooltipIndex);
                            }
                        }}
                        onMouseLeave={() => setActiveIndex(undefined)}
                    >
                        {/* Duotone Visuals: Background Pattern */}
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="85%"
                            fill="url(#default-multiple-pattern-dots)"
                        />
                        <defs>
                            <DottedBackgroundPattern />
                        </defs>
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dashed" hideLabel />}
                        />

                        {/* Bars with Duotone Shape */}
                        <Bar
                            dataKey="desktop"
                            color="var(--chart-1)"
                            fill="var(--color-desktop)"
                            shape={<CustomDuotoneBarMultiple />}
                            radius={4}
                        >
                            {chartData.map((_, index) => (
                                <Cell
                                    key={`cell-desktop-${index}`}
                                    fillOpacity={activeIndex === undefined || activeIndex === index ? 1 : 0.6}
                                />
                            ))}
                        </Bar>
                        <Bar
                            dataKey="mobile"
                            fill="var(--color-mobile)"
                            shape={<CustomDuotoneBarMultiple />}
                            radius={4}
                        >
                            {chartData.map((_, index) => (
                                <Cell
                                    key={`cell-mobile-${index}`}
                                    fillOpacity={activeIndex === undefined || activeIndex === index ? 1 : 0.6}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

const CustomDuotoneBarMultiple = (
    props: React.SVGProps<SVGRectElement> & { dataKey?: string }
) => {
    const { fill, x, y, width, height, dataKey, fillOpacity } = props;

    return (
        <>
            <rect
                rx={4}
                x={x}
                y={y}
                width={width}
                height={height}
                stroke="none"
                fill={`url(#duotone-bar-pattern-${dataKey})`}
                fillOpacity={fillOpacity}
            />
            <defs>
                <linearGradient
                    key={dataKey}
                    id={`duotone-bar-pattern-${dataKey}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                >
                    <stop offset="50%" stopColor={fill} stopOpacity={0.5} />
                    <stop offset="50%" stopColor={fill} />
                </linearGradient>
            </defs>
        </>
    );
};

const DottedBackgroundPattern = () => {
    return (
        <pattern
            id="default-multiple-pattern-dots"
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
        >
            <circle
                className="dark:text-muted/40 text-muted"
                cx="2"
                cy="2"
                r="1"
                fill="currentColor"
            />
        </pattern>
    );
};
