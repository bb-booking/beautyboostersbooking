import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, Lightbulb, User, Calendar, Wallet, Clock, Star, MapPin, Gift, Users, Phone, Mail, MessageCircle, MessageSquare, Briefcase, Settings, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuickAction {
  label: string;
  message: string;
  icon: React.ReactNode;
  route?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const getUserRole = (): 'admin' | 'booster' | 'customer' => {
    if (location.pathname.startsWith('/admin')) return 'admin';
    if (location.pathname.startsWith('/booster')) return 'booster';
    return 'customer';
  };

  const userRole = getUserRole();

  const getQuickActions = (): QuickAction[] => {
    if (userRole === 'admin') {
      return [
        { label: 'Dagens overblik', message: 'Giv mig et overblik over dagens bookings og vigtige opgaver', icon: <Calendar className="h-3 w-3" /> },
        { label: 'Åbne jobs', message: 'Hvor mange åbne jobs har vi lige nu?', icon: <Users className="h-3 w-3" />, route: '/admin/jobs' },
        { label: 'Økonomistatus', message: 'Hvad er vores omsætning denne måned?', icon: <Wallet className="h-3 w-3" />, route: '/admin/finance' },
        { label: 'Nye ansøgninger', message: 'Er der nye booster-ansøgninger jeg skal gennemgå?', icon: <Star className="h-3 w-3" /> },
      ];
    } else if (userRole === 'booster') {
      return [
        { label: 'Min kalender', message: 'Vis mig mine kommende bookings', icon: <Calendar className="h-3 w-3" />, route: '/booster/calendar' },
        { label: 'Momsfrister', message: 'Hvornår er mine næste momsfrister?', icon: <Clock className="h-3 w-3" /> },
        { label: 'Min indtjening', message: 'Hvad har jeg tjent denne måned?', icon: <Wallet className="h-3 w-3" />, route: '/booster/finance' },
        { label: 'Ledige jobs', message: 'Er der nye jobs jeg kan søge?', icon: <Star className="h-3 w-3" />, route: '/booster/jobs' },
      ];
    } else {
      return [
        { label: 'Book en tid', message: 'Jeg vil gerne booke en tid til makeup', icon: <Calendar className="h-3 w-3" />, route: '/services' },
        { label: 'Find booster', message: 'Hjælp mig med at finde den rette booster', icon: <Users className="h-3 w-3" />, route: '/stylists' },
        { label: 'Mine adresser', message: 'Hvordan gemmer jeg en adresse?', icon: <MapPin className="h-3 w-3" /> },
        { label: 'Gavekort', message: 'Hvordan køber jeg et gavekort?', icon: <Gift className="h-3 w-3" />, route: '/giftcards' },
      ];
    }
  };

  const getPageName = (): string => {
    const path = location.pathname;
    if (path === '/') return 'Forside';
    if (path.includes('booking')) return 'Booking';
    if (path.includes('services')) return 'Services';
    if (path.includes('stylists')) return 'Vores Boosters';
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('calendar')) return 'Kalender';
    if (path.includes('finance')) return 'Økonomi';
    if (path.includes('jobs')) return 'Jobs';
    if (path.includes('messages')) return 'Beskeder';
    if (path.includes('settings')) return 'Indstillinger';
    return path.replace(/\//g, ' ').trim() || 'Ukendt side';
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let welcomeMessage = '';
      if (userRole === 'admin') {
        welcomeMessage = 'Hvad kan jeg hjælpe med? Bookings, boosters, økonomi?';
      } else if (userRole === 'booster') {
        welcomeMessage = 'Hvad kan jeg hjælpe med? Kalender, jobs, økonomi?';
      } else {
        welcomeMessage = 'Hvad kan jeg hjælpe med? Booking, find booster, gavekort?';
      }
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
      setShowQuickActions(true);
    }
  }, [isOpen, userRole]);

  const handleQuickAction = (action: QuickAction) => {
    setShowQuickActions(false);
    if (action.route) {
      navigate(action.route);
    }
    setInput(action.message);
    setTimeout(() => {
      const syntheticInput = action.message;
      setInput('');
      sendMessageWithText(syntheticInput);
    }, 100);
  };

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setShowQuickActions(false);

    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userRole,
          currentPage: getPageName(),
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error('Failed to get response');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === 'assistant') {
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                }
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('AI error:', error);
      setMessages(prev => [
        ...prev.filter(m => m.content !== ''),
        { role: 'assistant', content: 'Ups! Der gik noget galt. Du kan kontakte os på +45 71 78 65 75 eller hello@beautyboosters.dk' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get contextual action buttons based on last assistant message
  const getContextualActions = () => {
    if (messages.length <= 1 || isLoading) return [];
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role !== 'assistant') return [];
    
    const content = lastMessage.content.toLowerCase();
    const actions: { label: string; icon: React.ReactNode; action: () => void }[] = [];
    
    // Contact actions
    if (content.includes('kontakt') || content.includes('ring') || content.includes('mail') || 
        content.includes('71 78 65 75') || content.includes('hello@beautyboosters') || 
        content.includes('medarbejder') || content.includes('support')) {
      actions.push(
        { label: 'Ring til os', icon: <Phone className="h-3 w-3" />, action: () => window.open('tel:+4571786575', '_self') },
        { label: 'Send mail', icon: <Mail className="h-3 w-3" />, action: () => window.open('mailto:hello@beautyboosters.dk', '_self') }
      );
    }
    
    // Calendar/booking actions
    if (content.includes('kalender') || content.includes('booking') || content.includes('tid') || content.includes('aftale')) {
      if (userRole === 'booster') {
        actions.push({ label: 'Min kalender', icon: <Calendar className="h-3 w-3" />, action: () => navigate('/booster/calendar') });
      } else if (userRole === 'admin') {
        actions.push({ label: 'Se bookings', icon: <Calendar className="h-3 w-3" />, action: () => navigate('/admin/bookings') });
      } else {
        actions.push({ label: 'Book en tid', icon: <Calendar className="h-3 w-3" />, action: () => navigate('/services') });
      }
    }
    
    // Finance/money actions
    if (content.includes('økonomi') || content.includes('indtjening') || content.includes('faktura') || 
        content.includes('penge') || content.includes('betaling') || content.includes('omsætning')) {
      if (userRole === 'booster') {
        actions.push({ label: 'Se økonomi', icon: <Wallet className="h-3 w-3" />, action: () => navigate('/booster/finance') });
      } else if (userRole === 'admin') {
        actions.push({ label: 'Økonomioversigt', icon: <Wallet className="h-3 w-3" />, action: () => navigate('/admin/finance') });
      }
    }
    
    // VAT/moms actions (booster specific)
    if (content.includes('moms') || content.includes('skat') || content.includes('cvr')) {
      if (userRole === 'booster') {
        actions.push({ label: 'Se momsdetaljer', icon: <FileText className="h-3 w-3" />, action: () => navigate('/booster/finance') });
      }
    }
    
    // Become booster / apply actions
    if (content.includes('bliv booster') || content.includes('ansøg') || content.includes('blive booster') || 
        content.includes('freelance') || content.includes('arbejde hos') || content.includes('job hos')) {
      actions.push({ label: 'Bliv Booster', icon: <Star className="h-3 w-3" />, action: () => navigate('/booster-signup') });
    }
    
    // Jobs actions
    if (content.includes('job') || content.includes('opgave')) {
      if (userRole === 'booster') {
        actions.push({ label: 'Se ledige jobs', icon: <Briefcase className="h-3 w-3" />, action: () => navigate('/booster/jobs') });
      } else if (userRole === 'admin') {
        actions.push({ label: 'Administrer jobs', icon: <Briefcase className="h-3 w-3" />, action: () => navigate('/admin/jobs') });
      }
    }
    
    // Profile/portfolio actions
    if (content.includes('profil') || content.includes('portfolio') || content.includes('billede')) {
      if (userRole === 'booster') {
        actions.push({ label: 'Rediger profil', icon: <User className="h-3 w-3" />, action: () => navigate('/booster/profile') });
        actions.push({ label: 'Min portfolio', icon: <Image className="h-3 w-3" />, action: () => navigate('/booster/portfolio') });
      }
    }
    
    // Settings actions
    if (content.includes('indstilling') || content.includes('ændre') || content.includes('opdater')) {
      if (userRole === 'booster') {
        actions.push({ label: 'Indstillinger', icon: <Settings className="h-3 w-3" />, action: () => navigate('/booster/settings') });
      } else if (userRole === 'admin') {
        actions.push({ label: 'Indstillinger', icon: <Settings className="h-3 w-3" />, action: () => navigate('/admin/settings') });
      }
    }
    
    // Boosters/stylists actions (customer) - but not if already added "Bliv Booster"
    if ((content.includes('booster') || content.includes('stylist') || content.includes('artist') || content.includes('find')) &&
        !content.includes('bliv booster') && !content.includes('blive booster') && !content.includes('ansøg')) {
      if (userRole === 'customer') {
        actions.push({ label: 'Se vores boosters', icon: <Users className="h-3 w-3" />, action: () => navigate('/stylists') });
      }
    }
    
    // Services actions (customer)
    if (content.includes('service') || content.includes('makeup') || content.includes('hår') || 
        content.includes('spraytan') || content.includes('behandling')) {
      if (userRole === 'customer') {
        actions.push({ label: 'Se services', icon: <Star className="h-3 w-3" />, action: () => navigate('/services') });
      }
    }
    
    // Giftcard actions
    if (content.includes('gavekort') || content.includes('gave')) {
      actions.push({ label: 'Køb gavekort', icon: <Gift className="h-3 w-3" />, action: () => navigate('/giftcards') });
    }
    
    // Messages actions
    if (content.includes('besked') || content.includes('skriv') || content.includes('chat')) {
      if (userRole === 'booster') {
        actions.push({ label: 'Mine beskeder', icon: <MessageSquare className="h-3 w-3" />, action: () => navigate('/booster/messages') });
      } else if (userRole === 'admin') {
        actions.push({ label: 'Beskeder', icon: <MessageSquare className="h-3 w-3" />, action: () => navigate('/admin/messages') });
      }
    }
    
    // Limit to max 3 buttons
    return actions.slice(0, 3);
  };

  const contextualActions = getContextualActions();

  const sendMessage = async () => {
    await sendMessageWithText(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRoleGradient = () => {
    if (userRole === 'admin') return 'from-purple-500 to-purple-600';
    if (userRole === 'booster') return 'from-primary to-primary/80';
    return 'from-pink-500 to-rose-500';
  };

  // Check if on a page with interactive fields that need visibility
  const needsHigherPosition = () => {
    const path = location.pathname;
    return path.includes('booking') || path.includes('checkout') || path.includes('inquiry');
  };

  const buttonPosition = needsHigherPosition() ? 'bottom-32' : 'bottom-8';
  const chatPosition = needsHigherPosition() ? 'bottom-48' : 'bottom-24';

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          `fixed ${buttonPosition} right-6 z-40 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105`,
          'bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white'
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <span className="text-2xl">🙋🏼‍♀️</span>}
      </Button>

      {/* Chat window */}
      {isOpen && (
        <div className={`fixed ${chatPosition} right-6 z-40 w-[380px] max-w-[calc(100vw-3rem)] rounded-2xl border bg-background shadow-2xl`}>
          {/* Header */}
          <div className={cn(
            'flex items-center gap-3 rounded-t-2xl p-4 text-white',
            `bg-gradient-to-r ${getRoleGradient()}`
          )}>
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                <span className="text-2xl">🙋🏼‍♀️</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Betty</h3>
              <p className="text-xs opacity-90">
                {userRole === 'admin' ? 'Din admin-assistent' : userRole === 'booster' ? 'Din booster-assistent' : 'Din beauty-assistent'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[320px] p-4" ref={scrollRef}>
            <div className="flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-2',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600'
                  )}>
                    {msg.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <span className="text-sm">🙋🏼‍♀️</span>
                    )}
                  </div>
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}>
                    {msg.content || (isLoading && i === messages.length - 1 ? (
                      <span className="flex items-center gap-1">
                        <span className="animate-bounce">.</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                      </span>
                    ) : null)}
                  </div>
                </div>
              ))}

              {/* Quick actions */}
              {showQuickActions && messages.length === 1 && !isLoading && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {getQuickActions().map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(action)}
                      className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Contextual action buttons */}
              {contextualActions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {contextualActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={action.action}
                      className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-primary hover:text-primary-foreground"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Spørg Betty om noget..."
                disabled={isLoading}
                className="flex-1 rounded-full"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className={cn('rounded-full', `bg-gradient-to-r ${getRoleGradient()}`)}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Betty er en AI og kan lave fejl. Kontakt os ved tvivl.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
