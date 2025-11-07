"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Action, Actions } from "@/components/ai-elements/actions";
import { Fragment, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Response } from "@/components/ai-elements/response";
import { CopyIcon, RefreshCcwIcon, DotIcon, ChevronDownIcon } from "lucide-react";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Loader } from "@/components/ai-elements/loader";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { renderTextWithCharts } from "./renderCharts";
import { VegaLiteChart } from "@/components/charts/VegaLiteChart";

const models = [
  {
    name: "GPT-4.1 (Recommended)",
    value: "gpt-4.1",
  },
  {
    name: "GPT-4o Mini (Faster)",
    value: "gpt-4o-mini",
  },
];

const ChatBotDemo = () => {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>("gpt-4.1");
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate } = useChat();
  const [mounted, setMounted] = useState(false);

  // Determine current phase based on tool calls
  const getCurrentPhase = (messageParts: any[]): "planning" | "building" | "execution" | "reporting" | null => {
    for (const part of messageParts) {
      if (part.type?.startsWith("tool-")) {
        const toolName = part.type.replace("tool-", "");
        if (toolName === "FinalizePlan") return "building";
        if (toolName === "FinalizeBuild") return "execution";
        if (toolName === "ExecuteSQLWithRepair" || toolName === "ExecuteSQL") return "reporting";
        if (["ReadEntityYamlRaw", "LoadEntitiesBulk", "ScanEntityProperties", "AssessEntityCoverage", "SearchCatalog", "SearchSchema", "ClarifyIntent", "FinalizeNoData"].includes(toolName)) return "planning";
        if (["BuildSQL", "ValidateSQL"].includes(toolName)) return "building";
        if (["EstimateCost"].includes(toolName)) return "execution";
        if (["SanityCheck", "FormatResults", "ExplainResults", "FinalizeReport", "generateBarChart", "generateLineChart", "generatePieChart", "generateScatterPlot", "autoSelectVisualization"].includes(toolName)) return "reporting";
      }
    }
    return null;
  };

  const getPhaseLabel = (phase: string | null): string => {
    switch (phase) {
      case "planning": return "Planning";
      case "building": return "Building SQL";
      case "execution": return "Executing Query";
      case "reporting": return "Generating Report";
      default: return "Processing";
    }
  };

  // Set mounted to true after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      }
    );
    setInput("");
  };

  return (
    <div className="relative mx-auto flex h-full w-full max-w-4xl flex-col p-6">
      <div className="flex h-full flex-col">
        <Conversation className="flex-1">
          <ConversationContent>
            {messages.map((message) => {
              const currentPhase = message.role === "assistant" ? getCurrentPhase(message.parts) : null;
              const isStreaming = status === "streaming" && message.id === messages.at(-1)?.id;
              const hasReasoning = message.parts.some((part) => part.type === "reasoning");
              const toolParts = message.parts.filter((part) => part.type?.startsWith("tool-"));
              const hasMultipleTools = toolParts.length > 1;

              // Check if FinalizeReport is complete to determine visibility
              const finalizeReportComplete = message.parts.some(
                (part) =>
                  part.type?.startsWith("tool-FinalizeReport") &&
                  "output" in part &&
                  part.output &&
                  typeof part.output === "object" &&
                  "narrative" in part.output &&
                  typeof (part.output as { narrative: string }).narrative === "string" &&
                  (part.output as { narrative: string }).narrative.length > 0
              );

              // Check if ClarifyIntent is complete to determine visibility
              const clarifyIntentComplete = message.parts.some(
                (part) =>
                  part.type?.startsWith("tool-ClarifyIntent") &&
                  "output" in part &&
                  part.output &&
                  typeof part.output === "object" &&
                  "question" in part.output &&
                  typeof (part.output as { question: string }).question === "string" &&
                  (part.output as { question: string }).question.length > 0
              );

              return (
                <div key={message.id}>
                  {message.role === "assistant" &&
                    message.parts.filter((part) => part.type === "source-url")
                      .length > 0 && (
                      <Sources>
                        <SourcesTrigger
                          count={
                            message.parts.filter(
                              (part) => part.type === "source-url"
                            ).length
                          }
                        />
                        {message.parts
                          .filter((part) => part.type === "source-url")
                          .map((part, i) => (
                            <SourcesContent key={`${message.id}-${i}`}>
                              <Source
                                key={`${message.id}-${i}`}
                                href={part.url}
                                title={part.url}
                              />
                            </SourcesContent>
                          ))}
                      </Sources>
                    )}

                  {/* Show Chain of Thought for multi-step reasoning - hide when FinalizeReport or ClarifyIntent is complete */}
                  {message.role === "assistant" && hasMultipleTools && !finalizeReportComplete && !clarifyIntentComplete && (
                    <ChainOfThought className="mb-4" defaultOpen={false}>
                      <ChainOfThoughtHeader>
                        {isStreaming ? (
                          <Shimmer>{getPhaseLabel(currentPhase)}</Shimmer>
                        ) : (
                          getPhaseLabel(currentPhase) || "Processing"
                        )}
                      </ChainOfThoughtHeader>
                      <ChainOfThoughtContent>
                        {toolParts.map((part, idx) => {
                          if (!part.type?.startsWith("tool-")) return null;
                          const toolName = part.type.replace("tool-", "");
                          const isLastTool = idx === toolParts.length - 1;
                          const toolStatus = isStreaming && isLastTool
                            ? "active"
                            : idx < toolParts.length - 1
                            ? "complete"
                            : "pending";

                          // Create descriptive label based on tool name and input
                          const getToolLabel = (name: string, input: unknown): string => {
                            const baseLabel = name
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())
                              .trim();

                            // Add context from tool input if available
                            if (input && typeof input === "object" && input !== null) {
                              if (name === "SearchCatalog" && "query" in input && typeof input.query === "string") {
                                return `Searching catalog for: "${input.query}"`;
                              }
                              if (name === "SearchSchema" && "keyword" in input && typeof input.keyword === "string") {
                                return `Searching schema for: "${input.keyword}"`;
                              }
                              if (name === "ReadEntityYamlRaw" && "name" in input && typeof input.name === "string") {
                                return `Reading entity: ${input.name}`;
                              }
                              if (name === "AssessEntityCoverage" && "entity" in input && typeof input.entity === "string") {
                                return `Assessing coverage: ${input.entity}`;
                              }
                              if (name === "ScanEntityProperties" && "entity" in input && typeof input.entity === "string") {
                                return `Scanning properties: ${input.entity}`;
                              }
                              if (name === "ClarifyIntent" && "question" in input && typeof input.question === "string") {
                                return `Clarifying: ${input.question}`;
                              }
                              if (name === "LoadEntitiesBulk" && "names" in input && Array.isArray(input.names)) {
                                return `Loading ${input.names.length} entities`;
                              }
                            }

                            return baseLabel;
                          };

                          const toolInput = "input" in part ? part.input : undefined;
                          const label = getToolLabel(toolName, toolInput);

                          return (
                            <ChainOfThoughtStep
                              key={`${message.id}-tool-${idx}`}
                              label={label}
                              status={toolStatus}
                            />
                          );
                        })}
                      </ChainOfThoughtContent>
                    </ChainOfThought>
                  )}

                  {(() => {
                    // Use the finalizeReportComplete check from above scope

                    // Extract narrative from FinalizeReport tool input while streaming
                    const getStreamingNarrative = (): string | null => {
                      const finalizeReportPart = message.parts.find(
                        (part) =>
                          part.type?.startsWith("tool-FinalizeReport") &&
                          "input" in part &&
                          "state" in part &&
                          (part.state === "input-streaming" || part.state === "input-available")
                      );

                      if (finalizeReportPart && "input" in finalizeReportPart) {
                        const input = finalizeReportPart.input;
                        if (
                          typeof input === "object" &&
                          input !== null &&
                          "narrative" in input &&
                          typeof input.narrative === "string"
                        ) {
                          return input.narrative;
                        }
                      }
                      return null;
                    };

                    const streamingNarrative = isStreaming ? getStreamingNarrative() : null;

                    // Filter out tool parts if FinalizeReport or ClarifyIntent is complete (we'll show them in collapsible)
                    const partsToRender = finalizeReportComplete || clarifyIntentComplete
                      ? message.parts.filter(
                          (part) =>
                            !part.type?.startsWith("tool-") ||
                            part.type?.startsWith("tool-FinalizeReport") ||
                            part.type?.startsWith("tool-ClarifyIntent")
                        )
                      : message.parts;

                    return (
                      <>
                        {/* Collapsible tool calls section - shown when FinalizeReport or ClarifyIntent is complete */}
                        {(finalizeReportComplete || clarifyIntentComplete) && (
                          <div className="flex w-full justify-start mb-4">
                            <Collapsible defaultOpen={false} className="max-w-[80%]">
                              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 p-3 text-sm font-medium hover:bg-muted transition-colors">
                                <span className="text-muted-foreground">
                                  View Tool Calls ({toolParts.length})
                                </span>
                                <ChevronDownIcon className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-2 space-y-2">
                                  {message.parts
                                    .filter(
                                      (part) =>
                                        part.type?.startsWith("tool-") &&
                                        !part.type?.startsWith("tool-FinalizeReport") &&
                                        !part.type?.startsWith("tool-ClarifyIntent")
                                    )
                                    .map((part, i) => {
                                      if (
                                        !part.type.startsWith("tool-") ||
                                        !("state" in part) ||
                                        !("input" in part)
                                      ) {
                                        return null;
                                      }

                                      const toolType = part.type as `tool-${string}`;
                                      const toolName = toolType.replace("tool-", "");

                                      return (
                                        <Tool key={`${message.id}-tool-collapsed-${i}`}>
                                          <ToolHeader type={toolType} state={part.state} />
                                          <ToolContent>
                                            <ToolInput input={part.input} />
                                            <ToolOutput
                                              output={
                                                part.output ? (
                                                  <Response>
                                                    {typeof part.output === "string"
                                                      ? part.output
                                                      : JSON.stringify(part.output, null, 2)}
                                                  </Response>
                                                ) : null
                                              }
                                              errorText={part.errorText}
                                            />
                                          </ToolContent>
                                        </Tool>
                                      );
                                    })}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        )}

                        {/* Render message parts */}
                        {partsToRender.map((part, i) => {
                          const isLastPart = i === partsToRender.length - 1;
                    const isStreamingPart = isStreaming && isLastPart && message.id === messages.at(-1)?.id;

                    switch (part.type) {
                      case "text":
                        const textContent = part.text || "";
                        const { hasCharts, elements } = renderTextWithCharts(textContent);
                        
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message from={message.role}>
                              <MessageContent>
                                {isStreamingPart && !part.text ? (
                                  <Shimmer>Generating response...</Shimmer>
                                ) : hasCharts ? (
                                  <div className="space-y-4">
                                    {elements.map((element, idx) => {
                                      if (element.type === "chart" && element.spec) {
                                        // Ensure spec is a plain object before passing
                                        const sanitizedSpec = JSON.parse(JSON.stringify(element.spec));
                                        return (
                                          <div key={idx} className="w-full my-4">
                                            <VegaLiteChart spec={sanitizedSpec} />
                                          </div>
                                        );
                                      }
                                      return (
                                        <Response key={idx}>{element.content}</Response>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <Response>{textContent}</Response>
                                )}
                              </MessageContent>
                            </Message>
                            {message.role === "assistant" &&
                              isLastPart &&
                              part.text && (
                                <Actions className="mt-2">
                                  <Action
                                    onClick={() => regenerate()}
                                    label="Retry"
                                  >
                                    <RefreshCcwIcon className="size-3" />
                                  </Action>
                                  <Action
                                    onClick={() =>
                                      navigator.clipboard.writeText(part.text)
                                    }
                                    label="Copy"
                                  >
                                    <CopyIcon className="size-3" />
                                  </Action>
                                </Actions>
                              )}
                          </Fragment>
                        );
                      case "reasoning":
                        // Find all tool parts in this message (they represent the thinking process)
                        const reasoningToolParts = message.parts
                          .filter((p) => p.type?.startsWith("tool-") && "state" in p && "input" in p)
                          .slice(0, 20); // Limit to first 20 tools to avoid overwhelming UI
                        
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={isStreamingPart}
                            defaultOpen={isStreamingPart || !!part.text || reasoningToolParts.length > 0}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>
                              <div className="space-y-3">
                                {/* Show reasoning text if available */}
                                {part.text && (
                                  <div className="text-sm whitespace-pre-wrap">{part.text}</div>
                                )}
                                
                                {/* Show tool calls and results */}
                                {reasoningToolParts.length > 0 && (
                                  <div className="space-y-2 mt-3">
                                    {reasoningToolParts.map((toolPart, toolIdx) => {
                                      if (!toolPart.type?.startsWith("tool-") || !("state" in toolPart) || !("input" in toolPart)) {
                                        return null;
                                      }
                                      
                                      const toolType = toolPart.type as `tool-${string}`;
                                      const toolName = toolType.replace("tool-", "");
                                      const isToolStreaming = isStreamingPart && (toolPart.state === "input-streaming" || toolPart.state === "input-available");
                                      
                                      // Create descriptive label
                                      const getToolLabel = (name: string, input: unknown): string => {
                                        const baseLabel = name
                                          .replace(/([A-Z])/g, " $1")
                                          .replace(/^./, (str) => str.toUpperCase())
                                          .trim();
                                        
                                        if (input && typeof input === "object" && input !== null) {
                                          if (name === "SearchCatalog" && "query" in input && typeof input.query === "string") {
                                            return `Searching catalog for: "${input.query}"`;
                                          }
                                          if (name === "SearchSchema" && "keyword" in input && typeof input.keyword === "string") {
                                            return `Searching schema for: "${input.keyword}"`;
                                          }
                                          if (name === "ReadEntityYamlRaw" && "name" in input && typeof input.name === "string") {
                                            return `Reading entity: ${input.name}`;
                                          }
                                          if (name === "AssessEntityCoverage" && "name" in input && typeof input.name === "string") {
                                            return `Assessing coverage: ${input.name}`;
                                          }
                                          if (name === "ScanEntityProperties" && "entity" in input && typeof input.entity === "string") {
                                            return `Scanning properties: ${input.entity}`;
                                          }
                                          if (name === "ClarifyIntent" && "question" in input && typeof input.question === "string") {
                                            return `Clarifying: ${input.question}`;
                                          }
                                          if (name === "LoadEntitiesBulk" && "names" in input && Array.isArray(input.names)) {
                                            return `Loading ${input.names.length} entities`;
                                          }
                                        }
                                        return baseLabel;
                                      };
                                      
                                      const toolInput = "input" in toolPart ? toolPart.input : undefined;
                                      const label = getToolLabel(toolName, toolInput);
                                      
                                      return (
                                        <div key={`${message.id}-reasoning-tool-${toolIdx}`} className="text-sm">
                                          <div className="flex items-center gap-2 text-muted-foreground">
                                            <DotIcon className="size-3" />
                                            <span className={isToolStreaming ? "animate-pulse" : ""}>{label}</span>
                                          </div>
                                          {/* Show tool output if available */}
                                          {"output" in toolPart && toolPart.output != null && (
                                            <div className="ml-5 mt-1 text-xs text-muted-foreground/70">
                                              {typeof toolPart.output === "string" 
                                                ? toolPart.output.slice(0, 200) + (toolPart.output.length > 200 ? "..." : "")
                                                : typeof toolPart.output === "object"
                                                ? JSON.stringify(toolPart.output).slice(0, 200) + "..."
                                                : String(toolPart.output).slice(0, 200) + "..."}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                {/* Show placeholder if no content yet */}
                                {!part.text && reasoningToolParts.length === 0 && isStreamingPart && (
                                  <div className="text-sm text-muted-foreground">Thinking...</div>
                                )}
                              </div>
                            </ReasoningContent>
                          </Reasoning>
                        );
                      default:
                        if (
                          part.type.startsWith("tool-") &&
                          "state" in part &&
                          "input" in part
                        ) {
                          const toolType = part.type as `tool-${string}`;
                          const toolName = toolType.replace("tool-", "");
                          const isToolStreaming = isStreamingPart && (part.state === "input-streaming" || part.state === "input-available");

                                // Don't render FinalizeReport tool UI if we're showing the narrative separately
                                if (toolName === "FinalizeReport" && finalizeReportComplete) {
                                  return null;
                                }

                                // Don't render ClarifyIntent tool UI if we're showing the question separately
                                if (toolName === "ClarifyIntent" && clarifyIntentComplete) {
                                  return null;
                                }

                          return (
                            <Tool key={`${message.id}-${i}`}>
                              <ToolHeader type={toolType} state={part.state} />
                              <ToolContent>
                                <ToolInput input={part.input} />
                                <ToolOutput
                                  output={
                                    part.output ? (
                                      <Response>
                                        {typeof part.output === "string"
                                          ? part.output
                                          : JSON.stringify(part.output, null, 2)}
                                      </Response>
                                    ) : isToolStreaming ? (
                                      <Shimmer>{`Executing ${toolName}...`}</Shimmer>
                                    ) : null
                                  }
                                  errorText={part.errorText}
                                />
                              </ToolContent>
                            </Tool>
                          );
                        }
                        return null;
                    }
                  })}
                      </>
                    );
                  })()}
                {/* Display narrative from FinalizeReport as final result with proper streaming */}
                {message.role === "assistant" &&
                  (() => {
                    // Check if there's already a text part - if so, don't duplicate
                    const hasTextPart = message.parts.some(
                      (part) => part.type === "text" && part.text
                    );
                    if (hasTextPart) {
                      return null;
                    }

                    // Find FinalizeReport part
                    const finalizeReportPart = message.parts.find(
                      (part) =>
                        part.type?.startsWith("tool-FinalizeReport") &&
                        "input" in part &&
                        "state" in part
                    );

                    if (!finalizeReportPart) {
                      return null;
                    }

                    // Extract narrative from input (streaming) or output (complete)
                    let narrative: string | null = null;
                    let isStreamingNarrative = false;

                    // Check for narrative in tool input (while streaming)
                    if (
                      "input" in finalizeReportPart &&
                      finalizeReportPart.input &&
                      typeof finalizeReportPart.input === "object" &&
                      "narrative" in finalizeReportPart.input &&
                      typeof finalizeReportPart.input.narrative === "string"
                    ) {
                      narrative = finalizeReportPart.input.narrative;
                      isStreamingNarrative =
                        isStreaming && 
                        (finalizeReportPart.state === "input-streaming" || 
                          finalizeReportPart.state === "input-available");
                    }

                    // Check for narrative in tool output (when complete)
                    if (
                      !narrative &&
                      "output" in finalizeReportPart &&
                      finalizeReportPart.output &&
                      typeof finalizeReportPart.output === "object" &&
                      "narrative" in finalizeReportPart.output &&
                      typeof finalizeReportPart.output.narrative === "string"
                    ) {
                      narrative = finalizeReportPart.output.narrative;
                    }

                    const isLastMessage = message.id === messages.at(-1)?.id;

                    if (narrative || isStreamingNarrative) {
                      return (
                        <Message from={message.role}>
                          <MessageContent>
                            {isStreamingNarrative ? (
                              narrative ? (
                                <Response>{narrative}</Response>
                              ) : (
                                <Shimmer>Generating report...</Shimmer>
                              )
                            ) : narrative ? (
                              <Response>{narrative}</Response>
                            ) : (
                              <Shimmer>Processing...</Shimmer>
                            )}
                          </MessageContent>
                          {narrative && isLastMessage && !isStreaming && (
                            <Actions className="mt-2">
                              <Action
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() =>
                                  navigator.clipboard.writeText(narrative!)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </Action>
                            </Actions>
                          )}
                        </Message>
                      );
                    }
                    return null;
                  })()}
                {/* Display message from FinalizeNoData as final result with proper streaming */}
                {message.role === "assistant" &&
                  (() => {
                    // Check if there's already a text part - if so, don't show FinalizeNoData message
                    const hasTextPart = message.parts.some(
                      (part) => part.type === "text" && part.text
                    );
                    if (hasTextPart) {
                      return null;
                    }

                    // Find FinalizeNoData part
                    const finalizeNoDataPart = message.parts.find(
                      (part) =>
                        part.type?.startsWith("tool-FinalizeNoData") &&
                        "input" in part &&
                        "state" in part
                    );

                    if (!finalizeNoDataPart) {
                      return null;
                    }

                    // Extract message from input (streaming) or output (complete)
                    let messageText: string | null = null;
                    let isStreamingMessage = false;

                    // Check for message in tool input (while streaming)
                    if (
                      "input" in finalizeNoDataPart &&
                      finalizeNoDataPart.input &&
                      typeof finalizeNoDataPart.input === "object" &&
                      "message" in finalizeNoDataPart.input &&
                      typeof finalizeNoDataPart.input.message === "string"
                    ) {
                      messageText = finalizeNoDataPart.input.message;
                      isStreamingMessage =
                        isStreaming && 
                        (finalizeNoDataPart.state === "input-streaming" || 
                          finalizeNoDataPart.state === "input-available");
                    }

                    // Check for message in tool output (when complete)
                    if (
                      !messageText &&
                      "output" in finalizeNoDataPart &&
                      finalizeNoDataPart.output &&
                      typeof finalizeNoDataPart.output === "object" &&
                      "message" in finalizeNoDataPart.output &&
                      typeof finalizeNoDataPart.output.message === "string"
                    ) {
                      messageText = finalizeNoDataPart.output.message;
                    }

                      const isLastMessage = message.id === messages.at(-1)?.id;

                    if (messageText || isStreamingMessage) {
                        return (
                          <Message from={message.role}>
                            <MessageContent>
                            {isStreamingMessage ? (
                              messageText ? (
                                <Response>{messageText}</Response>
                              ) : (
                                <Shimmer>Preparing response...</Shimmer>
                              )
                            ) : messageText ? (
                              <Response>{messageText}</Response>
                              ) : (
                                <Shimmer>Processing...</Shimmer>
                              )}
                            </MessageContent>
                          {messageText && isLastMessage && !isStreaming && (
                              <Actions className="mt-2">
                                <Action
                                  onClick={() => regenerate()}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </Action>
                                <Action
                                  onClick={() =>
                                  navigator.clipboard.writeText(messageText!)
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </Action>
                              </Actions>
                            )}
                          </Message>
                        );
                      }
                    return null;
                  })()}
                {/* Display question from ClarifyIntent as final result with proper streaming */}
                {message.role === "assistant" &&
                  (() => {
                    // Check if there's already a text part - if so, don't show ClarifyIntent question
                    const hasTextPart = message.parts.some(
                      (part) => part.type === "text" && part.text
                    );
                    if (hasTextPart) {
                      return null;
                    }

                    // Find ClarifyIntent part
                    const clarifyIntentPart = message.parts.find(
                      (part) =>
                        part.type?.startsWith("tool-ClarifyIntent") &&
                        "input" in part &&
                        "state" in part
                    );

                    if (!clarifyIntentPart) {
                      return null;
                    }

                    // Extract question from input (streaming) or output (complete)
                    let question: string | null = null;
                    let isStreamingQuestion = false;

                    // Check for question in tool input (while streaming)
                    if (
                      "input" in clarifyIntentPart &&
                      clarifyIntentPart.input &&
                      typeof clarifyIntentPart.input === "object" &&
                      "question" in clarifyIntentPart.input &&
                      typeof clarifyIntentPart.input.question === "string"
                    ) {
                      question = clarifyIntentPart.input.question;
                      isStreamingQuestion =
                        isStreaming && 
                        (clarifyIntentPart.state === "input-streaming" || 
                          clarifyIntentPart.state === "input-available");
                    }

                    // Check for question in tool output (when complete)
                    if (
                      !question &&
                      "output" in clarifyIntentPart &&
                      clarifyIntentPart.output &&
                      typeof clarifyIntentPart.output === "object" &&
                      "question" in clarifyIntentPart.output &&
                      typeof clarifyIntentPart.output.question === "string"
                    ) {
                      question = clarifyIntentPart.output.question;
                    }

                    const isLastMessage = message.id === messages.at(-1)?.id;

                    if (question || isStreamingQuestion) {
                      return (
                        <Message from={message.role}>
                          <MessageContent>
                            {isStreamingQuestion ? (
                              question ? (
                                <Response>{question}</Response>
                              ) : (
                                <Shimmer>Preparing question...</Shimmer>
                              )
                            ) : question ? (
                              <Response>{question}</Response>
                            ) : (
                              <Shimmer>Processing...</Shimmer>
                            )}
                          </MessageContent>
                          {question && isLastMessage && !isStreaming && (
                            <Actions className="mt-2">
                              <Action
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() =>
                                  navigator.clipboard.writeText(question!)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </Action>
                            </Actions>
                          )}
                        </Message>
                      );
                    }
                    return null;
                  })()}
                </div>
              );
            })}
            {status === "submitted" && (
              <div className="flex items-center gap-2 py-4">
                <Loader />
                <Shimmer>Processing your request...</Shimmer>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>


        <PromptInput
          onSubmit={handleSubmit}
          className="mt-4"
          globalDrop
          multiple
        >
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model) => (
                    <PromptInputModelSelectItem
                      key={model.value}
                      value={model.value}
                    >
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};

export default ChatBotDemo;
