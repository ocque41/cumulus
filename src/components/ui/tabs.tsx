"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  variant = "glass",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: "glass" | "solid" }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-10 w-fit items-center justify-center rounded-[5.5px] p-[3px]",
        variant === "glass" && "glass-surface glass-subtle glass-e1 text-[color:var(--glass-text-muted)]",
        variant === "solid" && "bg-muted text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  variant = "glass",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { variant?: "glass" | "solid" }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow,transform]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--glass-text-body)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] disabled:pointer-events-none disabled:opacity-50",
        variant === "glass" &&
          "text-[color:var(--glass-text-muted)] data-[state=active]:glass-surface data-[state=active]:glass-standard data-[state=active]:glass-e1 data-[state=active]:text-[color:var(--glass-text-body)]",
        variant === "solid" &&
          "text-foreground dark:text-muted-foreground data-[state=active]:bg-background dark:data-[state=active]:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
