import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type ChatRole = "user" | "assistant";
type ConnectionStatus =
  | "checking"
  | "connected"
  | "database-disconnected"
  | "model-disconnected"
  | "disconnected";

interface ChatMessage {
  id: number;
  role: ChatRole;
  content: string;
  widget?: any;
  widgets?: any[];
}

interface ChatResponse {
  message?: string;
  reply?: string;
  answer?: string;
  widgetConfig?: any;
  widgetConfigs?: any[];
  choices?: Array<{ message?: { content?: string } }>;
  data?: {
    message?: string;
    reply?: string;
    answer?: string;
    widgetConfig?: any;
    widgetConfigs?: any[];
    choices?: Array<{ message?: { content?: string } }>;
  };
}

interface HealthResponse {
  connected?: boolean;
  databaseConnected?: boolean;
  modelConnected?: boolean;
  tenant?: "fashion" | "kemenkeu";
}

const greeting: ChatMessage = {
  id: 1,
  role: "assistant",
  content:
    "Halo, saya AiGovtech, asisten analitik data. Saya dapat menganalisis database perusahaan yang sedang Anda akses dan membuat visualisasi dari hasilnya.",
};

const fashionStarterPrompts = [
  "Apa saja header dan nilai yang tersedia di database?",
  "Buatkan bar chart berdasarkan data penjualan perbulan",
  "Tampilkan kartu Total Pendapatan dan Transaksi",
  "Tampilkan produk fashion terlaris",
  "Terapkan semua widget rekomendasi fashion",
];

