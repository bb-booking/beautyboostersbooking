import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Image as ImageIcon, Clock, X, Loader2 } from "lucide-react";

interface JobChatProps {
  jobId: string;
  userType: 'admin' | 'booster' | 'customer';
  userName?: string;
  readOnly?: boolean;
}

interface ChatMessage {
  id: string;
  sender_type: 'customer' | 'booster' | 'admin';
  message_text?: string;
  image_url?: string;
  created_at: string;
  read_at?: string;
}

const JobChat = ({ jobId, userType, userName = 'Admin', readOnly = false }: JobChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
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

  const sendMessage = async (imageUrl?: string) => {
    if (!newMessage.trim() && !imageUrl) return;

    try {
      const { error } = await supabase
        .from('job_communications')
        .insert([{
          job_id: jobId,
          sender_type: userType,
          message_text: newMessage || null,
          image_url: imageUrl || null
        }]);

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Fejl ved afsendelse af besked');
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Kun billeder er tilladt');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Billede må max være 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileName = `${jobId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      await sendMessage(urlData.publicUrl);
      toast.success('Billede sendt');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Fejl ved upload af billede');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
        <CardContent className="p-4 sm:p-6">
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
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <span>Job Chat</span>
          <span className="text-sm text-muted-foreground">({messages.length})</span>
          {readOnly && <span className="text-xs text-muted-foreground">(kun visning)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        <div className="h-64 sm:h-96 overflow-y-auto space-y-3 sm:space-y-4 p-3 sm:p-4 bg-muted/20 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">Ingen beskeder endnu.</p>
              {!readOnly && <p className="text-xs">Start en samtale ved at skrive en besked.</p>}
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-2 sm:space-x-3">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                  <AvatarFallback className={`text-white text-xs ${getSenderColor(message.sender_type)}`}>
                    {getSenderName(message.sender_type).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-medium">{getSenderName(message.sender_type)}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(message.created_at).toLocaleString('da-DK', { 
                        day: '2-digit', 
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {message.message_text && (
                    <div className="bg-card p-2 sm:p-3 rounded-lg border">
                      <p className="text-xs sm:text-sm break-words">{message.message_text}</p>
                    </div>
                  )}
                  {message.image_url && (
                    <div className="bg-card p-2 rounded-lg border">
                      <img 
                        src={message.image_url} 
                        alt="Uploaded image" 
                        className="max-w-full sm:max-w-sm rounded cursor-pointer"
                        onClick={() => setPreviewImage(message.image_url || null)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {!readOnly && (
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Skriv en besked..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 text-sm"
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
              disabled={uploading}
              className="flex-shrink-0"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            </Button>
            <Button onClick={() => sendMessage()} disabled={!newMessage.trim()} className="flex-shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!readOnly && (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>💡 Del billeder af looks eller inspirationsmateriale</p>
          </div>
        )}
      </CardContent>

      {/* Image preview modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Card>
  );
};

export default JobChat;
