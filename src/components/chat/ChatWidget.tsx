import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MessageCircle, X } from "lucide-react";

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const subject = encodeURIComponent("Chat besked fra " + (name || "kunde"));
    const body = encodeURIComponent(`${message}\n\n— Navn: ${name}\nEmail: ${email}`);
    window.location.href = `mailto:hello@beautyboosters.dk?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[320px] rounded-lg border bg-card shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/60">
            <div className="font-medium">Chat med os</div>
            <button aria-label="Luk chat" onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <Input placeholder="Dit navn" value={name} onChange={(e) => setName(e.target.value)} />
            <Input type="email" placeholder="Din email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Textarea placeholder="Skriv din besked…" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-24" />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSend}>Send</Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href="tel:+4571786575"><Phone className="mr-2 h-4 w-4" /> Ring</a>
              </Button>
            </div>
            <Button variant="ghost" className="w-full" asChild>
              <a href="mailto:hello@beautyboosters.dk"><Mail className="mr-2 h-4 w-4" /> hello@beautyboosters.dk</a>
            </Button>
          </div>
        </div>
      )}
      <Button size="lg" className="rounded-full shadow-lg" onClick={() => setOpen((v) => !v)} aria-label="Åbn chat">
        <MessageCircle className="mr-2 h-5 w-5" /> Chat
      </Button>
    </div>
  );
};

export default ChatWidget;
