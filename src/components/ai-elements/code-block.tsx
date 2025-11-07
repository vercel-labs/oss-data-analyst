"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

// Maximum characters before truncation
const MAX_CODE_LENGTH = 50000;
const TRUNCATE_THRESHOLD = 10000;

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  children?: ReactNode;
  maxLength?: number;
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  maxLength = MAX_CODE_LENGTH,
  ...props
}: CodeBlockProps) => {
  const [isDark, setIsDark] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Truncate large code blocks
  const { displayCode, isTruncated } = useMemo(() => {
    if (code.length <= maxLength) {
      return { displayCode: code, isTruncated: false };
    }

    if (isExpanded) {
      return { displayCode: code, isTruncated: true };
    }

    // Show first portion and last portion with ellipsis
    const truncateAt = Math.floor(maxLength / 2);
    const truncated =
      code.slice(0, truncateAt) +
      "\n\n... (truncated " +
      (code.length - maxLength).toLocaleString() +
      " characters) ...\n\n" +
      code.slice(-truncateAt);

    return { displayCode: truncated, isTruncated: true };
  }, [code, maxLength, isExpanded]);

  // Use lighter rendering for very large code blocks
  const shouldUseSimpleRendering = code.length > TRUNCATE_THRESHOLD && !isExpanded;

  const style = isDark ? oneDark : oneLight;

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-md border bg-background text-foreground",
          className
        )}
        {...props}
      >
        <div className="relative">
          {shouldUseSimpleRendering ? (
            <pre className="overflow-auto p-4 font-mono text-sm">
              <code>{displayCode}</code>
            </pre>
          ) : (
            <SyntaxHighlighter
              className="overflow-hidden"
              codeTagProps={{
                className: "font-mono text-sm",
              }}
              customStyle={{
                margin: 0,
                padding: "1rem",
                fontSize: "0.875rem",
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
              }}
              language={language}
              lineNumberStyle={{
                color: "hsl(var(--muted-foreground))",
                paddingRight: "1rem",
                minWidth: "2.5rem",
              }}
              showLineNumbers={showLineNumbers}
              style={style}
            >
              {displayCode}
            </SyntaxHighlighter>
          )}
          {children && (
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {children}
            </div>
          )}
          {isTruncated && (
            <div className="absolute bottom-2 right-2">
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                size="sm"
                variant="secondary"
                className="text-xs"
              >
                {isExpanded ? "Show Less" : "Show Full Code"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator.clipboard.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn("shrink-0", className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};
