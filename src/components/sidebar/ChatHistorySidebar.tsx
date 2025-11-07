"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { HistoryIcon, MessageSquareIcon, PlusIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ChatHistorySidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HistoryIcon className="h-4 w-4" />
          <h2 className="text-sm font-semibold">History</h2>
        </div>
        <Button size="sm" variant="ghost" title="New Chat">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="flex w-full items-start justify-start gap-2 text-left"
          >
            <MessageSquareIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">Sales analysis Q1</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </Button>

          <div className="px-3 py-2 text-sm text-muted-foreground">
            No more history
          </div>
        </div>
      </ScrollArea>

      <div className="mt-auto pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={toggleTheme}
        >
          {mounted && theme === "dark" ? (
            <>
              <SunIcon className="h-4 w-4" />
              <span className="text-sm">Light Mode</span>
            </>
          ) : (
            <>
              <MoonIcon className="h-4 w-4" />
              <span className="text-sm">Dark Mode</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
