import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { User, Briefcase, Mail, Facebook, Apple, Shield } from "lucide-react";
import { Link } from "react-router-dom";

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
              <DialogClose asChild>
                <Link to="/auth">
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <Mail className="h-4 w-4" />
                    Log ind / Opret med email
                  </Button>
                </Link>
              </DialogClose>
              <Button variant="outline" className="w-full justify-start gap-3" disabled>
                <Facebook className="h-4 w-4" />
                Fortsæt med Facebook (snart)
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3" disabled>
                <Apple className="h-4 w-4" />
                Fortsæt med Apple (snart)
              </Button>
            </div>
          </div>
          
          <hr className="my-4" />
          
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Som Booster</h3>
            <div className="space-y-2">
              <DialogClose asChild>
                <Link to="/booster/login">
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <Briefcase className="h-4 w-4" />
                    Log ind Booster
                  </Button>
                </Link>
              </DialogClose>
              <DialogClose asChild>
                <Link to="/booster-signup">
                  <Button className="w-full justify-start gap-3">
                    <User className="h-4 w-4" />
                    Opret Booster
                  </Button>
                </Link>
              </DialogClose>
            </div>
          </div>
          
          <hr className="my-4" />
          
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Som Admin</h3>
            <div className="space-y-2">
              <DialogClose asChild>
                <Link to="/admin/login">
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <Shield className="h-4 w-4" />
                    Log ind Admin
                  </Button>
                </Link>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;