const kemenkeuStarterPrompts = [
  "Apa saja kolom dan nilai yang tersedia di database?",
  "Buatkan bar chart jumlah transaksi berdasarkan platform e-commerce",
  "Buatkan line chart total pembayaran per bulan",
  "Tampilkan kartu total pembayaran dan jumlah transaksi",
  "Bandingkan profit berdasarkan kategori produk",
];

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([greeting]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("checking");
  const [tenant, setTenant] = useState<"fashion" | "kemenkeu" | null>(null);
  const nextId = useRef(2);
  const endRef = useRef<HTMLDivElement>(null);
  const appId = typeof window === "undefined"
    ? 0
    : Number(new URLSearchParams(window.location.search).get("appId") || 0);

  useEffect(() => {
    let active = true;

    async function checkConnection() {
      try {
        const response = await fetch(`/api/gateway/aigovtech/health?appId=${appId}`, {
          cache: "no-store",
        });
        const health = (await response.json().catch(() => ({}))) as HealthResponse;
        if (active) {
          if (health.tenant && health.tenant !== tenant) {
            setTenant(health.tenant);
            if (nextId.current === 2) {
              setMessages([{
                id: 1,
                role: "assistant",
                content: health.tenant === "kemenkeu"
                  ? "Halo, saya AiGovtech, asisten analitik e-commerce Kementerian Keuangan. Saya dapat menganalisis transaksi, platform, produk, wilayah, dan membuat kartu atau grafik dari database e-commerce."
                  : "Halo, saya AiGovtech, asisten analitik data Fashion Kementerian Kesehatan. Saya dapat menganalisis transaksi dan membuat kartu atau grafik dari database Fashion.",
              }]);
            }
          }
          if (!response.ok || (!health.modelConnected && !health.databaseConnected)) {
            setConnectionStatus("disconnected");
          } else if (!health.modelConnected) {
            setConnectionStatus("model-disconnected");
          } else if (!health.databaseConnected) {
            setConnectionStatus("database-disconnected");
          } else {
            setConnectionStatus("connected");
          }
        }
      } catch {
        if (active) setConnectionStatus("disconnected");
      }
    }

    void checkConnection();
    const intervalId = window.setInterval(() => void checkConnection(), 15000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [appId, tenant]);

  const starterPrompts = tenant === "kemenkeu"
    ? kemenkeuStarterPrompts
    : fashionStarterPrompts;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    const userMessage: ChatMessage = {
      id: nextId.current++,
      role: "user",
      content,
    };
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setDraft("");
    setError(null);
    setSending(true);

    try {
      const response = await fetch("/api/gateway/aigovtech/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          messages: conversation.map(({ role, content: text }) => ({
            role,
            content: text,
          })),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as ChatResponse;
      if (!response.ok) {
        throw new Error(data.message || "Pesan belum dapat diproses.");
      }

      const reply =
        data.data?.reply ??
        data.reply ??
        data.data?.answer ??
        data.answer ??
        data.data?.choices?.[0]?.message?.content ??
        data.choices?.[0]?.message?.content ??
        data.data?.message;
      if (!reply) throw new Error("Layanan AI tidak mengirimkan jawaban.");

      const widget = (data as any).widgetConfig || (data as any).data?.widgetConfig;
      const widgets = (data as any).widgetConfigs || (data as any).data?.widgetConfigs;

      // Broadcast to custom-dashboard MFE
      if (widget && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("aigovtech:add-widget", { detail: widget }),
        );
        try {
          localStorage.setItem(
            "aigovtech_latest_widget",
            JSON.stringify({ widget, ts: Date.now() }),
          );
        } catch {}
      }
      if (Array.isArray(widgets) && widgets.length > 0 && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("aigovtech:add-widgets", { detail: widgets }),
        );
        try {
          localStorage.setItem(
            "aigovtech_latest_widgets",
            JSON.stringify({ widgets, ts: Date.now() }),
          );
        } catch {}
      }

      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          content: reply,
          widget,
          widgets,
        },
      ]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Terjadi kesalahan saat menghubungi AIGovtech.",
      );
    } finally {
      setSending(false);
    }
  }

  function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <section className="aiGovtech" aria-label="Percakapan AIGovtech">
      <header className="aiGovtechHeader">
        <span className="aiGovtechMark" aria-hidden="true">
          AI
        </span>
        <div className="aiGovtechIdentity">
          <strong>AIGovtech</strong>
          <span
            className={`aiGovtechConnection aiGovtechConnection-${connectionStatus}`}
            role="status"
            aria-label={`Status koneksi AI: ${connectionStatus}`}
          >
            <i />
            {connectionStatus === "connected"
              ? `Model dan database ${tenant === "kemenkeu" ? "e-commerce" : "Fashion"} terhubung`
              : connectionStatus === "database-disconnected"
                ? "Oracle Database tidak terhubung"
                : connectionStatus === "model-disconnected"
                  ? "Layanan AI tidak terhubung"
                  : connectionStatus === "disconnected"
                    ? "AI dan Oracle tidak terhubung"
                    : "Memeriksa koneksi AI dan Oracle"}
          </span>
        </div>
      </header>

      <div className="aiGovtechMessages" aria-live="polite">
        <p className="aiGovtechDate">MULAI PERCAKAPAN DENGAN AIGOVTECH</p>
        {messages.map((message) => (
          <article
            className={`aiMessage aiMessage-${message.role}`}
            key={message.id}
          >
            {message.role === "assistant" && (
              <span className="aiMessageAvatar">AI</span>
            )}
            <div className="aiMessageBody">
              <p style={{ whiteSpace: "pre-line" }}>{message.content}</p>
              {message.widget && (
                <div className="aiWidgetCardBadge">
                  <div className="aiWidgetBadgeRow">
                    <span className="aiWidgetCheckIcon">✓</span>
                    <span className="aiWidgetTitleText">
                      Widget <strong>{message.widget.title}</strong> langsung ditampilkan ke Dashboard aktif
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btnReapplyWidget"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(
                          new CustomEvent("aigovtech:add-widget", {
                            detail: message.widget,
                          }),
                        );
                      }
                    }}
                  >
                    Tampilkan Lagi di Dashboard
                  </button>
                </div>
              )}
              {Array.isArray(message.widgets) && message.widgets.length > 1 && (
                <div className="aiWidgetCardBadge">
                  <div className="aiWidgetBadgeRow">
                    <span className="aiWidgetCheckIcon">✓</span>
                    <span className="aiWidgetTitleText">
                      <strong>{message.widgets.length} Widget</strong> telah diterapkan ke Dashboard aktif
                    </span>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
        {messages.length === 1 && !sending && (
          <div className="aiStarterPrompts" aria-label="Pertanyaan awal">
            {starterPrompts.map((prompt) => (
              <button
                type="button"
                className="aiStarterPrompt"
                key={prompt}
                onClick={() => setDraft(prompt)}
              >
                <span aria-hidden="true">↗</span>
                {prompt}
              </button>
            ))}
          </div>
        )}
        {sending && (
          <div
            className="aiTyping"
            role="status"
            aria-label="AIGovtech sedang menganalisis data"
          >
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="aiComposer" onSubmit={sendMessage}>
        {error && (
          <p className="aiComposerError" role="alert">
            {error}
          </p>
        )}
        <div className="aiComposerBox">
          <textarea
            aria-label="Tulis pesan untuk AIGovtech"
            placeholder="Minta analisis atau buatkan grafik (contoh: buatkan bar chart data penjualan perbulan)..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={submitOnEnter}
            rows={2}
            maxLength={4000}
          />
          <button
            type="submit"
            aria-label="Kirim pesan"
            disabled={!draft.trim() || sending}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12 20 4l-5 16-3-7-8-1Z" />
              <path d="m12 13 4-4" />
            </svg>
          </button>
        </div>
        <p className="aiComposerHint">
          Enter untuk mengirim · Jawaban analitik memakai data Oracle
        </p>
      </form>
    </section>
  );
}
