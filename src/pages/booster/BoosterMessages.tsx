import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Search, MessageSquare, ArrowLeft, Shield, Users, Headphones, Send, Image as ImageIcon } from "lucide-react";
import JobChat from "@/components/job/JobChat";
import { useToast } from "@/hooks/use-toast";

interface JobWithMessages {
  id: string;
  title: string;
  client_name: string | null;
  date_needed: string;
  status: string;
  message_count: number;
  unread_count: number;
  last_message?: string;
  has_images?: boolean;
}

interface Conversation {
  id: string;
  type: string;
  group_name: string | null;
  participants: string[];
  last_message_at: string | null;
  unread_user_count: number;
  last_message?: string;
}

interface Message {
  id: string;
  message: string | null;
  sender: string;
  created_at: string;
  booster_id: string | null;
  image_url?: string | null;
}

// Mock data for demo
const MOCK_JOBS: JobWithMessages[] = [
  {
    id: 'mock-job-1',
    title: 'Bryllup makeup - Sarah Jensen',
    client_name: 'Sarah Jensen',
    date_needed: new Date().toISOString().split('T')[0],
    status: 'confirmed',
    message_count: 4,
    unread_count: 2,
    last_message: 'Her er nogle billeder til inspiration! 💕',
    has_images: true
  },
  {
    id: 'mock-job-2',
    title: 'Temafest makeup - Laura Nielsen',
    client_name: 'Laura Nielsen',
    date_needed: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    status: 'confirmed',
    message_count: 3,
    unread_count: 1,
    last_message: 'Temaet er 70er disco! Kan du lave glitter look?',
    has_images: true
  },
  {
    id: 'mock-job-3',
    title: 'Event makeup - Copenhagen Events',
    client_name: 'Copenhagen Events ApS',
    date_needed: new Date().toISOString().split('T')[0],
    status: 'confirmed',
    message_count: 2,
    unread_count: 0,
    last_message: 'Perfekt, vi ses kl. 14:00!'
  }
];

const MOCK_ADMIN_CONVERSATIONS: Conversation[] = [
  {
    id: 'mock-admin-1',
    type: 'booster',
    group_name: 'Admin Support',
    participants: [],
    last_message_at: new Date(Date.now() - 3600000).toISOString(),
    unread_user_count: 1,
    last_message: 'Hej! Husk at opdatere din kalender for næste uge 📅'
  }
];

const MOCK_TEAM_CONVERSATIONS: Conversation[] = [
  {
    id: 'mock-team-1',
    type: 'group',
    group_name: 'DR Studios - TV-produktion (Lør)',
    participants: [],
    last_message_at: new Date(Date.now() - 7200000).toISOString(),
    unread_user_count: 3,
    last_message: 'Fay: Jeg tager alt SFX udstyr med!'
  },
  {
    id: 'mock-team-2',
    type: 'group',
    group_name: 'Novo Nordisk Event (Ons)',
    participants: [],
    last_message_at: new Date(Date.now() - 86400000).toISOString(),
    unread_user_count: 0,
    last_message: 'Nanna: Super, jeg booker en stor Uber til os alle 🚗'
  }
];

