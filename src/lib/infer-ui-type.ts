import type { UiResponse } from "./agent";

/**
 * Small models are unreliable about the "uiType" decision itself, AND about actually
 * populating xKey/yKeys even when they do pick a chart type. This function:
 *  1. If the model already picked a chart type but left xKey/yKeys empty, fills them
 *     in from the row shape (first non-numeric column as xKey, numeric columns as yKeys).
 *  2. If the model picked "table"/"text" but the data is a clear 2-column
 *     category-or-date + number shape, upgrades it to a chart.
 */
export function inferBetterUiType(structured: UiResponse): UiResponse {
    const rows = structured.rows ?? [];
    const columns = structured.columns ?? (rows[0] ? Object.keys(rows[0]) : []);

    if (rows.length < 2 || columns.length < 2) return structured;

    const sample = rows[0];
    const numericCols = columns.filter((c) => typeof sample[c] === "number");
    const nonNumericCols = columns.filter((c) => typeof sample[c] !== "number");

    const isChartType =
        structured.uiType === "bar_chart" ||
        structured.uiType === "line_chart" ||
        structured.uiType === "pie_chart";

    if (isChartType) {
        if (structured.xKey && structured.yKeys?.length) return { ...structured, columns, rows };

        const xKey = structured.xKey ?? nonNumericCols[0] ?? columns[0];
        const yKeys = structured.yKeys?.length
            ? structured.yKeys
            : numericCols.filter((c) => c !== xKey);

        if (!yKeys.length) return structured;
        return { ...structured, columns, rows, xKey, yKeys };
    }

    if (columns.length !== 2) return structured;

    const [colA, colB] = columns;
    const aIsNumeric = typeof sample[colA] === "number";
    const bIsNumeric = typeof sample[colB] === "number";
    if (aIsNumeric === bIsNumeric) return structured;

    const numericCol = aIsNumeric ? colA : colB;
    const categoryCol = aIsNumeric ? colB : colA;
    const categorySample = String(sample[categoryCol] ?? "");
    const looksLikeDate =
        /^\d{4}-\d{2}(-\d{2})?$/.test(categorySample) ||
        /^[A-Za-z]+\s+\d{4}$/.test(categorySample);

    return {
        ...structured,
        uiType: looksLikeDate ? "line_chart" : "bar_chart",
        columns,
        rows,
        xKey: categoryCol,
        yKeys: [numericCol],
    };
}