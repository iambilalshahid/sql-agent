"use client";

import { ChatMessageView, type ChatMessage } from "@/components/ChatMessageView";
import LoginModal from "@/components/LoginModal";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authModalStore } from "@/store/authModalStore";
import { Loader2, Send } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
    "Show all products",
    "Create new product in Gaming category",
    "List all customers",
    "Show total sales this month",
];

const ChatApp = observer(() => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleLoginSuccess = () => {
        setMessages(prev => [...prev, {
            role: "assistant",
            content: { summary: "✅ Successfully logged in!", uiType: "text" }
        }]);
    };

    async function send(text: string) {
        if (!text.trim() || loading) return;
        setMessages((prev) => [...prev, { role: "user", content: text }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                setMessages((prev) => [...prev, { role: "error", content: data.error ?? "Unknown error" }]);
            } else {
                setMessages((prev) => [...prev, { role: "assistant", content: data }]);
            }
        } catch (err) {
            setMessages((prev) => [...prev, { role: "error", content: err instanceof Error ? err.message : String(err) }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="h-screen flex flex-col bg-zinc-950 text-white">
            <Navbar />

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-6xl mb-6">🗄️</div>
                        <h2 className="text-3xl font-semibold mb-3">Welcome to SQL Agent</h2>
                        <p className="text-neutral-400 max-w-md mb-8">
                            Ask anything about your e-commerce store.<br />
                            Admin can create/update/delete. Customer can only view.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {SUGGESTIONS.map(s => (
                                <Button key={s} onClick={() => send(s)}
                                    variant="default" className="rounded-full">
                                    {s}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m, i) => <ChatMessageView key={i} message={m} />)}

                {loading && (
                    <div className="flex items-center gap-3 text-neutral-400">
                        <Loader2 className="animate-spin" /> Thinking...
                    </div>
                )}
            </div>

            {/* Bottom Input */}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-6 border-t border-white/10 bg-zinc-900">
                <div className="max-w-3xl mx-auto flex gap-3 h-full">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your query... (e.g. Create a product in Gaming)"
                        className="bg-zinc-800 border-white/10 focus:border-purple-500 text-lg py-6"
                    />
                    <Button type="submit" disabled={loading} 
                    className="px-10 text-lg h-full">
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </form>

            <LoginModal
                isOpen={authModalStore.isOpen}
                onClose={() => authModalStore.closeModal()}
                onSuccess={handleLoginSuccess}
            />
        </div>
    );
})

export default function Home() {
    return <ChatApp />;
}