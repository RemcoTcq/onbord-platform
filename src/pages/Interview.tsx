import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, CheckCircle, AlertTriangle } from "lucide-react";

const REDIRECT_SECONDS = 5;

type Msg = { role: "user" | "assistant"; content: string };

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const Interview = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<{
    candidate: { first_name: string; last_name: string };
    request: { title: string };
    status: string;
  } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${FN_BASE}/get-interview-session?token=${encodeURIComponent(token)}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) {
          setError(j.error || "Erreur");
        } else {
          setInfo({ candidate: j.candidate, request: j.request, status: j.session.status });
          setMessages(j.messages || []);
          if (j.session.status === "completed") setFinished(true);
        }
      })
      .catch(() => setError("Connexion impossible"))
      .finally(() => setLoading(false));
  }, [token]);

  // Auto-start: send initial empty trigger if no messages
  useEffect(() => {
    if (loading || error || !info || finished || startedRef.current) return;
    if (messages.length === 0) {
      startedRef.current = true;
      sendMessage("Bonjour, je suis prêt(e) à commencer.");
    }
  }, [loading, error, info, finished, messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const sendMessage = async (text: string) => {
    if (!token || !text.trim() || sending || finished) return;
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text.trim() }]);
    setInput("");
    try {
      const res = await fetch(`${FN_BASE}/interview-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message: text.trim() }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${j.error || "Erreur"}` },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: j.reply }]);
        if (j.finished) setFinished(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Connexion perdue, réessaie." },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Lien indisponible</h1>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-card-foreground">
            Entretien — {info?.request.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Bonjour {info?.candidate.first_name}, prends ton temps pour répondre.
          </p>
        </div>
      </header>

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          {finished && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-10 w-10 text-success mx-auto mb-3" />
                <h2 className="font-semibold text-card-foreground mb-1">
                  Entretien terminé !
                </h2>
                <p className="text-sm text-muted-foreground">
                  Merci d'avoir pris le temps. L'équipe va revenir vers toi rapidement.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {!finished && (
        <footer className="border-t bg-card">
          <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écris ta réponse..."
              rows={2}
              maxLength={3000}
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              className="resize-none"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Interview;
