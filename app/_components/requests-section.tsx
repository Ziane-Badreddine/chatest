"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import supabase from "@/lib/supabaseServer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"



export default function RequestsSection() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const { user } = useUser()

  useEffect(() => {
    async function fetchFriendshipRequests() {
      if (!user) return
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          sender: sender_id (
            id,
            username,
            email,
            image_url,
            created_at
          )
        `)
        .eq("receiver_id", user.id)
        .eq("status", "pending")

      if (error) {
        console.log(error)
        return
      }

      if (data) {
        setPendingRequests(data)
      }
      console.log(data)
    }
    fetchFriendshipRequests();
    const channelFriends = supabase
    .channel("friends-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => {
      fetchFriendshipRequests()
    })
    .subscribe()
    return () => {
      channelFriends.unsubscribe()
    }

  }, [user])



  const handleAccept = async (requestId: string,user2Id: string) => {
    if (!user) return
    const { error: ef } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", requestId)
    const {data,error: ec} = await supabase.from("conversations").insert([{
      user1_id: user.id,
      user2_id: user2Id,
      type: "private",
      friendship_id: requestId
    }])
  }

  const handleDecline = async (requestId: string) => {
    if (!user) return
    const { error } = await supabase.from("friendships").delete().eq("id", requestId)
    if (error) {
      console.error("Error declining request:", error)
      toast("opps")
      return
    }
    setPendingRequests(pendingRequests.filter((req) => req.id !== requestId))
    toast("opps")
  }

  return (
    <div className="grid gap-6">
      <h2 className="text-xl font-semibold text-primary">Friend Requests</h2>
      {pendingRequests.length === 0 ? (
        <div className="text-center p-6 border rounded-lg">
          <p className="text-muted-foreground">No pending friend requests</p>
        </div>
      ) : (
          <ScrollArea className="grid gap-4  ">
          {pendingRequests.map((request) => (
            <div key={request.id} className="flex mb-3 items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {request.sender.image_url ? (
                    <img
                      src={request.sender.image_url || "/placeholder.svg"}
                      alt={request.sender.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">{request.sender.username?.charAt(0) || "U"}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{request.sender.username}</p>
                  <p className="text-sm text-muted-foreground">{request.sender.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAccept(request.id,request.sender.id)}
                >
                  Accept
                </Button>
                <Button
                  onClick={() => handleDecline(request.id)}
                  variant={"destructive"}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
          </ScrollArea>
      )}
    </div>
  )
}

