"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

interface ChatListProps {
  onSelectChat: (id: string) => void
  selectedChat: string | null,
  inpSearch: string | undefined;
}

export default function ChatList({ onSelectChat, selectedChat, inpSearch }: ChatListProps) {
  const [chats, setChats] = useState<any[]>([])
  const { user } = useUser();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )
  useEffect(() => {
    async function fetchChats() {
      const { data, error } = await supabase.from("conversations")
        .select(`
          id,
          user1_id,
          user2_id,
          sender: user1_id (
            id,
            username,
            email,
            image_url,
            created_at
          ),
          receiver: user2_id (
            id,
            username,
            email,
            image_url,
            created_at
          )
        `)
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .eq("type","private")

      if (error) {
        console.log(error)
        return
      }

      if (data) {
        const mappedChats = data.map((f) =>
          f.user2_id === user?.id ? { chatID: f.id, ...f.sender } : { chatID: f.id, ...f.receiver },
        )
        setChats(mappedChats);
      }
    }

    fetchChats();
    const channelConversations = supabase
      .channel("conversations-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        fetchChats()
      })
      .subscribe()

    return () => {
      channelConversations.unsubscribe()
    }
  }, [])

  const filteredChats = inpSearch
    ? chats?.filter((user) => {
      return user.username?.toLowerCase().includes(inpSearch.toLowerCase())
    })
    : chats

  return (
    <ScrollArea className="flex flex-col  ">
      {filteredChats && filteredChats.length > 0 ? (filteredChats.map((chat) => (
        <button
          key={chat.id}
          className={cn(
            "flex items-start w-full gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border/40",
            selectedChat === chat.chatID && "bg-muted/70",
          )}
          onClick={() => onSelectChat(chat.chatID)}
        >
          <Avatar className="w-12 h-12 border">
            <AvatarImage src={chat.image_url} alt={chat.username} />
            <AvatarFallback>{chat.username.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex flex-col items-start overflow-hidden">
            <div className="flex justify-between w-full">
              <span className="font-medium truncate">{chat.username}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate w-full text-left">{chat.email}</p>
          </div>
        </button>
      ))) : (
        <div className="text-center p-6  rounded-lg">
          <p className="text-muted-foreground">No conversations found matching "{inpSearch}"</p>
        </div>
      )}
    </ScrollArea>
  )
}

