import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { da } from "date-fns/locale";

interface Message {
  id: string;
  sender: 'booster' | 'customer';
  text: string;
  timestamp: Date;
}

interface BookingChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingId?: string;
  service?: string;
}

export function BookingChatDialog({
  open,
  onOpenChange,
  customerName,
  customerEmail,
  customerPhone,
  bookingId,
  service
}: BookingChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'customer',
      text: `Hej! Jeg glæder mig til ${service || 'bookingen'}. Er der noget jeg skal forberede?`,
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      sender: 'booster',
      text: 'Hej! Tak for din besked. Sørg gerne for ren hud uden makeup, så er vi klar til at starte.',
      timestamp: new Date(Date.now() - 3000000)
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      sender: 'booster',
      text: newMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // TODO: Send message to backend/customer
    console.log('Sending message to customer:', { bookingId, message: newMessage });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {customerName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'KU'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{customerName || 'Kunde'}</div>
              <div className="text-xs text-muted-foreground">{service}</div>
            </div>
            <div className="flex gap-1">
              {customerPhone && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={`tel:${customerPhone}`}><Phone className="h-4 w-4" /></a>
                </Button>
              )}
              {customerEmail && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={`mailto:${customerEmail}`}><Mail className="h-4 w-4" /></a>
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'booster' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.sender === 'booster'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'booster' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {format(msg.timestamp, "HH:mm", { locale: da })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Skriv en besked..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
