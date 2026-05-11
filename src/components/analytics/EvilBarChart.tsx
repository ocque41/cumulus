"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Mock data acting as a placeholder until we fetch from DB
const MOCK_DATA = [
    { name: 'US-EAST', value: 4000 },
    { name: 'EU-WEST', value: 3000 },
    { name: 'ASIA-PAC', value: 2000 },
    { name: 'LATAM', value: 2780 },
    { name: 'AFRICA', value: 1890 },
];

const EvilTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black border-2 border-white p-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <p className="font-mono text-xs text-white uppercase border-b border-white mb-1 pb-1">
                    Target: {label}
                </p>
                <p className="font-mono text-xl text-[var(--neon-green)]">
                    {payload[0].value} <span className="text-xs text-zinc-500">UNITS</span>
                </p>
            </div>
        );
    }
    return null;
};

export const EvilBarChart = () => {
    return (
        <div className="w-full h-96 bg-zinc-950 border-4 border-black relative overflow-hidden group">
            {/* Decorative Header */}
            <div className="absolute top-0 left-0 bg-black text-white px-2 py-1 font-mono text-xs border-r-2 border-b-2 border-white z-20">
                METRIC // VOLUME_DENSITY
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_DATA} margin={{ top: 40, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />

                    <XAxis
                        dataKey="name"
                        stroke="#fff"
                        tick={{ fill: '#fff', fontFamily: 'monospace' }}
                        axisLine={{ stroke: '#fff', strokeWidth: 2 }}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="#fff"
                        tick={{ fill: '#fff', fontFamily: 'monospace' }}
                        axisLine={{ stroke: '#fff', strokeWidth: 2 }}
                        tickLine={false}
                    />

                    <Tooltip content={<EvilTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />

                    {/* SVG Pattern Definition for 'Hatched' look */}
                    <defs>
                        <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
                            <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" style={{ stroke: 'var(--neon-green)', strokeWidth: 1 }} />
                        </pattern>
                    </defs>

                    <Bar
                        dataKey="value"
                        fill="url(#diagonalHatch)"
                        stroke="var(--neon-green)"
                        strokeWidth={2}
                        animationDuration={1500}
                        animationBegin={300}
                        animationEasing="ease-out"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
