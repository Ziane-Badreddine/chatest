"use client"

import type React from "react"

import { MessageSquare, Users, FileText, User, Settings, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import Link from "next/link"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

const navItems: NavItem[] = [

  {
    icon: User,
    label: "Freinds",
    href: "/freinds",
  },
  {
    icon: MessageSquare,
    label: "Discussions",
    href: "/discussions",
  },
  {
    icon: Users,
    label: "Groupes",
    href: "/groups",
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

export default function MobileNav() {
  const [active, setActive] = useState("Discussions")

  return (
    <div className="fixed bottom-0  left-0 right-0 bg-card border-t border-border md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link href={item.href} key={item.label} className="h-full">
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center h-full rounded-none px-1",
                active === item.label && "text-primary border-t-2 border-primary",
              )}
              onClick={() => setActive(item.label)}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}

