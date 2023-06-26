"use client"

import React, { createContext, useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Profile } from "@/types"
import type { AuthError, Session } from "@supabase/supabase-js"
import useSWR from "swr"

import { useSupabase } from "./supabase-provider"

interface AuthContext {
  user: Profile | null|undefined
  error: AuthError | null
  isLoading: boolean
  mutate: any
  signOut: () => Promise<void>
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<void | string|AuthError>
  signInWithGithub: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithTwitter: () => Promise<void>
  signInWithEmailPassword: (
    email: string,
    password: string
  ) => Promise<string | null | void>
  signInWithMagicLink: (email: string) => Promise<void>
}

const Context = createContext<AuthContext>({
  user: null,
  error: null,
  isLoading: true,
  mutate: null,
  signOut: async () => {},
  signUp: async () => {},
  signInWithGithub: async () => {},
  signInWithFacebook: async () => {},
  signInWithGoogle: async () => {},
  signInWithTwitter: async () => {},
  signInWithEmailPassword: async () => {},
  signInWithMagicLink: async () => {},
})

export default function SupabaseAuthProvider({
  serverSession,
  children,
}: {
  serverSession?: Session |null | undefined
  children: React.ReactNode
}) {
  const { supabase } = useSupabase()
  const router = useRouter()

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
        emailRedirectTo:
          process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
            ? "https://mahdeehasanstudio.vercel.app/dashboard"
            : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
            ? "https://preview-mahdeehasanstudio.vercel.app/dashboard"
            : "http://localhost:3000/dashboard",
      },
    })
    if (error) {
      console.log(error)
      return error
    } else {
      console.log(data)
    }
  }

  const getUser = async () => {
    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", serverSession?.user?.id)
      .single()
    if (error) {
      return null
    } else {
      return user
    }
  }

  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useSWR(serverSession ? "profile-context" : null, getUser)

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/signin")
    console.log("Signed Out! (from supabase-auth-provider.tsx)")
  }

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
            ? "https://mahdeehasanstudio.vercel.app/dashboard"
            : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
            ? "https://preview-mahdeehasanstudio.vercel.app/dashboard"
            : "http://localhost:3000/dashboard",
      },
    })
  }

  const signInWithFacebook = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
            ? "https://mahdeehasanstudio.vercel.app/dashboard"
            : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
            ? "https://preview-mahdeehasanstudio.vercel.app/dashboard"
            : "http://localhost:3000/dashboard",
      },
    })
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
            ? "https://mahdeehasanstudio.vercel.app/dashboard"
            : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
            ? "https://preview-mahdeehasanstudio.vercel.app/dashboard"
            : "http://localhost:3000/dashboard",
      },
    })
  }

  const signInWithTwitter = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo:
          process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
            ? "https://mahdeehasanstudio.vercel.app/dashboard"
            : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
            ? "https://preview-mahdeehasanstudio.vercel.app/dashboard"
            : "http://localhost:3000/dashboard",
      },
    })
  }

  const signInWithEmailPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      console.log(error)
      return null
    } else {
      return user?.id
    }
  }

  const signInWithMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://example.com/dashboard",
      },
    })
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== serverSession?.access_token) {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, serverSession?.access_token]);

  const exposed: AuthContext = {
    user,
    error,
    isLoading,
    mutate,
    signOut,
    signUp,
    signInWithGithub,
    signInWithFacebook,
    signInWithGoogle,
    signInWithTwitter,
    signInWithEmailPassword,
    signInWithMagicLink,
  }

  return <Context.Provider value={exposed}>{children}</Context.Provider>
}

export const useAuth = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useAuth must be used inside SupabaseAuthProvider")
  } else {
    return context
  }
}
