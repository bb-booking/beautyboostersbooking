import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Image as ImageIcon, Clock } from "lucide-react";

interface JobChatProps {
  jobId: string;
  userType: 'admin' | 'booster' | 'customer';
  userName?: string;
}

interface ChatMessage {
  id: string;
  sender_type: 'customer' | 'booster' | 'admin';
  message_text?: string;
  image_url?: string;
  created_at: string;
  read_at?: string;
}

const JobChat = ({ jobId, userType, userName = 'Admin' }: JobChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    // Set up real-time subscription
    const channel = supabase
      .channel(`job-chat-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_communications',
          filter: `job_id=eq.${jobId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('job_communications')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'customer' | 'booster' | 'admin'
      })));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Fejl ved hentning af beskeder');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('job_communications')
        .insert([{
          job_id: jobId,
          sender_type: userType,
          message_text: newMessage
        }]);

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Fejl ved afsendelse af besked');
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      // In a real implementation, you would upload to Supabase Storage
      // For now, we'll just show a placeholder
      toast.success('Billede upload funktion kommer snart');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Fejl ved upload af billede');
    }
  };

  const getSenderName = (senderType: string) => {
    switch (senderType) {
      case 'admin': return 'Admin';
      case 'booster': return 'Booster';
      case 'customer': return 'Kunde';
      default: return 'Ukendt';
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'admin': return 'bg-blue-500';
      case 'booster': return 'bg-green-500';
      case 'customer': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Job Chat</span>
          <span className="text-sm text-muted-foreground">({messages.length} beskeder)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-96 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Ingen beskeder endnu.</p>
              <p className="text-sm">Start en samtale ved at skrive en besked nedenfor.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={`text-white text-xs ${getSenderColor(message.sender_type)}`}>
                    {getSenderName(message.sender_type).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{getSenderName(message.sender_type)}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(message.created_at).toLocaleString('da-DK')}
                    </span>
                  </div>
                  {message.message_text && (
                    <div className="bg-card p-3 rounded-lg border">
                      <p className="text-sm">{message.message_text}</p>
                    </div>
                  )}
                  {message.image_url && (
                    <div className="bg-card p-2 rounded-lg border">
                      <img 
                        src={message.image_url} 
                        alt="Uploaded image" 
                        className="max-w-sm rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Skriv en besked..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>💡 Tips:</p>
          <p>• Boosters kan informere om forsinkelser eller adgangsproblemer</p>
          <p>• Del billeder af looks eller reference materiale</p>
          <p>• Kun kundens navn er synlig for boosteren (ikke kontaktoplysninger)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobChat;