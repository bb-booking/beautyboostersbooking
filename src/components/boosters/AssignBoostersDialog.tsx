import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Users, Wand2 } from "lucide-react";

export type BoosterOption = {
  id: string;
  name: string;
  portfolio_image_url?: string | null;
  location?: string | null;
  rating?: number | null;
  review_count?: number | null;
  specialties?: string[];
};

interface AssignBoostersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryBoosterId?: string;
  alreadyAssignedIds?: string[];
  date?: Date | string;
  time?: string;
  serviceCategory?: string;
  desiredCount?: number;
  maxAllowed?: number; // Maximum total boosters allowed (boosters_needed)
  onAutoAssign: (selected: BoosterOption[]) => void;
  onConfirm: (selected: BoosterOption[]) => void;
}

const categoryToSpecialty = (category?: string) => {
  if (!category) return undefined;
  const map: Record<string, string> = {
    "Spraytan": "Spraytan",
    "Event": "Event",
    "Børn": "Event",
    "Shoot/reklame": "Shoot/Reklame",
    "Bryllup - Brudestyling": "Bryllup",
    "Makeup & Hår": "Makeup",
    "Makeup Kurser": "Makeup",
  };
  return map[category] || undefined;
};

export default function AssignBoostersDialog({
  open,
  onOpenChange,
  primaryBoosterId,
  alreadyAssignedIds = [],
  date,
  time,
  serviceCategory,
  desiredCount,
  maxAllowed,
  onAutoAssign,
  onConfirm,
}: AssignBoostersDialogProps) {
  const [loading, setLoading] = useState(false);
  const [boosters, setBoosters] = useState<BoosterOption[]>([]);
  const [selected, setSelected] = useState<Record<string, BoosterOption>>({});
  const [search, setSearch] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const specialtyFilter = useMemo(() => categoryToSpecialty(serviceCategory), [serviceCategory]);
  
  // Memoize alreadyAssignedIds to prevent unnecessary re-renders
  const assignedIdsKey = useMemo(() => alreadyAssignedIds.join(','), [alreadyAssignedIds]);

  useEffect(() => {
    if (!open) {
      setHasFetched(false);
      return;
    }
    
    // Prevent multiple fetches when dialog is open
    if (hasFetched) return;
    
    const fetchBoosters = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("booster_profiles")
          .select("id, name, portfolio_image_url, location, rating, review_count, specialties, is_available")
          .eq("is_available", true);
        
        if (error) {
          setBoosters([]);
          return;
        }
        
        let list = (data || []) as any[];
        
        // Filter out primary booster
        if (primaryBoosterId) {
          list = list.filter((b) => b.id !== primaryBoosterId);
        }
        
        // Sort by rating and reviews
        list.sort((a, b) => 
          (Number(b.rating || 0) - Number(a.rating || 0)) || 
          (Number(b.review_count || 0) - Number(a.review_count || 0))
        );
        
        setBoosters(list as BoosterOption[]);
        
        // Pre-select already assigned boosters
        const preSelected: Record<string, BoosterOption> = {};
        const assignedIds = assignedIdsKey.split(',').filter(Boolean);
        list.forEach((b: any) => {
          if (assignedIds.includes(b.id)) {
            preSelected[b.id] = b as BoosterOption;
          }
        });
        setSelected(preSelected);
        setHasFetched(true);
        
      } catch (e) {
        setBoosters([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBoosters();
  }, [open, primaryBoosterId, assignedIdsKey, hasFetched]);

  useEffect(() => {
    if (!open) {
      setManualMode(false);
      setSelected({});
      setSearch("");
      setLoading(false); // Clear loading state when dialog closes
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return boosters;
    return boosters.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      (b.location || "").toLowerCase().includes(q) ||
      (b.specialties || []).some((s) => s.toLowerCase().includes(q))
    );
  }, [boosters, search]);

  const selectedList = useMemo(() => Object.values(selected), [selected]);
  
  // Memoize assigned IDs as a Set for efficient lookup
  const assignedIdsSet = useMemo(() => new Set(alreadyAssignedIds), [assignedIdsKey]);

  // Calculate how many more boosters can be selected
  const remainingSlots = useMemo(() => {
    if (typeof maxAllowed !== 'number') return Infinity;
    return Math.max(0, maxAllowed - alreadyAssignedIds.length - selectedList.length);
  }, [maxAllowed, alreadyAssignedIds.length, selectedList.length]);

  const isAtLimit = remainingSlots === 0;

  const toggleSelect = (b: BoosterOption) => {
    // Don't allow toggling already assigned boosters
    if (assignedIdsSet.has(b.id)) return;
    
    setSelected((prev) => {
      const copy = { ...prev } as Record<string, BoosterOption>;
      if (copy[b.id]) {
        delete copy[b.id];
      } else {
        // Check if we've reached the limit before adding
        const currentCount = Object.keys(copy).length;
        const maxSelectable = typeof maxAllowed === 'number' 
          ? maxAllowed - alreadyAssignedIds.length 
          : Infinity;
        
        if (currentCount >= maxSelectable) {
          return copy; // Don't add more if at limit
        }
        copy[b.id] = b;
      }
      return copy;
    });
  };

  const handleAutoAssign = () => {
    // Instead of auto-assigning, send to ALL qualified boosters
    onAutoAssign(boosters);
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm(selectedList);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ekstra boosters</DialogTitle>
          <DialogDescription>
            {date && time ? `Til ${typeof date === 'string' ? date : (date as Date).toLocaleDateString('da-DK')} kl. ${time}` : "Vælg hvordan du vil tildele ekstra boosters"}
            {typeof desiredCount === 'number' && desiredCount > 0 ? ` – vælg ${desiredCount} ekstra` : ""}
          </DialogDescription>
        </DialogHeader>

        {!manualMode ? (
          <div className="space-y-3">
            <Button className="w-full" onClick={handleAutoAssign} disabled={loading}>
              <Wand2 className="mr-2 h-4 w-4" />
              Tildel automatisk booster
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setManualMode(true)}>
              <Users className="mr-2 h-4 w-4" />
              Vælg ekstra booster(s)
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søg på navn, lokation eller speciale"
            />
            <ScrollArea className="h-72 pr-3">
              <div className="space-y-2">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Henter boosters…</div>
                ) : filtered.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Ingen boosters fundet</div>
                ) : (
                  filtered.map((b) => {
                    const isAlreadyAssigned = assignedIdsSet.has(b.id);
                    const isSelected = !!selected[b.id];
                    const isDisabledByLimit = !isSelected && isAtLimit;
                    const isDisabled = isAlreadyAssigned || isDisabledByLimit;
                    return (
                      <label key={b.id} className={`flex items-center gap-3 p-2 rounded-md ${isDisabled ? 'bg-accent/50 cursor-not-allowed opacity-60' : 'hover:bg-accent cursor-pointer'}`}>
                        <Checkbox 
                          checked={isSelected} 
                          onCheckedChange={() => toggleSelect(b)}
                          disabled={isDisabled}
                        />
                        <img
                          src={b.portfolio_image_url || "/placeholder.svg"}
                          alt={b.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {b.name}
                            {isAlreadyAssigned && <span className="ml-2 text-xs text-muted-foreground">(Allerede tildelt)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {b.location || "Ukendt lokation"}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(b.specialties || []).slice(0, 3).map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        </div>
                        {typeof b.rating === "number" && (
                          <div className="text-xs text-muted-foreground">{b.rating?.toFixed(1)}★</div>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <div className="flex-1 text-sm text-muted-foreground">
                {typeof maxAllowed === 'number'
                  ? `Tildelt: ${alreadyAssignedIds.length + selectedList.length}/${maxAllowed}${isAtLimit ? ' (maks nået)' : ''}`
                  : `Valgt: ${selectedList.length}`
                }
              </div>
              <Button variant="outline" onClick={() => setManualMode(false)}>Tilbage</Button>
              <Button 
                onClick={handleConfirm} 
                disabled={selectedList.length === 0}
              >
                Bekræft valg
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
