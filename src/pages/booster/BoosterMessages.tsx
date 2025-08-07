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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Beskeder</h1>
        <p className="text-muted-foreground">Chat med kunder og admin support</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
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
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`
                      flex items-center gap-3 p-4 cursor-pointer hover:bg-accent transition-colors
                      ${selectedConversation === conversation.id ? 'bg-accent' : ''}
                    `}
                  >
                    <Avatar>
                      <AvatarFallback>
                        {conversation.avatar}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{conversation.title}</p>
                        {conversation.type === 'admin' && (
                          <Shield className="h-4 w-4 text-primary" />
                        )}
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="text-xs px-2 py-0">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.lastMessageTime).toLocaleDateString('da-DK', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {conversations.find(c => c.id === selectedConversation)?.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {conversations.find(c => c.id === selectedConversation)?.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {conversations.find(c => c.id === selectedConversation)?.type === 'admin' ? 'Admin Support' : 'Kunde'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'booster' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`
                            max-w-[70%] p-3 rounded-lg
                            ${message.senderType === 'booster'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent'
                            }
                          `}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString('da-DK', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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
                    <Button onClick={handleSendMessage} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Vælg en samtale for at begynde</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}