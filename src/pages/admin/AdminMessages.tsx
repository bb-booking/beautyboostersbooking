import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageSquare, Send, Users, UserCircle, Filter, Plus, Archive, Star, AlertCircle, Edit2, Trash2, Check, X } from "lucide-react";

interface Conversation {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  last_message_at: string | null;
  unread_admin_count: number;
  type: 'customer' | 'booster' | 'group';
  group_name: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  archived: boolean;
  participants: any;
}

interface Booster {
  id: string;
  name: string;
}

interface ConversationMessage {
  id: string;
  conversation_id: string;
  created_at: string;
  sender: string; // 'user' | 'admin'
  message: string | null;
  email: string | null;
  edited_at: string | null;
  deleted_at: string | null;
}

export default function AdminMessages() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [reply, setReply] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [filter, setFilter] = useState<'all' | 'customer' | 'booster' | 'group'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newConvType, setNewConvType] = useState<'booster' | 'group'>('booster');
  const [selectedBoosters, setSelectedBoosters] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [showManageGroup, setShowManageGroup] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");

  const loadBoosters = async () => {
    const { data, error } = await supabase
      .from("booster_profiles")
      .select("id, name")
      .order("name");
    if (error) {
      console.error(error);
      return;
    }
    setBoosters(data || []);
  };

  const loadConversations = async () => {
    let query = supabase
      .from("conversations")
      .select("id, name, email, status, last_message_at, unread_admin_count, type, group_name, priority, tags, archived, participants")
      .eq("archived", showArchived)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    
    if (filter !== 'all') {
      query = query.eq("type", filter);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error(error);
      toast({ title: "Kunne ikke hente samtaler", variant: "destructive" });
      return;
    }
    setConversations((data || []) as Conversation[]);
    if (!selectedId && data && data.length) setSelectedId(data[0].id);
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("conversation_messages")
      .select("id, conversation_id, created_at, sender, message, email, edited_at, deleted_at")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
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
    loadBoosters();
  }, []);

  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, [filter, showArchived]);

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

  const createConversation = async () => {
    if (newConvType === 'booster' && selectedBoosters.length !== 1) {
      toast({ title: "Vælg én booster", variant: "destructive" });
      return;
    }
    if (newConvType === 'group' && (selectedBoosters.length < 2 || !groupName.trim())) {
      toast({ title: "Indtast gruppenavn og vælg mindst 2 boosters", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert([{
        type: newConvType,
        group_name: newConvType === 'group' ? groupName : null,
        participants: selectedBoosters,
        status: 'open'
      }])
      .select()
      .single();

    if (error) {
      console.error(error);
      toast({ title: "Kunne ikke oprette samtale", variant: "destructive" });
      return;
    }

    setShowNewConversation(false);
    setSelectedBoosters([]);
    setGroupName("");
    await loadConversations();
    setSelectedId(data.id);
    toast({ title: "Samtale oprettet" });
  };

  const updatePriority = async (conversationId: string, priority: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ priority })
      .eq("id", conversationId);

    if (error) {
      console.error(error);
      toast({ title: "Kunne ikke opdatere prioritet", variant: "destructive" });
      return;
    }
    await loadConversations();
  };

  const archiveConversation = async (conversationId: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ archived: true })
      .eq("id", conversationId);

    if (error) {
      console.error(error);
      toast({ title: "Kunne ikke arkivere", variant: "destructive" });
      return;
    }
    setSelectedId(null);
    await loadConversations();
    toast({ title: "Samtale arkiveret" });
  };

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId]
  );

  const getConversationTitle = (conv: Conversation) => {
    if (conv.type === 'group') return conv.group_name || 'Gruppe';
    if (conv.type === 'booster') {
      const booster = boosters.find(b => conv.participants?.includes(b.id));
      return booster?.name || 'Booster';
    }
    return conv.name || conv.email || 'Kunde';
  };

  const getConversationIcon = (type: string) => {
    if (type === 'group') return <Users className="h-4 w-4" />;
    if (type === 'booster') return <UserCircle className="h-4 w-4" />;
    return <MessageSquare className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const updateGroupMembers = async () => {
    if (!selectedId) return;
    const { error } = await supabase
      .from("conversations")
      .update({ participants: selectedBoosters })
      .eq("id", selectedId);

    if (error) {
      console.error(error);
      toast({ title: "Kunne ikke opdatere medlemmer", variant: "destructive" });
      return;
    }
    await loadConversations();
    setShowManageGroup(false);
    toast({ title: "Medlemmer opdateret" });
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from("conversation_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) {
      console.error(error);
      toast({ title: "Kunne ikke slette besked", variant: "destructive" });
      return;
    }
    
    if (selectedId) await loadMessages(selectedId);
    toast({ title: "Besked slettet" });
  };

  const saveEditMessage = async () => {
    if (!editingMessageId || !editedMessage.trim()) return;

    const { error } = await supabase
      .from("conversation_messages")
      .update({ 
        message: editedMessage.trim(),
        edited_at: new Date().toISOString()
      })
      .eq("id", editingMessageId);

    if (error) {
      console.error(error);
      toast({ title: "Kunne ikke redigere besked", variant: "destructive" });
      return;
    }

    setEditingMessageId(null);
    setEditedMessage("");
    if (selectedId) await loadMessages(selectedId);
    toast({ title: "Besked redigeret" });
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertCircle className="h-3 w-3" />;
    }
    return null;
  };

  const getGroupMembers = () => {
    if (!selectedConversation || selectedConversation.type !== 'group') return [];
    const participantIds = selectedConversation.participants as any[];
    return boosters.filter(b => participantIds?.includes(b.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Beskeder</h1>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Ny samtale</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Opret ny samtale</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <Select value={newConvType} onValueChange={(v: any) => setNewConvType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booster">Direkte besked til booster</SelectItem>
                      <SelectItem value="group">Gruppechat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newConvType === 'group' && (
                  <div>
                    <Label>Gruppenavn</Label>
                    <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="F.eks. Alle makeup artister" />
                  </div>
                )}
                <div>
                  <Label>Vælg boosters</Label>
                  <div className="border rounded-md p-3 max-h-60 overflow-auto space-y-2">
                    {boosters.map((b) => (
                      <div key={b.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedBoosters.includes(b.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBoosters([...selectedBoosters, b.id]);
                            } else {
                              setSelectedBoosters(selectedBoosters.filter(id => id !== b.id));
                            }
                          }}
                        />
                        <span className="text-sm">{b.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewConversation(false)}>Annuller</Button>
                <Button onClick={createConversation}>Opret</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 md:col-span-1">
          <div className="space-y-3 mb-3">
            <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="all">Alle</TabsTrigger>
                <TabsTrigger value="customer">Kunder</TabsTrigger>
                <TabsTrigger value="booster">Boosters</TabsTrigger>
                <TabsTrigger value="group">Grupper</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={loadConversations}>Opdater</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowArchived(!showArchived)}>
                <Archive className="h-4 w-4 mr-2" />
                {showArchived ? 'Aktive' : 'Arkiv'}
              </Button>
            </div>
          </div>
          <Separator className="mb-3" />
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-auto">
            {loading && <div className="text-sm text-muted-foreground">Indlæser…</div>}
            {!loading && conversations.length === 0 && (
              <div className="text-sm text-muted-foreground">Ingen samtaler.</div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left p-3 rounded border transition-colors ${
                  selectedId === c.id ? "bg-muted border-primary" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getConversationIcon(c.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{getConversationTitle(c)}</div>
                      {c.type === 'customer' && c.email && (
                        <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {c.unread_admin_count > 0 && (
                      <Badge variant="default" className="h-5 min-w-5 px-2 flex items-center justify-center">
                        {c.unread_admin_count}
                      </Badge>
                    )}
                    {(c.priority === 'high' || c.priority === 'urgent') && (
                      <Badge variant={getPriorityColor(c.priority)} className="h-5 px-2 flex items-center gap-1">
                        {getPriorityIcon(c.priority)}
                        <span className="text-xs">{c.priority}</span>
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.last_message_at ? new Date(c.last_message_at).toLocaleString('da-DK') : "Ingen beskeder"}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 md:col-span-2">
          {!selectedConversation ? (
            <div className="flex items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
              Vælg en samtale for at se beskeder
            </div>
          ) : (
            <div className="flex flex-col h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-3">
                  {getConversationIcon(selectedConversation.type)}
                  <div className="flex-1">
                    <h3 className="font-semibold">{getConversationTitle(selectedConversation)}</h3>
                    {selectedConversation.type === 'customer' && selectedConversation.email && (
                      <div className="text-xs text-muted-foreground">{selectedConversation.email}</div>
                    )}
                    {selectedConversation.type === 'group' && (
                      <div className="text-xs text-muted-foreground">
                        {getGroupMembers().length} medlemmer
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.type === 'group' && (
                    <Dialog open={showManageGroup} onOpenChange={setShowManageGroup}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBoosters((selectedConversation.participants as any[]) || []);
                          }}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Håndter medlemmer
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Gruppmedlemmer - {selectedConversation.group_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div className="border rounded-md p-3 max-h-60 overflow-auto space-y-2">
                            {boosters.map((b) => (
                              <div key={b.id} className="flex items-center gap-2">
                                <Checkbox
                                  checked={selectedBoosters.includes(b.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedBoosters([...selectedBoosters, b.id]);
                                    } else {
                                      setSelectedBoosters(selectedBoosters.filter(id => id !== b.id));
                                    }
                                  }}
                                />
                                <span className="text-sm">{b.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowManageGroup(false)}>Annuller</Button>
                          <Button onClick={updateGroupMembers}>Gem ændringer</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Select
                    value={selectedConversation.priority}
                    onValueChange={(v) => updatePriority(selectedConversation.id, v)}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Lav</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Høj</SelectItem>
                      <SelectItem value="urgent">Haster</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archiveConversation(selectedConversation.id)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex-1 overflow-auto space-y-3 pr-1">
                {messages.map((m) => (
                  <div key={m.id} className={`max-w-[80%] ${m.sender === "admin" ? "ml-auto" : ""}`}>
                    {editingMessageId === m.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editedMessage}
                          onChange={(e) => setEditedMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveEditMessage();
                            }
                            if (e.key === 'Escape') {
                              setEditingMessageId(null);
                              setEditedMessage("");
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEditMessage}>
                            <Check className="h-3 w-3 mr-1" /> Gem
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingMessageId(null);
                            setEditedMessage("");
                          }}>
                            <X className="h-3 w-3 mr-1" /> Annuller
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={`rounded-lg p-3 border ${
                          m.sender === "admin" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs opacity-80">
                              {m.sender === "admin" ? "Admin" : m.email || getConversationTitle(selectedConversation)}
                            </div>
                            {m.sender === "admin" && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-primary-foreground/20"
                                  onClick={() => {
                                    setEditingMessageId(m.id);
                                    setEditedMessage(m.message || "");
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-destructive/20"
                                  onClick={() => {
                                    if (confirm("Er du sikker på at du vil slette denne besked?")) {
                                      deleteMessage(m.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="whitespace-pre-wrap text-sm">{m.message}</div>
                          {m.edited_at && (
                            <div className="text-[10px] opacity-60 mt-1">(redigeret)</div>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {new Date(m.created_at).toLocaleString('da-DK')}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Skriv et svar…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <Button onClick={sendReply} disabled={!reply.trim()}>
                  <Send className="h-4 w-4 mr-2" /> Send
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