const MOCK_JOB_MESSAGES: Record<string, Message[]> = {
  'mock-job-1': [
    { id: 'm1', message: 'Hej! Jeg glæder mig så meget til brylluppet! 💒', sender: 'customer', created_at: new Date(Date.now() - 86400000).toISOString(), booster_id: null },
    { id: 'm2', message: 'Hej Sarah! Det glæder jeg mig også til. Har du nogle ønsker til makeup stilen?', sender: 'booster', created_at: new Date(Date.now() - 82800000).toISOString(), booster_id: 'current-user' },
    { id: 'm3', message: 'Her er nogle billeder til inspiration! 💕', sender: 'customer', created_at: new Date(Date.now() - 3600000).toISOString(), booster_id: null, image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300' },
    { id: 'm4', message: null, sender: 'customer', created_at: new Date(Date.now() - 3500000).toISOString(), booster_id: null, image_url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=300' },
  ],
  'mock-job-2': [
    { id: 'm5', message: 'Hej! Vi holder temafest og jeg vil gerne have et fedt 70er look 🕺', sender: 'customer', created_at: new Date(Date.now() - 172800000).toISOString(), booster_id: null },
    { id: 'm6', message: 'Temaet er 70er disco! Kan du lave glitter look?', sender: 'customer', created_at: new Date(Date.now() - 7200000).toISOString(), booster_id: null },
    { id: 'm7', message: null, sender: 'customer', created_at: new Date(Date.now() - 7100000).toISOString(), booster_id: null, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300' },
  ],
  'mock-job-3': [
    { id: 'm8', message: 'Vi ser frem til eventen! Mødetid kl. 14:00 ved hovedindgangen.', sender: 'customer', created_at: new Date(Date.now() - 259200000).toISOString(), booster_id: null },
    { id: 'm9', message: 'Perfekt, vi ses kl. 14:00!', sender: 'booster', created_at: new Date(Date.now() - 172800000).toISOString(), booster_id: 'current-user' },
  ]
};

const MOCK_ADMIN_MESSAGES: Message[] = [
  { id: 'a1', message: 'Hej! Velkommen til Beauty Boosters teamet! 🎉', sender: 'admin', created_at: new Date(Date.now() - 604800000).toISOString(), booster_id: null },
  { id: 'a2', message: 'Tak! Jeg glæder mig til at komme i gang.', sender: 'booster', created_at: new Date(Date.now() - 600000000).toISOString(), booster_id: 'current-user' },
  { id: 'a3', message: 'Du har fået tildelt dit første job! 🙌 Tjek din kalender.', sender: 'admin', created_at: new Date(Date.now() - 259200000).toISOString(), booster_id: null },
  { id: 'a4', message: 'Hej! Husk at opdatere din kalender for næste uge 📅', sender: 'admin', created_at: new Date(Date.now() - 3600000).toISOString(), booster_id: null },
];

const MOCK_TEAM_MESSAGES: Record<string, Message[]> = {
  'mock-team-1': [
    { id: 't1', message: 'Hej team! Glæder mig til DR jobbet på lørdag 🎬', sender: 'booster', created_at: new Date(Date.now() - 86400000).toISOString(), booster_id: 'other-booster-1' },
    { id: 't2', message: 'Same! Hvem kører? 🚗', sender: 'booster', created_at: new Date(Date.now() - 82800000).toISOString(), booster_id: 'other-booster-2' },
    { id: 't3', message: 'Jeg kan køre - har plads til 3 i bilen', sender: 'booster', created_at: new Date(Date.now() - 79200000).toISOString(), booster_id: 'current-user' },
    { id: 't4', message: 'Perfekt! Vi mødes ved DR Byen kl. 07:30 🙌', sender: 'booster', created_at: new Date(Date.now() - 72000000).toISOString(), booster_id: 'other-booster-1' },
    { id: 't5', message: 'Fay: Jeg tager alt SFX udstyr med!', sender: 'booster', created_at: new Date(Date.now() - 7200000).toISOString(), booster_id: 'other-booster-2' },
  ],
  'mock-team-2': [
    { id: 't6', message: 'Hej alle! Novo jobbet bliver stort - 12 personer! 💄', sender: 'booster', created_at: new Date(Date.now() - 172800000).toISOString(), booster_id: 'other-booster-3' },
    { id: 't7', message: 'Wow! Skal vi koordinere farver/looks?', sender: 'booster', created_at: new Date(Date.now() - 169200000).toISOString(), booster_id: 'current-user' },
    { id: 't8', message: 'God idé! Jeg foreslår naturlige toner - det er corporate event', sender: 'booster', created_at: new Date(Date.now() - 165600000).toISOString(), booster_id: 'other-booster-4' },
    { id: 't9', message: 'Nanna: Super, jeg booker en stor Uber til os alle 🚗', sender: 'booster', created_at: new Date(Date.now() - 86400000).toISOString(), booster_id: 'other-booster-3' },
  ]
};

export default function BoosterMessages() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobs, setJobs] = useState<JobWithMessages[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (activeTab === "jobs") {
      fetchJobsWithMessages();
    } else {
      fetchConversations();
    }
  }, [activeTab, currentUserId]);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchJobsWithMessages = async () => {
    try {
      setLoading(true);
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, title, client_name, date_needed, status')
        .order('date_needed', { ascending: false });

      if (error) throw error;

      const jobsWithCounts = await Promise.all(
        (jobs || []).map(async (job) => {
          const { data: messages } = await supabase
            .from('job_communications')
            .select('id, read_at, sender_type')
            .eq('job_id', job.id);

          return {
            ...job,
            message_count: messages?.length || 0,
            unread_count: messages?.filter(m => !m.read_at && m.sender_type !== 'booster').length || 0
          };
        })
      );

      const jobsWithMessages = jobsWithCounts.filter(j => j.message_count > 0);
      
      // Add mock data if no real jobs with messages
      if (jobsWithMessages.length === 0) {
        setJobs(MOCK_JOBS);
      } else {
        setJobs(jobsWithMessages);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Fallback to mock data on error
      setJobs(MOCK_JOBS);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const targetType = activeTab === "admin" ? "booster" : "group";
      
      const { data, error } = await supabase
        .from('conversations')
        .select('id, type, group_name, participants, last_message_at, unread_user_count')
        .eq('type', targetType)
        .eq('archived', false)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Filter conversations where current user is a participant and map to correct type
      const userConversations = (data || [])
        .filter(conv => {
          const participants = (conv.participants as string[]) || [];
          return currentUserId ? participants.includes(currentUserId) : false;
        })
        .map(conv => ({
          ...conv,
          participants: (conv.participants as string[]) || []
        }));

      // Add mock data if no real conversations
      if (userConversations.length === 0) {
        if (activeTab === "admin") {
          setConversations(MOCK_ADMIN_CONVERSATIONS);
        } else if (activeTab === "team") {
          setConversations(MOCK_TEAM_CONVERSATIONS);
        } else {
          setConversations([]);
        }
      } else {
        setConversations(userConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Fallback to mock data
      if (activeTab === "admin") {
        setConversations(MOCK_ADMIN_CONVERSATIONS);
      } else if (activeTab === "team") {
        setConversations(MOCK_TEAM_CONVERSATIONS);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    // Check if it's a mock conversation
    if (conversationId.startsWith('mock-admin')) {
      setMessages(MOCK_ADMIN_MESSAGES);
      return;
    }
    if (conversationId.startsWith('mock-team')) {
      setMessages(MOCK_TEAM_MESSAGES[conversationId] || []);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('id, message, sender, created_at, booster_id')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark as read
      await supabase
        .from('conversations')
        .update({ unread_user_count: 0 })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || !currentUserId) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: selectedConversationId,
          message: newMessage.trim(),
          sender: 'booster',
          booster_id: currentUserId
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedConversationId);
      toast({ title: "Besked sendt" });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: "Fejl", description: "Kunne ikke sende besked", variant: "destructive" });
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    conv.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) || !searchTerm
  );

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const renderConversationList = () => (
    <ScrollArea className="h-[450px] lg:h-[450px]">
      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">Indlæser...</div>
      ) : filteredConversations.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          {activeTab === "admin" ? (
            <>
              <Headphones className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ingen samtaler med admin</p>
              <p className="text-xs">Admin vil kontakte dig her ved behov</p>
            </>
          ) : (
            <>
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ingen team samtaler</p>
              <p className="text-xs">Gruppesamtaler til jobs vises her</p>
            </>
          )}
        </div>
      ) : (
        <div className="divide-y">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversationId(conv.id)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-accent transition-colors ${selectedConversationId === conv.id ? 'bg-accent' : ''}`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {activeTab === "admin" ? (
                  <Headphones className="h-5 w-5 text-primary" />
                ) : (
                  <Users className="h-5 w-5 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">
                    {conv.group_name || (activeTab === "admin" ? "Admin support" : "Team chat")}
                  </p>
                  {conv.unread_user_count > 0 && (
                    <Badge variant="default" className="text-xs px-2 py-0">{conv.unread_user_count}</Badge>
                  )}
                </div>
                {conv.last_message && (
                  <p className="text-xs text-muted-foreground truncate mb-0.5">
                    {conv.last_message}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {conv.last_message_at 
                    ? new Date(conv.last_message_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Ingen beskeder endnu'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  const renderChatArea = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">Ingen beskeder endnu</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.booster_id === currentUserId || msg.booster_id === 'current-user';
            const isOtherBooster = msg.sender === 'booster' && !isCurrentUser;
            
            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground'
                      : msg.sender === 'admin'
                      ? 'bg-blue-100 text-blue-900'
                      : isOtherBooster
                      ? 'bg-green-100 text-green-900'
                      : 'bg-muted'
                  }`}
                >
                  {msg.sender === 'admin' && (
                    <p className="text-xs font-medium mb-1 opacity-70 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Admin
                    </p>
                  )}
                  {isOtherBooster && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {msg.message?.split(':')[0] || 'Booster'}
                    </p>
                  )}
                  {msg.image_url && (
                    <img 
                      src={msg.image_url} 
                      alt="Inspiration" 
                      className="rounded-lg max-w-full mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(msg.image_url || '', '_blank')}
                    />
                  )}
                  {msg.message && (
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  )}
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Textarea
            placeholder="Skriv en besked..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[40px] max-h-[100px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Beskeder</h1>
        <p className="text-sm text-muted-foreground">Kommuniker med kunder, admin og team</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedJobId(null); setSelectedConversationId(null); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Kunder</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <Headphones className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4">
          {/* Mobile: Show either list or chat */}
          <div className="lg:hidden">
            {!selectedJobId ? (
              <Card>
                <CardHeader className="pb-3 px-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søg jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    {loading ? (
                      <div className="p-4 text-sm text-muted-foreground">Indlæser...</div>
                    ) : filteredJobs.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Ingen beskeder endnu</p>
                        <p className="text-xs">Beskeder fra kunder vises her</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredJobs.map((job) => (
                          <div
                            key={job.id}
                            onClick={() => setSelectedJobId(job.id)}
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent active:bg-accent/80 transition-colors"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <MessageSquare className="h-5 w-5 text-primary" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{job.title}</p>
                                {job.unread_count > 0 && (
                                  <Badge variant="default" className="text-xs px-1.5 py-0">{job.unread_count}</Badge>
                                )}
                                {job.has_images && (
                                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </div>
                              {job.last_message && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {job.last_message}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                {job.client_name || 'Kunde'} • {new Date(job.date_needed).toLocaleDateString('da-DK')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedJobId(null)} className="gap-2 -ml-2">
                  <ArrowLeft className="h-4 w-4" /> Tilbage
                </Button>
                <div className="text-sm mb-2">
                  <p className="font-medium">{selectedJob?.title}</p>
                  <p className="text-muted-foreground text-xs">{selectedJob?.client_name || 'Kunde'}</p>
                </div>
                <JobChat jobId={selectedJobId} userType="booster" />
              </div>
            )}
          </div>

          {/* Desktop: Side-by-side layout */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 h-[600px]">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Job Samtaler</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søg jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[450px]">
                  {loading ? (
                    <div className="p-4 text-sm text-muted-foreground">Indlæser...</div>
                  ) : filteredJobs.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Ingen beskeder endnu</p>
                      <p className="text-xs">Beskeder fra kunder vises her</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredJobs.map((job) => (
                        <div
                          key={job.id}
                          onClick={() => setSelectedJobId(job.id)}
                          className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-accent transition-colors ${selectedJobId === job.id ? 'bg-accent' : ''}`}
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-primary" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">{job.title}</p>
                              {job.unread_count > 0 && (
                                <Badge variant="default" className="text-xs px-2 py-0">{job.unread_count}</Badge>
                              )}
                              {job.has_images && (
                                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                            {job.last_message && (
                              <p className="text-xs text-muted-foreground truncate mb-0.5">
                                {job.last_message}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              {job.client_name || 'Kunde'} • {new Date(job.date_needed).toLocaleDateString('da-DK')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 flex flex-col">
              {selectedJobId ? (
                <div className="flex-1 p-4">
                  <div className="text-sm mb-3">
                    <p className="font-medium">{selectedJob?.title}</p>
                    <p className="text-muted-foreground text-xs">{selectedJob?.client_name || 'Kunde'}</p>
                  </div>
                  <JobChat jobId={selectedJobId} userType="booster" />
                </div>
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Vælg en samtale for at begynde</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="admin" className="mt-4">
          {/* Mobile */}
          <div className="lg:hidden">
            {!selectedConversationId ? (
              <Card>
                <CardHeader className="pb-3 px-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søg samtaler..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {renderConversationList()}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedConversationId(null)} className="gap-2 -ml-2">
                  <ArrowLeft className="h-4 w-4" /> Tilbage
                </Button>
                <Card className="h-[calc(100vh-300px)]">
                  {renderChatArea()}
                </Card>
              </div>
            )}
          </div>

          {/* Desktop */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 h-[600px]">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Admin Support</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søg samtaler..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {renderConversationList()}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 flex flex-col">
              {selectedConversationId ? (
                renderChatArea()
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-center">
                    <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Vælg en samtale for at begynde</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          {/* Mobile */}
          <div className="lg:hidden">
            {!selectedConversationId ? (
              <Card>
                <CardHeader className="pb-3 px-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Søg samtaler..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {renderConversationList()}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedConversationId(null)} className="gap-2 -ml-2">
                  <ArrowLeft className="h-4 w-4" /> Tilbage
                </Button>
                <div className="text-sm mb-2">
                  <p className="font-medium">{selectedConversation?.group_name || "Team chat"}</p>
                </div>
                <Card className="h-[calc(100vh-300px)]">
                  {renderChatArea()}
                </Card>
              </div>
            )}
          </div>

          {/* Desktop */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 h-[600px]">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Team Samtaler</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søg samtaler..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {renderConversationList()}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 flex flex-col">
              {selectedConversationId ? (
                <>
                  <div className="p-4 border-b">
                    <p className="font-medium">{selectedConversation?.group_name || "Team chat"}</p>
                  </div>
                  {renderChatArea()}
                </>
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Vælg en samtale for at begynde</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Privat kommunikation</p>
            <p>Kundernes kontaktoplysninger er skjult. Brug chatten til at kommunikere om job detaljer, looks og inspiration. Admin kan se beskeder ved behov.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
