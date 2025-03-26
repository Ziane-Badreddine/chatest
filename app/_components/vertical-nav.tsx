"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, FileText, Settings, User, LogOut, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/ui/mode-toggle"
import Link from "next/link"
import { UserButton, useUser } from "@clerk/nextjs"

interface NavItem {
    icon: React.ElementType
    label: string
    href: string
    count?: number
}

const navItems: NavItem[] = [

    {
        icon: User,
        label: "Freinds",
        href: "/freinds",
        count: 5,
    },
    {
        icon: MessageSquare,
        label: "Discussions",
        href: "/discussions",
        count: 5,
    },
    {
        icon: Users,
        label: "Groupes",
        href: "/groups",
        count: 2,
    },
    {
        icon: FileText,
        label: "Posts",
        href: "/posts",
    },
    {
        icon: Settings,
        label: "Paramètres",
        href: "/parametres",
    },
]

export default function VerticalNav() {
    const [expanded, setExpanded] = useState(true)
    const [activeItem, setActiveItem] = useState("")
    const {user} = useUser();

    return (
        <div
            className={cn(
                "hidden md:flex flex-col h-full bg-card border-r border-border transition-all duration-300",
                expanded ? "w-64" : "w-16",
            )}
        >
            <div className="flex items-center justify-between p-4 border-b">
                {expanded && <h2 className="text-lg font-mono font-semibold text-primary">WhatsApp</h2>}
                <div className="flex items-center gap-2 ml-auto">
                    
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setExpanded(!expanded)}>
                        <ChevronRight className={cn("h-5 w-5 transition-transform", expanded ? "rotate-180" : "rotate-0")} />
                    </Button>
                    {expanded && <ModeToggle />}
                </div>
            </div>


            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {navItems.map((item) => (
                        <Link href={item.href} key={item.label}>

                            <Button
                                key={item.label}
                                variant={activeItem === item.label ? "secondary" : "ghost"}
                                className={cn("w-full justify-start mb-1 relative", expanded ? "px-3" : "px-0 justify-center")}
                                onClick={() => setActiveItem(item.label)}
                            >
                                <item.icon className="h-5 w-5 mr-2" />
                                {expanded && <span>{item.label}</span>}

                                {item.count && expanded && (
                                    <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                                        {item.count}
                                    </span>
                                )}

                                {item.count && !expanded && (
                                    <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        {item.count}
                                    </span>
                                )}
                            </Button>
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t mt-auto">
                <div className={cn("flex items-center", expanded ? "justify-between" : "justify-center flex-col gap-2")}>
                    <div className="flex items-center">
                        <UserButton />

                        {expanded && (
                            <div className="ml-3">
                                <p className="text-sm font-medium">{user?.username}</p>
                                <p className="text-xs text-muted-foreground">En ligne</p>
                            </div>
                        )}
                    </div>
                    {!expanded && <ModeToggle />}

                </div>
            </div>
        </div>
    )
}

