"use client"

import { useRef, useState } from "react"
import { Archive, MoreVertical, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import ChatList from "../_components/chat-list"
import ChatView from "../_components/chat-view"

export default function page() {
  const [selectedChat, setSelectedChat] = useState<string | null>("")
  const inp = useRef<HTMLInputElement>(null)
  const [serach,setSearch] = useState<string | undefined>("");
  const isMobile = useMobile()

  return (
    <div className="grid h-screen md:grid-cols-[350px_1fr]">
      {/* Sidebar - hidden on mobile when chat is selected */}
      <div className={cn("flex flex-col border-r bg-muted/20", isMobile && selectedChat ? "hidden" : "flex")}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold text-primary font-mono">Discussions</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input onChange={() => setSearch(inp.current?.value)} ref={inp} placeholder="Rechercher" className="pl-9 bg-muted/50 border-none" />
          </div>
        </div>



        {/* Archived */}
        <button className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
          <Archive className="w-5 h-5 text-primary" />
          <span className="font-medium">Archivées</span>
        </button>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <ChatList onSelectChat={setSelectedChat} inpSearch={serach} selectedChat={selectedChat} />
        </div>
      </div>

      {/* Main Chat Area - hidden on mobile when no chat is selected */}
      <div className={cn("flex flex-col h-screen", isMobile && !selectedChat ? "hidden" : "flex")}>
        {selectedChat ? (
          <ChatView chatId={selectedChat} onBack={() => setSelectedChat(null)} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium">Sélectionnez une discussion</h3>
              <p className="text-muted-foreground">Choisissez une conversation pour commencer à discuter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

