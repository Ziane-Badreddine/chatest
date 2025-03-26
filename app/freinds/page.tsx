"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Users, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"
import SearchSection from "../_components/search-section"
import RequestsSection from "../_components/requests-section"
import FriendsSection from "../_components/friends-section"

export default function ChatPage() {
  const [friends, setFriends] = useState<any[]>([])
  const { user } = useUser()

  // Create a Supabase client for the browser
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )

 



  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8 w-full">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Friends</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Requests</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <FriendsSection  />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <RequestsSection  />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <SearchSection  />
        </TabsContent>
      </Tabs>
    </div>
  )
}

