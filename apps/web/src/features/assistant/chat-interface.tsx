"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/feedback/disclaimer-banner";
import {
  useAskAssistantQuestion,
  type AssistantQuestionResponse,
} from "@/features/assistant/api";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  citations?: Array<{ title?: string; source?: string; url?: string }>;
  suggestedDoctorQuestions?: string[];
  disclaimer?: string;
}

interface ChatInterfaceProps {
  documentId?: string;
  familyMemberId?: string;
  contextTitle?: string;
  placeholder?: string;
  suggestedPrompts?: string[];
}

export function ChatInterface({
  documentId,
  familyMemberId,
  contextTitle = "Health Assistant",
  placeholder = "Ask a question about lab values, medical terms, or next steps...",
  suggestedPrompts = [
    "What do these lab values indicate in plain English?",
    "Are any markers outside the normal reference range?",
    "What questions should I ask my doctor about these results?",
  ],
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-welcome",
      sender: "assistant",
      text: "Hello! I am your MedLab Health Assistant. I can explain complex medical terminology, clarify reference ranges, and help you draft thoughtful questions for your healthcare provider.",
      timestamp: new Date(),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const askMutation = useAskAssistantQuestion();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, askMutation.isPending]);

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || inputQuestion).trim();
    if (!textToSend || askMutation.isPending) return;

    const userMessageId = `user-${Date.now()}`;
    const newMessages: Message[] = [
      ...messages,
      {
        id: userMessageId,
        sender: "user",
        text: textToSend,
        timestamp: new Date(),
      },
    ];

    setMessages(newMessages);
    setInputQuestion("");

    try {
      const response = await askMutation.mutateAsync({
        question: textToSend,
        documentId: documentId || null,
        familyMemberId: familyMemberId || null,
      });

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: response.answer,
        timestamp: new Date(),
        citations: (response.citations || []) as Array<{
          title?: string;
          source?: string;
          url?: string;
        }>,
        disclaimer: response.disclaimer,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unable to reach health assistant service.";
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          sender: "assistant",
          text: `We could not complete your request: ${errMsg}. Please try again shortly.`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const toggleCitation = (msgId: string) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[550px] max-h-[850px] rounded-card border border-border bg-surface shadow-xs overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border bg-surface-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-ai-bg border border-ai-border flex items-center justify-center text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{contextTitle}</h3>
            <p className="text-[11px] text-text-secondary">
              Strictly grounded in your authorized medical records • Non-diagnostic
            </p>
          </div>
        </div>
        <Badge variant="ai" className="text-[10px]">
          AI Assistant Active
        </Badge>
      </div>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const hasCitations = (msg.citations?.length || 0) > 0;
          const citationsOpen = !!expandedCitations[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar Icon */}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser
                    ? "bg-primary text-white"
                    : "bg-ai-bg border border-ai-border text-primary"
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`max-w-[80%] rounded-card p-4 text-xs leading-relaxed space-y-3 ${
                  isUser
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-subtle border border-border text-text-primary shadow-2xs"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Suggested Questions for Doctor */}
                {msg.suggestedDoctorQuestions && msg.suggestedDoctorQuestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/80 space-y-1.5 bg-surface p-3 rounded-button">
                    <span className="font-semibold text-text-primary block text-[11px]">
                      Recommended questions for your doctor:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-text-secondary text-[11px]">
                      {msg.suggestedDoctorQuestions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Citations Toggle */}
                {hasCitations && (
                  <div className="mt-2 pt-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => toggleCitation(msg.id)}
                      className="flex items-center justify-between w-full text-[11px] font-medium text-text-secondary hover:text-text-primary"
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3 text-primary" />
                        <span>{msg.citations!.length} Medical Citations</span>
                      </span>
                      {citationsOpen ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {citationsOpen && (
                      <div className="mt-2 space-y-1.5 pt-1">
                        {msg.citations!.map((c, cIdx) => (
                          <a
                            key={cIdx}
                            href={c.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded bg-surface border border-border hover:border-primary/40 text-[11px] text-text-primary transition-colors"
                          >
                            <span className="truncate pr-2 font-medium">{c.title || "Clinical Reference"}</span>
                            <span className="text-[10px] text-text-tertiary shrink-0">
                              {c.source || "Medical Guideline"}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`text-[10px] pt-1 ${
                    isUser ? "text-white/80 text-right" : "text-text-tertiary"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}

        {askMutation.isPending && (
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-ai-bg border border-ai-border flex items-center justify-center shrink-0 text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="bg-surface-subtle border border-border rounded-card p-4 text-xs text-text-secondary flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span>Analyzing record context and clinical guidelines...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      {messages.length <= 2 && (
        <div className="px-6 py-2.5 bg-surface border-t border-border/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-semibold text-text-tertiary shrink-0">
            Suggestions:
          </span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-subtle hover:bg-ai-bg border border-border hover:border-ai-border text-text-secondary hover:text-primary transition-colors whitespace-nowrap shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Box Area */}
      <div className="p-4 border-t border-border bg-surface">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder={placeholder}
            disabled={askMutation.isPending}
            className="flex-1 text-xs h-10"
          />
          <Button
            type="submit"
            disabled={!inputQuestion.trim() || askMutation.isPending}
            isLoading={askMutation.isPending}
            className="h-10 px-4 gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </Button>
        </form>
        <div className="mt-2 text-center">
          <p className="text-[10px] text-text-tertiary">
            MedLab AI provides educational explanations only and does not formulate medical diagnoses. Consult a licensed physician for healthcare decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
