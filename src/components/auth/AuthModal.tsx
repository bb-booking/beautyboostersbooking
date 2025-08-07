import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Briefcase, Mail, Facebook, Apple } from "lucide-react";

interface AuthModalProps {
  trigger: React.ReactNode;
}

const AuthModal = ({ trigger }: AuthModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Ind</DialogTitle>
          <DialogDescription>
            Vælg hvordan du vil logge ind eller oprette dig
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Som Kunde</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Mail className="h-4 w-4" />
                Log ind / Opret med email
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3">
                <Facebook className="h-4 w-4" />
                Fortsæt med Facebook
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3">
                <Apple className="h-4 w-4" />
                Fortsæt med Apple
              </Button>
            </div>
          </div>
          
          <hr className="my-4" />
          
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Som Booster</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Briefcase className="h-4 w-4" />
                Log ind som Booster
              </Button>
              <Button className="w-full justify-start gap-3">
                <User className="h-4 w-4" />
                Bliv Booster
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;