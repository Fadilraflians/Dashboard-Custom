"use client";

import React, { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Plus,
  Check,
  TrendingUp,
  BarChart3,
  PieChart,
  Wallet,
  ShieldCheck,
  Landmark,
} from "lucide-react";
import styles from "./page.module.css";

export interface WidgetPayload {
  id: string;
  type: "card" | "chart";
  chartType?: string;
  componentName?: string;
  title: string;
  value?: string;
  sub?: string;
  badge?: string;
  icon?: string;
  tone?: string;
  data?: unknown;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  widgetConfig?: WidgetPayload;
  widgetConfigs?: WidgetPayload[];
}

interface AiGovtechDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeDashboardTitle: string;
  activeWidgets: string[];
  onAddWidget: (widget: WidgetPayload) => void;
  onAddAllWidgets: (widgets: WidgetPayload[]) => void;
}

const STARTER_PROMPTS = [
  "Buat bar chart total penjualan per platform",
  "Buat pie chart jumlah transaksi per kota",
  "Tampilkan kartu total penjualan",
  "Buat tabel ringkasan penjualan per produk",
];

export default function AiGovtechDrawer({
  isOpen,
  onClose,
  activeDashboardTitle,
  activeWidgets,
  onAddWidget,
  onAddAllWidgets,
}: AiGovtechDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-greeting",
      role: "assistant",
      content:
        "Halo! Saya AiGovtech, asisten analitik transaksi fashion. Anda bisa meminta analisis atau visualisasi dari data yang tersedia, misalnya berdasarkan platform, kota, produk, dan metrik penjualan.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function handleSend(textToSend?: string) {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/gateway/aigovtech/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
        }),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resData.message || `Layanan AI gagal (HTTP ${response.status}).`);
      const replyText =
        resData.reply ||
        resData.data?.reply ||
        resData.choices?.[0]?.message?.content;
      if (!replyText) throw new Error("Layanan AI tidak mengirimkan jawaban.");

      const primaryWidget: WidgetPayload | undefined =
        resData.widgetConfig || resData.data?.widgetConfig;
      const allWidgets: WidgetPayload[] | undefined =
        resData.widgetConfigs || resData.data?.widgetConfigs;

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: replyText,
        widgetConfig: primaryWidget,
        widgetConfigs: allWidgets,
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (/\b(tambahkan|terapkan|pasang)\b.*\b(semua|seluruh|lengkap)\b/i.test(query) && allWidgets && allWidgets.length > 0) {
        onAddAllWidgets(allWidgets);
      } else if (/\b(tambahkan|terapkan|pasang)\b/i.test(query) && primaryWidget) {
        onAddWidget(primaryWidget);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: error instanceof Error ? error.message : "Layanan AI tidak dapat dihubungi saat ini.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <aside
        className={styles.drawerPanel}
        onClick={(e) => e.stopPropagation()}
        aria-label="Panel Chatbot AiGovtech"
      >
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderTitle}>
            <div className={styles.drawerBotIcon}>
              <Bot size={18} color="#005e54" />
              <Sparkles size={11} className={styles.drawerSparkle} />
            </div>
            <div>
              <strong>AiGovtech Assistant</strong>
          <small>Analisis Oracle · {activeDashboardTitle}</small>
            </div>
          </div>
          <button
            type="button"
            className={styles.drawerCloseBtn}
            onClick={onClose}
            title="Tutup Panel AI"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conversation Message List */}
        <div className={styles.drawerMessages}>
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={isUser ? styles.msgRowUser : styles.msgRowAssistant}
              >
                {!isUser && (
                  <div className={styles.msgAvatar}>
                    <Bot size={14} color="#ffffff" />
                  </div>
                )}
                <div className={isUser ? styles.msgBubbleUser : styles.msgBubbleAssistant}>
                  <p>{msg.content}</p>

                  {/* Widget Preview inside Chat */}
                  {msg.widgetConfig && (
                    <div className={styles.chatWidgetPreview}>
                      <div className={styles.previewTop}>
                        <div className={styles.previewIconBox}>
                          {msg.widgetConfig.type === "chart" ? (
                            msg.widgetConfig.chartType === "donut" ? (
                              <PieChart size={16} color="#005e54" />
                            ) : (
                              <BarChart3 size={16} color="#005e54" />
                            )
                          ) : msg.widgetConfig.icon === "ShieldCheck" ? (
                            <ShieldCheck size={16} color="#005e54" />
                          ) : msg.widgetConfig.icon === "Landmark" ? (
                            <Landmark size={16} color="#005e54" />
                          ) : msg.widgetConfig.icon === "TrendingUp" ? (
                            <TrendingUp size={16} color="#e04f16" />
                          ) : (
                            <Wallet size={16} color="#005e54" />
                          )}
                        </div>
                        <div className={styles.previewMeta}>
                          <span className={styles.previewTag}>
                            {msg.widgetConfig.type === "chart" ? "Grafik Chart" : "Kartu Metrik"}
                          </span>
                          <strong className={styles.previewTitle}>
                            {msg.widgetConfig.title}
                          </strong>
                          {msg.widgetConfig.value && (
                            <span className={styles.previewValue}>
                              {msg.widgetConfig.value}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.previewActions}>
                        {activeWidgets.includes(msg.widgetConfig.id) ? (
                          <span className={styles.alreadyAddedBadge}>
                            <Check size={13} />
                            <span>Sudah Ada di Dashboard</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={styles.btnAddPreview}
                            onClick={() => onAddWidget(msg.widgetConfig!)}
                          >
                            <Plus size={13} />
                            <span>Tambahkan ke Dashboard Ini</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Multiple Widgets Action */}
                  {msg.widgetConfigs && msg.widgetConfigs.length > 1 && (
                    <div className={styles.chatMultiAction}>
                      <button
                        type="button"
                        className={styles.btnApplyAllWidgets}
                        onClick={() => onAddAllWidgets(msg.widgetConfigs!)}
                      >
                        <Sparkles size={14} />
                        <span>Terapkan Semua ({msg.widgetConfigs.length} Widget)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className={styles.msgRowAssistant}>
              <div className={styles.msgAvatar}>
                <Bot size={14} color="#ffffff" />
              </div>
              <div className={styles.typingIndicator}>
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Prompt Chips */}
        <div className={styles.drawerStarters}>
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className={styles.starterChip}
              onClick={() => void handleSend(prompt)}
            >
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Composer Input Form */}
        <form
          className={styles.drawerComposer}
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <div className={styles.composerWrapper}>
            <textarea
              className={styles.composerInput}
              placeholder="Tanya data atau minta visualisasi widget..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <button
              type="submit"
              className={styles.composerSendBtn}
              disabled={!input.trim() || loading}
              title="Kirim pesan ke AiGovtech"
            >
              <Send size={15} />
            </button>
          </div>
          <span className={styles.composerNote}>
            Enter untuk mengirim · Shift+Enter baris baru · Didukung Oracle Database
          </span>
        </form>
      </aside>
    </div>
  );
}
