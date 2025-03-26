"use client"
import { redirect } from "next/navigation";
import VerticalNav from "./_components/vertical-nav";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import supabase from "@/lib/supabaseServer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Send } from "lucide-react";



export default function Home() {
  const { user } = useUser();
  useEffect(() => {
    async function connectUser() {
      const { data: d } = await supabase
        .storage
        .listBuckets()


      console.log(d)
      if (!user) return;
      const { data: data1, error: error1 } = await supabase.from("users").select("*").eq("id", user.id);

      if (data1 && data1.length > 0) {
        return
      }
      const { data: data2, error: error2 } = await supabase.from("users").insert([{
        id: user.id,
        email: user.emailAddresses[0].emailAddress,
        image_url: user.imageUrl,
        username: user.username,
      }])

    }
    connectUser();

  }, [])

  return (
    <section className="flex flex-col items-center justify-center text-center py-20 px-6 h-full">
      <h1 className="text-5xl font-bold mb-4">Discutez en toute simplicité</h1>
      <p className="text-lg max-w-2xl mb-6 text-muted-foreground">
        Connectez-vous instantanément avec vos amis et votre communauté. Sécurisé, rapide et fluide.
      </p>
      <Link href={"/discussions"}>
        <Button className=" font-semibold px-6 py-3 rounded-lg shadow-md  ">
          Commencer à discuter
          <Send />
        </Button>
      </Link>

    </section>
  )
}

