"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { UserPlus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import supabase from "@/lib/supabaseServer"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"
import { ScrollArea } from "@/components/ui/scroll-area"



export default function SearchSection() {
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"username" | "email">("username")
  const { user } = useUser();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

  useEffect(() => {
    if (!user) return

    async function fetchUsers() {
      const { data: friendsData, error: friendsError } = await supabase
        .from("friendships")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)

      if (friendsError) {
        console.log("Error fetching friends:", friendsError)
        return
      }

      // Extract friend IDs (exclude current user)
      const currentUserId = user?.id
      const friendIds =
        friendsData?.flatMap((friend) =>
          friend.sender_id === currentUserId ? friend.receiver_id : friend.sender_id,
        ) || []

      const query = supabase.from("users").select("*").neq("id", user?.id)

      const { data, error } = await query

      if (error) {
        console.log("Error fetching users:", error)
        return
      }

      if (data) {
        if (friendIds.length > 0) {
          const dataUsers = data.filter((u) => !friendIds.includes(u.id))
          setUsers(dataUsers)
        } else {
          setUsers(data)
        }
      }
    }
    fetchUsers();
    const channelUsers = supabase
      .channel("users-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => fetchUsers())
      .subscribe()
    const channelFriends = supabase
      .channel("friends-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => {
        fetchUsers();
      })
      .subscribe()
    return () => {
      channelUsers.unsubscribe()
      channelFriends.unsubscribe()
    }
  }, [user])


  const filteredUsers = searchQuery
    ? users?.filter((user) => {
      const field = searchType === "username" ? user.username : user.email
      return field?.toLowerCase().includes(searchQuery.toLowerCase())
    })
    : []


  const handleAdd = async (id: string) => {
    if (!user) return
    try {
      toast.success("friend added...");
      const { data, error } = await supabase.from("friendships").insert([{
        receiver_id: id,
        sender_id: user?.id,
      }])
      if (data) {
        toast("friend added");
      }
    } catch (error) {
      toast("oops")
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary">Find Friends</h2>

      <Tabs defaultValue="username" onValueChange={(value) => setSearchType(value as "username" | "email")}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="username">Search by username</TabsTrigger>
          <TabsTrigger value="email">Search by Email</TabsTrigger>
        </TabsList>

        <div className="mb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by ${searchType}...`}
            className="w-full"
          />
        </div>
      </Tabs>

      {searchQuery && (
        <div className="grid gap-4">
          <ScrollArea className="grid gap-4  ">
          {filteredUsers && filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="flex mb-3 items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.image_url ?? ''} alt={"@user"} />
                    <AvatarFallback>
                      {user.username
                        ?.split(" ")
                        .map((n: any) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div>
                  <Button className="flex items-center gap-2" onClick={() => handleAdd(user.id)}>
                    <UserPlus className="h-4 w-4" />
                    Add Friend
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-6 border rounded-lg">
              <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
            </div>
          )}
          </ScrollArea>
        </div>
      )}

      {!searchQuery && (
        <div className="text-center p-6 border rounded-lg">
          <p className="text-muted-foreground">Enter a search term to find friends</p>
        </div>
      )}
    </div>
  )
}

