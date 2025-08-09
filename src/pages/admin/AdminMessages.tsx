import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send } from "lucide-react";

interface Conversation {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  last_message_at: string | null;
  unread_admin_count: number;
}

interface ConversationMessage {
  id: string;
  conversation_id: string;
  created_at: string;
  sender: string; // 'user' | 'admin'
  message: string | null;
  email: string | null;
}

export default function AdminMessages() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, name, email, status, last_message_at, unread_admin_count")
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (error) {
      console.error(error);
      toast({ title: "Kunne ikke hente samtaler", variant: "destructive" });
      return;
    }
    setConversations(data || []);
    if (!selectedId && data && data.length) setSelectedId(data[0].id);
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("conversation_messages")
      .select("id, conversation_id, created_at, sender, message, email")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error(error);
      toast({ title: "Kunne ikke hente beskeder", variant: "destructive" });
      return;
    }
    setMessages(data || []);
    await supabase.from("conversations").update({ unread_admin_count: 0 }).eq("id", conversationId);
  };

  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);

    const channel = supabase
      .channel("conversation-messages-" + selectedId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversation_messages", filter: `conversation_id=eq.${selectedId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as any]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !selectedId) return;
    const { error } = await supabase
      .from("conversation_messages")
      .insert([{ conversation_id: selectedId, sender: "admin", message: text }]);
    if (error) {
      console.error(error);
      toast({ title: "Kunne ikke sende", description: error.message, variant: "destructive" });
      return;
    }
    setReply("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4 md:col-span-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Beskeder</h2>
          <Button variant="outline" size="sm" onClick={loadConversations}>Opdater</Button>
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-auto">
          {loading && <div className="text-sm text-muted-foreground">Indlæser…</div>}
          {!loading && conversations.length === 0 && (
            <div className="text-sm text-muted-foreground">Ingen samtaler endnu.</div>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left p-3 rounded border ${selectedId === c.id ? "bg-muted" : "hover:bg-muted/50"}`}
            >
              <div className="flex justify-between gap-2">
                <div>
                  <div className="font-medium">{c.name || c.email || "Kunde"}</div>
                  <div className="text-xs text-muted-foreground">{c.email || "Ingen email"}</div>
                </div>
                {c.unread_admin_count > 0 && (
                  <span className="text-xs bg-primary text-primary-foreground rounded-full h-5 min-w-5 px-2 flex items-center justify-center">
                    {c.unread_admin_count}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {c.last_message_at ? new Date(c.last_message_at).toLocaleString() : ""}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4 md:col-span-2">
        {!selectedConversation ? (
          <div className="text-muted-foreground">Vælg en samtale for at se beskeder.</div>
        ) : (
          <div className="flex flex-col h-[70vh]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedConversation.name || selectedConversation.email || "Kunde"}</h3>
                <div className="text-xs text-muted-foreground">{selectedConversation.email || "Ingen email"}</div>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex-1 overflow-auto space-y-3 pr-1">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[80%] ${m.sender === "admin" ? "ml-auto" : ""}`}>
                  <div className={`rounded-lg p-3 border ${m.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                    <div className="text-xs opacity-80 mb-1">{m.sender === "admin" ? "Admin" : m.email || "Kunde"}</div>
                    <div className="whitespace-pre-wrap text-sm">{m.message}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="mt-3 flex gap-2">
              <Input placeholder="Skriv et svar…" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }} />
              <Button onClick={sendReply} disabled={!reply.trim()}><Send className="h-4 w-4 mr-2" /> Send</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
