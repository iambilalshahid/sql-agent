import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { getAgent } from "@/lib/agent";
import { inferBetterUiType } from "@/lib/infer-ui-type";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();
        if (!message || typeof message !== "string") {
            return NextResponse.json({ error: "Missing 'message' string in body" }, { status: 400 });
        }

        const agent = await getAgent();
        const result = await agent.invoke({
            messages: [new HumanMessage(message)],
        });

        let structured = (result as any).structuredResponse;

        // Fallback: Extract JSON from last message content
        if (!structured) {
            const lastMessage = result.messages[result.messages.length - 1];
            let content = typeof lastMessage.content === "string"
                ? lastMessage.content
                : JSON.stringify(lastMessage.content);

            // Clean markdown code blocks
            content = content.replace(/```json\s*|\s*```/g, '').trim();

            try {
                structured = JSON.parse(content);
            } catch (e) {
                structured = {
                    summary: content,
                    uiType: "text" as const
                };
            }
        }
        structured = inferBetterUiType(structured);   // <-- add this line
        return NextResponse.json(structured);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}