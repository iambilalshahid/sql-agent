import readline from "node:readline/promises";
import { HumanMessage } from "@langchain/core/messages";
import { agent } from "@/action/agent.action";

async function main() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log("\n🤖 SQLite SQL agent ready (Ecomm.db). Type 'exit' to quit.\n");

    while (true) {
        const question = await rl.question("You: ");
        if (!question.trim() || question.trim().toLowerCase() === "exit") break;

        try {
            const result = await agent.invoke({
                messages: [new HumanMessage(question)],
            });
            const last = result.messages[result.messages.length - 1];
            console.log(`\nAgent: ${last.content}\n`);
        } catch (err) {
            console.error("⚠️  Agent error:", err instanceof Error ? err.message : err);
        }
    }

    rl.close();
}

main();
