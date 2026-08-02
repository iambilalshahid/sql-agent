"use client";

import { DataTable } from "./DataTable";
import { DataChart } from "./DataChart";
import type { UiResponse } from "@/lib/agent";

export type ChatMessage =
    | { role: "user"; content: string }
    | { role: "assistant"; content: UiResponse }
    | { role: "error"; content: string };

export function ChatMessageView({ message }: { message: ChatMessage }) {
    if (message.role === "user") {
        return (
            <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-brand px-4 py-2 text-sm text-white">
                    {message.content}
                </div>
            </div>
        );
    }

    if (message.role === "error") {
        return (
            <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                    ⚠️ {message.content}
                </div>
            </div>
        );
    }

    const ui = message.content;
    const rows = ui.rows ?? [];
    const columns = ui.columns ?? (rows[0] ? Object.keys(rows[0]) : []);

    return (
        <div className="flex justify-start">
            <div className="max-w-[85%] space-y-3 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-sm text-neutral-100">{ui.summary}</p>

                {ui.uiType === "table" && rows.length > 0 && (
                    <DataTable columns={columns} rows={rows} />
                )}

                {(ui.uiType === "bar_chart" ||
                    ui.uiType === "line_chart" ||
                    ui.uiType === "pie_chart") &&
                    rows.length > 0 && (
                        <DataChart type={ui.uiType} rows={rows} xKey={ui.xKey} yKeys={ui.yKeys} />
                    )}
            </div>
        </div>
    );
}
