"use client";

import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

type Row = Record<string, string | number | null>;

const COLORS = ["#6366f1", "#22d3ee", "#f472b6", "#facc15", "#34d399", "#fb923c"];

export function DataChart({
    type,
    rows,
    xKey,
    yKeys,
}: {
    type: "bar_chart" | "line_chart" | "pie_chart";
    rows: Row[];
    xKey?: string;
    yKeys?: string[];
}) {
    if (!rows.length || !xKey || !yKeys?.length) {
        return <p className="text-sm text-neutral-400">Not enough data to chart.</p>;
    }

    if (type === "pie_chart") {
        const valueKey = yKeys[0];
        return (
            <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                    <Pie
                        data={rows}
                        dataKey={valueKey}
                        nameKey={xKey}
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        label={(props: any) => String(props[xKey] ?? props.name ?? "")}
                    >
                        {rows.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1a1d24", border: "1px solid #333" }} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        );
    }

    if (type === "line_chart") {
        return (
            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3a" />
                    <XAxis dataKey={xKey} stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ background: "#1a1d24", border: "1px solid #333" }} />
                    <Legend />
                    {yKeys.map((k, i) => (
                        <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        );
    }

    // default: bar chart
    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3a" />
                <XAxis dataKey={xKey} stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ background: "#1a1d24", border: "1px solid #333" }} />
                <Legend />
                {yKeys.map((k, i) => (
                    <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}
