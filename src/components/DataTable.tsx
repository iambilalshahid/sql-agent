"use client";

type Row = Record<string, string | number | null>;

export function DataTable({ columns, rows }: { columns: string[]; rows: Row[] }) {
    if (!rows.length) {
        return <p className="text-sm text-neutral-400">No rows returned.</p>;
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-sm">
                <thead className="bg-white/5">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col}
                                className="px-3 py-2 text-left font-medium text-neutral-300 whitespace-nowrap"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                            {columns.map((col) => (
                                <td key={col} className="px-3 py-2 whitespace-nowrap text-neutral-200">
                                    {row[col] === null || row[col] === undefined ? (
                                        <span className="text-neutral-500">—</span>
                                    ) : (
                                        String(row[col])
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
