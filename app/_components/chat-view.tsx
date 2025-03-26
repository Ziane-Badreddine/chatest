"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowBigDown, ArrowDown, ArrowLeft, Award, Ban, Divide, Download, File, Heading1, Mic, MoreVertical, Paperclip, Pencil, RemoveFormatting, Search, Send, Smile, Trash, Trash2, User, X } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { createClient } from "@supabase/supabase-js"
import EmojiPicker from "emoji-picker-react";
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { error } from "console"





interface ChatViewProps {
  chatId: string,
  onBack: () => void,
}

export default function ChatView({ chatId, onBack }: ChatViewProps) {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [friend, setFreind] = useState<any>();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchMessages, setSearchMessages] = useState<any[]>([]);
  const [status, setStatus] = useState<any>();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { user } = useUser();
  const isMobile = useMobile();
  const inpMessageModify = useRef<HTMLInputElement>(null);
  const inpSearchMessage = useRef<HTMLInputElement>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  );


  useEffect(() => {
    async function fetchFriend() {

      const { data } = await supabase.from("conversations").select(`
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
        ),
        friendship_id(*)
      `).eq("id", chatId).maybeSingle();
      if (data) {
        setFreind(data.user2_id === user?.id ? { ...data.sender } : { ...data.receiver });
        setStatus(data.friendship_id)
      }
    }



    async function fetchMessages() {
      const { data } = await supabase.from("messages").select("id,conversation_id,sender_id(*),content,media_url,created_at").eq("conversation_id", chatId).order("created_at");
      if (data) {
        setMessages(data);
      }
      else {
        setMessages([]);
      }
    }
    fetchMessages();
    fetchFriend();

    const channelMessages = supabase
      .channel("messages-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchMessages()
      })
      .subscribe()
    const channelfriendship = supabase
      .channel("freind-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => {
        fetchFriend();
      })
      .subscribe()
    return () => {
      channelMessages.unsubscribe()
      channelfriendship.unsubscribe();
    }

  }, [user, chatId])



  const handleSendMessage = async () => {
    if (!user) return; // Ensure user is authenticated

    if (newMessage.trim() || selectedFile) {
      try {
        let fileUrl = "";

        // Upload file if selected
        if (selectedFile) {
          const { data: fileData, error: fileError } = await supabase.storage
            .from("media")
            .upload(`public/${Date.now()}_.${selectedFile.name.split(".")[1]}`, selectedFile);

          if (fileError) throw fileError;
          fileUrl = fileData.path;
        }

        // Insert message into the database
        const { error } = await supabase.from("messages").insert([{
          content: newMessage.trim(),
          media_url: fileUrl,
          conversation_id: chatId,
          sender_id: user.id // Use Clerk's user ID directly
        }]);

        if (error) throw error;

        // Reset input fields
        setNewMessage("");
        setSelectedFile(null);

      } catch (error) {
        console.error("Error sending message:", error);
        // Add error handling UI here
      }
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  const handleEmojiClick = (emoji: any) => {
    setNewMessage((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const dowloandFile = async (name: string) => {
    const { data, error } = await supabase.storage.from('media').download(name);
    console.log(data, name)
  }

  function isImageFile(file: File | string): boolean {
    // Liste des extensions d'images courantes
    const imageExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp',
      '.webp', '.tiff', '.svg', '.ico', '.heic'
    ];

    // Récupérer le nom du fichier
    const fileName = typeof file === 'string'
      ? file.toLowerCase()
      : file.name.toLowerCase();

    // Vérifier si le fichier se termine par une des extensions d'image
    return imageExtensions.some(ext => fileName.endsWith(ext));
  }
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messages]);
  let lastDate = "";

  async function handleModifyMessage(id: string) {
    if (inpMessageModify.current && inpMessageModify.current.value.trim()) {
      const { error } = await supabase.from("messages").update({
        content: inpMessageModify.current?.value
      }).eq("id", id)
      if (error) {
        toast(error.message)
      }
    }
  }

  async function handleDeleteMessage(id: string) {
    const { error } = await supabase.from("messages").delete().eq("id", id)
    if (error) {
      toast(error.message)
    }
  }

  async function handleDeleteConversationMessages () {
    const { data, error } = await supabase.from("messages").delete().eq("conversation_id", chatId);
    if (error) {
      toast(error.message)
    }
  }

  async function handleDeleteConversation() {
    await handleDeleteConversationMessages();
    const { data, error } = await supabase.from("conversations").delete().eq("id", chatId);
    if (error) {
      toast(error.message)
    }
    onBack();
  }

  function handleSearchMessages() {
    if (inpSearchMessage.current) {
      if (!inpSearchMessage.current.value.trim()) {
        setSearchMessages([]);
        return;
      }
      let val = inpSearchMessage.current.value.toUpperCase();
      setSearchMessages(messages.filter((value) => value.content.toUpperCase().includes(val)))
    }
  }
  function handleRefSearchMessage(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-yellow-200"); // Ajoute une surbrillance temporaire

      setTimeout(() => {
        el.classList.remove("bg-yellow-200"); // Retire la surbrillance après 2 secondes
      }, 2000);
    }
  }
  async function handleBlock() {
    const { data } = await supabase.from("friendships").update({
      status: "rejected",
      bloker: user?.id
    }).eq("id", status.id);
  }
  async function handleDeBlock() {
    const { data, error } = await supabase.from("friendships").update({
      status: "accepted",
      bloker: null
    }).eq("id", status.id);
  }





  return (
    <div className="flex flex-col   h-full ">
      {/* Chat Header */}
      {friend && <div className="flex items-center gap-3 p-3.5 border-b bg-muted/20">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Avatar className="w-10 h-10 border">
          <AvatarImage src={friend.image_url} alt="Team" />
          <AvatarFallback>SD</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-medium">{friend.username}</h2>
        </div>
        <div className="flex items-center gap-1 ">
          <Sheet>
            <SheetTrigger>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Search className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto ">
              <SheetHeader>
                <SheetTitle>Rechercher des messages</SheetTitle>
                <SheetDescription>
                  Rechercher des messages dans conversation <span className="text-primary">{user?.username}</span>  and <span className="text-primary">{friend.username}</span>
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1">
                <div className="flex items-center  px-4">
                  <Input onChange={handleSearchMessages} ref={inpSearchMessage} placeholder="Rechercher" className=" relative" />
                  <Search className="text-muted-foreground rotate-90 absolute right-7" />
                </div>
                <div className="flex flex-col items-center justify-center gap-3 p-5">
                  {searchMessages.length === 0 ? <div className="text-muted-foreground" >Aucun messages trouve</div> : searchMessages.map((val, index) => {
                    return (
                      <SheetClose asChild>
                        <div key={index} className="container flex flex-col bg-muted-foreground/10 p-5 rounded-xl cursor-pointer hover:bg-muted-foreground/20 overflow-y-auto  " onClick={() => handleRefSearchMessage(val.id)} >
                          <p className="text-muted-foreground">{new Date(val.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          <h1>{val.sender_id.username}:{val.content}</h1>
                        </div>
                      </SheetClose>
                    )
                  })}
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="submit">close</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Dialog>
                  <DialogTrigger className="w-full h-full" asChild>
                    <Button variant={"ghost"} className="flex justify-start text-sm font-mono px-2 py-1.5">
                      Profile
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
              <DropdownMenuItem onClick={() => handleBlock()}>
                Block
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDeleteConversationMessages}>
                Effacer la discussion
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDeleteConversation} >Supprimer la discussion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>}



      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4  " style={{ backgroundSize: "400px" }}>
        <div className="flex flex-col gap-3 container ">
          {messages.map((message: any) => {
            const messageDate = new Date(message.created_at).toLocaleDateString()
            const showDateBadge = messageDate !== lastDate
            lastDate = messageDate
            return (
              <div key={message.id} className="flex flex-col gap-3 ">
                {showDateBadge && (
                  <div className="text-center my-2">
                    <Badge className="px-3 py-1 text-xs">{messageDate}</Badge>
                  </div>
                )}
                <div
                  className={cn(
                    "flex flex-col  max-w-[50%] md:max-w-[70%] px-3 md:px-5 rounded-lg p-3 relative ",
                    message.sender_id.id === user?.id
                      ? "bg-primary/55 text-primary-foreground self-end"
                      : "bg-muted self-start",
                  )}
                  id={message.id}
                >
                  <span className="font-medium text-sm text-primary ">{message.sender_id.username}</span>
                  <p className="text-sm break-words whitespace-pre-line w-full">{message.content}</p>

                  {message.media_url && (
                    <div>
                      {isImageFile(message.media_url) ? (
                        <img
                          className="max-w-full h-auto rounded-md"
                          src={
                            supabase.storage.from("media").getPublicUrl(message.media_url).data.publicUrl ||
                            "/placeholder.svg"
                          }
                          alt="img"
                        />
                      ) : (
                        <div className="flex flex-col gap-2 py-2">
                          <Link
                            target="_blank"
                            href={supabase.storage.from("media").getPublicUrl(message.media_url).data.publicUrl}
                          >
                            <p className="text-sm text-balance line-clamp-1 max-w-[200px] md:max-w-[400px] truncate">
                              {message.media_url}
                            </p>
                          </Link>
                          <Button
                            className="rounded-full"
                            variant={"outline"}
                            size={"icon"}
                            onClick={() => dowloandFile(message.media_url)}
                          >
                            <Download />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {message.sender_id.id === user?.id && !isImageFile(message.media_url) && <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="self-end absolute right-1 top-2 hover:bg-accent rounded-full  "

                      >
                        <ArrowDown className="text-muted-foreground w-3 h-3 " />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <button
                          className="flex items-center justify-center gap-2"
                          onClick={() => handleDeleteMessage(message.id)}

                        >
                          <Trash />
                          Supprimer
                        </button>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant={"ghost"}
                              className="flex items-center justify-start gap-2 w-full"
                            >
                              <Pencil />
                              Modify
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Edit Message</DialogTitle>
                              <DialogDescription>
                                Make changes to your message here. Click save when you're done.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                  Message
                                </Label>
                                <Input ref={inpMessageModify} defaultValue={message.content} className="col-span-3" />
                              </div>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button
                                  onClick={() => handleModifyMessage(message.id)}
                                >Save changes
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>}

                  <span className="text-xs self-end mt-1 opacity-70">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      {status && status.bloker ? (
        <div className="p-3 border-t bg-muted/20 flex items-center justify-center gap-5 md:pb-3 pb-[calc(4rem+0.75rem)]">
          {status.bloker === user?.id ? <> <Button variant={"outline"} className="text-destructive" onClick={handleDeleteConversationMessages}>
            <Trash2 />
            Supprimer la discussion
          </Button>
            <Button onClick={() => handleDeBlock()}>
              <Ban />
              Débloquer
            </Button> </> : <h1>You are blocked</h1>}
        </div>
      ) : (
        <div className="p-3 border-t bg-muted/20 flex items-center gap-2 md:pb-3 pb-[calc(4rem+0.75rem)]">
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-3 md:left[40%] shadow-lg rounded-lg z-10">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Smile className="w-5 h-5" />
          </Button>
          <Label className="cursor-pointer pr-2">
            <Paperclip className="w-4 h-4" />
            <input type="file" className="hidden" onChange={handleFileChange} />
          </Label>

          {selectedFile ? (
            <div className="w-full flex  gap-2 container ">
              <Button onClick={() => setSelectedFile(null)}>
                <X />
              </Button>
              <Badge >{selectedFile.name}</Badge>
            </div>
          ) : (
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Entrez un message"
              className="flex-1 bg-background border-none"// Disable input if blocked
            />
          )}

          <Button variant="ghost" size="icon" className="rounded-full" onClick={handleSendMessage}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      )}

    </div>
  )
}