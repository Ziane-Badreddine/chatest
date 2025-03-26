"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Ban, Copy, MessageSquare, MoreHorizontal, User, UserRoundMinus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"



export default function FriendsSection() {
  const [friends, setFriends] = useState<any[]>([])
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

  const { user } = useUser()
  useEffect(() => {
    if (!user) return


    async function fetchFriendship() {
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          sender_id,
          receiver_id,
          sender: sender_id (
            id,
            username,
            email,
            image_url,
            created_at
          ),
          receiver: receiver_id (
            id,
            username,
            email,
            image_url,
            created_at
          ),
          bloker
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .or(`status.eq.accepted,status.eq.rejected`)

      if (error) {
        console.log(error)
        return
      }

      if (data) {
        const mappedFriends = data.map((f) =>
          f.receiver_id === user?.id ? { friendshipsID: f.id, ...f.sender,bloker: f.bloker } : { friendshipsID: f.id, ...f.receiver,bloker: f.bloker },
        )
        setFriends(mappedFriends)
      }
    }

    fetchFriendship()


    const channelFriends = supabase
      .channel("friends-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => {
        fetchFriendship()

      })
      .subscribe()

    return () => {
      channelFriends.unsubscribe()
    }
  }, [user])

  console.log(friends)

  async function handleBlock(friendshipsID: string) {
    const { data } = await supabase.from("friendships").update({
      status: "rejected",
      bloker: user?.id
    }).eq("id", friendshipsID)
  }
  async function handleDelete(friendshipsID: string) {
    const { data,error } = await supabase.from("friendships").delete().eq("id", friendshipsID)
  }

  async function handleAddConversation(friendshipsID: string, id: string) {
    console.log(friendshipsID, id)

    const { error, data } = await supabase.from("conversations").select("*").eq("friendship_id", friendshipsID).maybeSingle();

    if (error) {
      toast(error.message)
      return;
    }

    if (data) {
      toast("conversation already exist");
      return;

    }
    if (!data) {
      const { error: errorInset } = await supabase.from("conversations").insert({
        user1_id: user?.id,
        user2_id: id,
        type: "private",
        friendship_id: friendshipsID
      })
      if (errorInset) {
        toast(errorInset.message)
      }
    }
  }
  async function handleDeBlock(friendshipsID: string) {
    const { data, error } = await supabase.from("friendships").update({
      status: "accepted",
      bloker: null
    }).eq("id", friendshipsID);
  }

  console.log(friends)




  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary">Your Friends</h2>
      {friends.length === 0 ? (
        <div className="text-center p-6 border rounded-lg">
          <p className="text-muted-foreground">No friend </p>
        </div>
      ) : (
        <ScrollArea className="grid gap-4  ">
          {friends.map((friend) => (
            <div key={friend.id} className="flex items-center mb-3 justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={friend.image_url} alt={friend.username} />
                    <AvatarFallback>
                      {friend.username
                        .split(" ")
                        .map((n: any) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <p className="font-medium">{friend.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {friend.email}
                  </p>
                </div>
              </div>
              {friend.bloker ? <>{friend.bloker === user?.id ? <Button  onClick={() => handleDeBlock(friend.friendshipsID)}>Débloquer</Button> : <h1 className="text-primary">You are blocked</h1> } </> : 
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => handleAddConversation(friend.friendshipsID, friend.id)}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Dialog>
                        <DialogTrigger className="w-full h-full" asChild>
                          <Button variant={"ghost"}>
                            <User />
                            View Profile
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-primary">Profile</DialogTitle>
                          </DialogHeader>
                          <div className="flex items-center space-x-2 flex-col">
                            <div className="md:w-[300px] md:h-[300px] flex items-center justify-center">
                              <img className="w-[80%] rounded-full" src={friend.image_url} alt="@user" />
                            </div>
                            <div className="grid flex-1 gap-2 w-full">
                              <Label htmlFor="link" >
                                Username
                              </Label>
                              <Input disabled value={friend.username} />
                              <Label htmlFor="link" >
                                Email
                              </Label>
                              <Input disabled value={friend.email} />
                            </div>
                          </div>
                          <DialogFooter className="sm:justify-start">
                            <DialogClose asChild>
                              <Button type="button" variant="secondary">
                                Close
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Button variant={"ghost"} className="w-full flex justify-start" onClick={() => handleBlock(friend.friendshipsID)}>
                        <Ban />
                        Block
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Button variant={"ghost"} onClick={() => handleDelete(friend.friendshipsID)}>
                        <UserRoundMinus />
                        Remove Friend
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
}
            </div>
          ))}
        </ScrollArea>)
      }
    </div>
  )
}



