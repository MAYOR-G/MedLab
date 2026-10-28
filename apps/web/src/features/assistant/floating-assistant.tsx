"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Sparkles,
  X,
  Send,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useActiveMember } from "@/features/family/active-member-context";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: { title: string; source: string; url?: string }[];
  timestamp: string;
  isStreaming?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "init-1",
    sender: "assistant",
    text: "Hello! I am your MedLab Health Literacy Assistant. I can help translate laboratory terminology into clear plain English, explain reference intervals, or suggest questions for your next doctor visit.\n\nHow can I help you understand your records today?",
    timestamp: "Just now",
  },
];

const SUGGESTED_QUESTIONS = [
  "What does my 108 mg/dL fasting glucose mean?",
  "What questions should I ask about my lipid panel?",
  "Can you explain the difference between HDL and LDL?",
  "Why is eGFR important on a kidney test?",
];

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { selectedMember } = useActiveMember();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Movable / Adjustable position state (Y-coordinate in pixels from top)
  const [positionY, setPositionY] = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startPosYRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Set default initial Y position once window dimensions are available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 640;
      // Default: 80px above bottom on mobile, 32px on desktop
      const defaultY = isMobile
        ? window.innerHeight - 144
        : window.innerHeight - 90;
      setPositionY(defaultY);
    }
  }, []);

  // Pointer drag event handlers for repositioning
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startYRef.current = e.clientY;
    startPosYRef.current = positionY ?? (window.innerHeight - 100);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = e.clientY - startYRef.current;
    if (Math.abs(deltaY) > 4) {
      hasMovedRef.current = true;
    }
    const newY = startPosYRef.current + deltaY;
    // Clamp to stay comfortably within viewport bounds
    const clampedY = Math.max(70, Math.min(window.innerHeight - 90, newY));
    setPositionY(clampedY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    // If not dragged, treat as click to open
    if (!hasMovedRef.current) {
      setIsOpen(true);
    }
  };

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Simulated streaming AI response
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || isTyping) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Prepare simulated clinical streaming response
    let responseText = "";
    let citations: { title: string; source: string; url?: string }[] = [];

    if (text.toLowerCase().includes("glucose")) {
      responseText =
        "Your recent Fasting Blood Glucose was reported at **108 mg/dL**.\n\n• **Standard Reference Range:** 70–99 mg/dL is considered normal.\n• **Clinical Context:** Values between 100–125 mg/dL fall into the 'Impaired Fasting Glucose' (borderline prediabetes) category according to clinical criteria.\n• **What it means in plain English:** After an overnight fast, your cells did not clear glucose from your bloodstream as quickly as typical baseline levels. This is frequently influenced by diet, physical activity, sleep, or genetics.\n\n**Suggested Questions for Your Doctor:**\n1. Should we test my HbA1c to see my 3-month average blood sugar?\n2. Are dietary changes or exercise modifications recommended first?\n3. When should we re-test this panel?";
      citations = [
        {
          title: "Classification and Diagnosis of Diabetes",
          source: "American Diabetes Association (ADA) 2024",
          url: "https://diabetes.org",
        },
      ];
    } else if (
      text.toLowerCase().includes("lipid") ||
      text.toLowerCase().includes("cholesterol") ||
      text.toLowerCase().includes("hdl") ||
      text.toLowerCase().includes("ldl")
    ) {
      responseText =
        "Here is a plain-English breakdown of your lipid indicators:\n\n• **Total Cholesterol (215 mg/dL):** Slightly elevated above the desirable target of <200 mg/dL.\n• **LDL ('Bad' Cholesterol - 132 mg/dL):** Transports cholesterol to arteries. Target is typically under 100 mg/dL.\n• **HDL ('Good' Cholesterol):** Helps scavenge and remove excess cholesterol from blood vessels back to the liver.\n\n**Next Steps:** Your doctor may evaluate your overall cardiovascular risk score (taking blood pressure, age, and family history into account) before deciding if medication is ever warranted or if lifestyle adjustments are sufficient.";
      citations = [
        {
          title: "Guideline on the Management of Blood Cholesterol",
          source: "American College of Cardiology (ACC/AHA)",
          url: "https://acc.org",
        },
      ];
    } else {
      responseText =
        `Regarding "${text}":\n\nBased on your active records for ${selectedMember ? selectedMember.fullName : "your family vault"}, all primary metabolic and renal markers remain stable. When reviewing complex test results, remember that minor fluctuations outside the reference interval can occur for many benign reasons, including hydration status and fasting duration.\n\nAlways discuss unexpected findings directly with your prescribing physician.`;
      citations = [
        {
          title: "Understanding Diagnostic Lab Tests",
          source: "National Library of Medicine (MedlinePlus)",
          url: "https://medlineplus.gov",
        },
      ];
    }

    // Stream the response text token by token for an authentic AI streaming experience
    const assistantMsgId = `ai-${Date.now()}`;
    const initialAiMsg: Message = {
      id: assistantMsgId,
      sender: "assistant",
      text: "",
      citations,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, initialAiMsg]);

    const words = responseText.split(" ");
    let currentWordIndex = 0;

    const streamInterval = setInterval(() => {
      if (currentWordIndex < words.length) {
        const nextChunk = words.slice(0, currentWordIndex + 1).join(" ");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, text: nextChunk } : msg
          )
        );
        currentWordIndex++;
      } else {
        clearInterval(streamInterval);
        setIsTyping(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
          )
        );
      }
    }, 28);
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <>
      {/* Floating Action Button: Sleek Circular Robot Icon, Movable & Adjustable */}
      {!isOpen && (
        <div
          style={{
            top: positionY !== null ? `${positionY}px` : undefined,
          }}
          className={cn(
            "fixed right-4 sm:right-6 z-40 touch-none select-none",
            positionY === null && "bottom-20 sm:bottom-6"
          )}
        >
          <div className="relative group">
            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              title="MedLab AI Health Assistant (Drag to reposition)"
              className="h-12 w-12 sm:h-13 sm:w-13 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-transform duration-150 flex items-center justify-center border border-white/20 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <Bot className="h-6 w-6 text-white" />
              {/* Active pulsing badge */}
              <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
            </button>

            {/* Subtle drag hint tooltip on hover */}
            <span className="hidden sm:group-hover:flex items-center gap-1 absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900/90 text-white text-[11px] font-medium rounded-lg whitespace-nowrap shadow-md pointer-events-none transition-opacity">
              <Sparkles className="h-3 w-3 text-blue-300" />
              <span>AI Health Assistant (Drag to move)</span>
            </span>
          </div>
        </div>
      )}

      {/* Floating Slide-over / Modal Chat Screen */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:h-[620px] z-50 flex flex-col bg-surface rounded-none sm:rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-blue-600/60 border border-blue-400/30 flex items-center justify-center text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-tight flex items-center gap-2">
                  <span>MedLab Health Assistant</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] py-0 px-1 border-white/30 text-blue-200 uppercase tracking-widest font-semibold"
                  >
                    AI Active
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-300 font-medium">
                  {selectedMember ? `Scope: ${selectedMember.fullName}` : "All Family Records"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Reset Conversation"
                className="h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="h-7 w-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mandatory Non-Diagnostic Disclaimer Strip */}
          <div className="px-3.5 py-2 bg-blue-50/80 border-b border-blue-100 flex items-start gap-2 shrink-0 text-[11px] text-slate-700 leading-tight">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              For health literacy only. AI summaries do not provide diagnostic advice. Always consult your doctor.
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[88%]",
                  msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "p-3 rounded-2xl shadow-2xs leading-relaxed",
                    msg.sender === "user"
                      ? "bg-primary text-white rounded-br-xs font-medium"
                      : "bg-surface border border-slate-200/80 text-slate-800 rounded-bl-xs"
                  )}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Typing Indicator for Streaming message */}
                  {msg.isStreaming && (
                    <span className="inline-block h-3 w-1.5 ml-1 bg-primary animate-pulse align-middle" />
                  )}

                  {/* Source Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] space-y-1">
                      <div className="font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-primary" />
                        <span>Clinical Sources</span>
                      </div>
                      {msg.citations.map((cite, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-primary bg-blue-50/60 p-1.5 rounded-md"
                        >
                          <span className="font-medium truncate">{cite.source}</span>
                          {cite.url && (
                            <ExternalLink className="h-3 w-3 shrink-0 ml-1 text-slate-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          {messages.length <= 2 && (
            <div className="p-3 bg-surface border-t border-slate-100 shrink-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <HelpCircle className="h-3 w-3 text-primary" />
                <span>Suggested Questions</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {SUGGESTED_QUESTIONS.slice(0, 2).map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="text-left text-xs text-slate-700 bg-slate-50 hover:bg-blue-50/70 hover:text-primary px-2.5 py-1.5 rounded-lg border border-slate-200/80 transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate">{q}</span>
                    <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-surface border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about lab results, units, or doctor queries..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isTyping}
                className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all disabled:opacity-50"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputValue.trim() || isTyping}
                className="h-9 px-3 rounded-xl bg-primary hover:bg-blue-700 shadow-xs shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
