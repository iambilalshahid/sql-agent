"use client";

import { Database, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, logout } from "@/lib/auth";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { authModalStore } from "@/store/authModalStore";

const Navbar = observer(() => {
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        getCurrentUser().then(setCurrentUser);
    }, []);

    const handleLogout = async () => {
        await logout();
        setCurrentUser(null);
        window.location.reload();
    };

    return (
        <nav className="border-b border-white/10 bg-zinc-950 px-8 py-5 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">SQL Agent</h1>
                        <p className="text-xs text-neutral-500 -mt-1">E-commerce Intelligence</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {currentUser ? (
                    <div className="flex items-center gap-3 bg-zinc-900/80 px-5 py-2.5 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-emerald-400" />
                            <div className="text-left">
                                <p className="text-sm font-medium text-white">{currentUser.email.split('@')[0]}</p>
                                <p className="text-[10px] uppercase tracking-widest text-emerald-400">{currentUser.role}</p>
                            </div>
                        </div>
                        <Button onClick={handleLogout} variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <Button 
                        onClick={() => authModalStore.openModal()} 
                        className="bg-white text-black hover:bg-white/90 font-medium px-6"
                    >
                        <LogIn className="mr-2 w-4 h-4" /> Sign In
                    </Button>
                )}
            </div>
        </nav>
    );
});

export default Navbar;