import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, MessageSquare, User, Shield } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  senderType: 'customer' | 'admin' | 'booster';
  message: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  title: string;
  type: 'customer' | 'admin';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar: string;
}

export default function BoosterMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data
  useEffect(() => {
    const mockConversations: Conversation[] = [
      {
        id: '1',
        title: 'Sarah Jensen',
        type: 'customer',
        lastMessage: 'Tak for i dag, du gjorde et fantastisk job!',
        lastMessageTime: '2024-01-20 16:30',
        unreadCount: 0,
        avatar: 'SJ'
      },
      {
        id: '2',
        title: 'Admin Support',
        type: 'admin', 
        lastMessage: 'Husk at udfylde din lønseddel for januar',
        lastMessageTime: '2024-01-19 14:15',
        unreadCount: 1,
        avatar: 'AD'
      },
      {
        id: '3',
        title: 'Mette Christensen',
        type: 'customer',
        lastMessage: 'Er det muligt at flytte vores aftale til fredag?',
        lastMessageTime: '2024-01-19 10:20',
        unreadCount: 2,
        avatar: 'MC'
      }
    ];

    const mockMessages: Message[] = [
      {
        id: '1',
        sender: 'Sarah Jensen',
        senderType: 'customer',
        message: 'Hej! Jeg glæder mig til i morgen. Skal jeg have noget bestemt på?',
        timestamp: '2024-01-20 14:00',
        read: true
      },
      {
        id: '2',
        sender: 'Dig',
        senderType: 'booster',
        message: 'Hej Sarah! Nej, kom bare som du er. Jeg tager alt makeup med.',
        timestamp: '2024-01-20 14:15',
        read: true
      },
      {
        id: '3',
        sender: 'Sarah Jensen',
        senderType: 'customer',
        message: 'Perfekt! Vi ses i morgen kl. 10.',
        timestamp: '2024-01-20 14:20',
        read: true
      },
      {
        id: '4',
        sender: 'Sarah Jensen',
        senderType: 'customer',
        message: 'Tak for i dag, du gjorde et fantastisk job!',
        timestamp: '2024-01-20 16:30',
        read: true
      }
    ];

    setConversations(mockConversations);
    setMessages(mockMessages);
    setSelectedConversation('1');
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'Dig',
      senderType: 'booster',
      message: newMessage,
      timestamp: new Date().toISOString(),
      read: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Beskeder</h1>
        <p className="text-sm text-muted-foreground">Chat med kunder og admin</p>
      </div>

      {/* Mobile: Show either list or chat */}
      <div className="lg:hidden">
        {!selectedConversation ? (
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
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent active:bg-accent/80 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm">{conversation.avatar}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{conversation.title}</p>
                        {conversation.type === 'admin' && <Shield className="h-3 w-3 text-primary flex-shrink-0" />}
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="text-xs px-1.5 py-0 ml-auto">{conversation.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex flex-col h-[calc(100vh-180px)]">
            <CardHeader className="border-b py-3 px-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)} className="p-2 -ml-2">
                  ←
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{selectedConv?.avatar}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{selectedConv?.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedConv?.type === 'admin' ? 'Admin' : 'Kunde'}</p>
                </div>
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.senderType === 'booster' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-2.5 rounded-2xl ${message.senderType === 'booster' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${message.senderType === 'booster' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(message.timestamp).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="border-t p-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Skriv besked..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Desktop: Side-by-side layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 h-[600px]">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Samtaler</CardTitle>
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
            <ScrollArea className="h-[450px]">
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-accent transition-colors ${selectedConversation === conversation.id ? 'bg-accent' : ''}`}
                  >
                    <Avatar>
                      <AvatarFallback>{conversation.avatar}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{conversation.title}</p>
                        {conversation.type === 'admin' && <Shield className="h-4 w-4 text-primary" />}
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="text-xs px-2 py-0">{conversation.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.lastMessageTime).toLocaleDateString('da-DK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b py-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{selectedConv?.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedConv?.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedConv?.type === 'admin' ? 'Admin Support' : 'Kunde'}</p>
                  </div>
                </div>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.senderType === 'booster' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-lg ${message.senderType === 'booster' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Skriv din besked..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
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
    </div>
  );
}