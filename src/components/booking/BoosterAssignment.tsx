import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, MapPin, Star, CheckCircle2, X } from "lucide-react";
import { CartItem } from "@/contexts/CartContext";
import { toast } from "sonner";

interface Booster {
  id: string;
  name: string;
  specialties: string[];
  hourly_rate: number;
  portfolio_image_url: string | null;
  location: string;
  rating: number;
  review_count: number;
  years_experience: number;
  bio: string | null;
}

interface BoosterAssignmentProps {
  items: CartItem[];
  availableBoosters: Booster[];
  loading: boolean;
  onAutoAssign: () => void;
  onManualAssign: (serviceIndex: number, booster: Booster) => void;
  onRemoveBooster: (serviceIndex: number, boosterIndex: number) => void;
  assignments: Map<number, Booster[]>;
}

export const BoosterAssignment = ({
  items,
  availableBoosters,
  loading,
  onAutoAssign,
  onManualAssign,
  onRemoveBooster,
  assignments
}: BoosterAssignmentProps) => {
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [sortBy, setSortBy] = useState<"rating" | "soonest" | "nearest" | "price">("rating");

  // Sort boosters based on selected criteria
  const sortedBoosters = useMemo(() => {
    const sorted = [...availableBoosters];
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "price":
        sorted.sort((a, b) => a.hourly_rate - b.hourly_rate);
        break;
      case "nearest":
        // Could implement distance-based sorting if location data available
        // For now, just maintain current order
        break;
      case "soonest":
        // Could implement availability-based sorting
        // For now, just maintain current order
        break;
    }
    return sorted;
  }, [availableBoosters, sortBy]);

  const getServiceAssignments = (serviceIndex: number) => {
    return assignments.get(serviceIndex) || [];
  };

  const isServiceFullyAssigned = (item: CartItem, serviceIndex: number) => {
    const assigned = getServiceAssignments(serviceIndex);
    return assigned.length >= item.boosters;
  };

  const allServicesAssigned = items.every((item, index) => 
    isServiceFullyAssigned(item, index)
  );

  return (
    <div className="space-y-6">
      {/* Auto assign button */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Automatisk tildeling
              </h3>
              <p className="text-sm text-muted-foreground">
                Vi matcher automatisk de bedste boosters baseret på kompetencer og geografi
              </p>
            </div>
            <Button
              size="lg"
              onClick={onAutoAssign}
              disabled={loading || allServicesAssigned}
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              Tildel automatisk
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Eller vælg boosters manuelt</CardTitle>
          <CardDescription>
            Vælg specifik booster til hver service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedServiceIndex.toString()} onValueChange={(v) => setSelectedServiceIndex(parseInt(v))}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {items.map((item, index) => {
                const assigned = getServiceAssignments(index);
                const isComplete = isServiceFullyAssigned(item, index);
                
                return (
                  <TabsTrigger key={index} value={index.toString()} className="gap-2">
                    {isComplete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    Service {index + 1}
                    <Badge variant={isComplete ? "default" : "secondary"} className="ml-1">
                      {assigned.length}/{item.boosters}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {items.map((item, serviceIndex) => {
              const assigned = getServiceAssignments(serviceIndex);
              const remainingSlots = item.boosters - assigned.length;

              return (
                <TabsContent key={serviceIndex} value={serviceIndex.toString()} className="space-y-4 mt-4">
                  {/* Service info */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">{item.name}</h4>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{item.people} {item.people === 1 ? 'person' : 'personer'}</span>
                      <span className="font-medium text-foreground">
                        Mangler {remainingSlots} {remainingSlots === 1 ? 'booster' : 'boosters'}
                      </span>
                    </div>
                  </div>

                  {/* Assigned boosters */}
                  {assigned.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Tildelte boosters:</h5>
                      <div className="space-y-2">
                        {assigned.map((booster, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                            <img
                              src={booster.portfolio_image_url || '/placeholder.svg'}
                              alt={booster.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{booster.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {booster.location}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onRemoveBooster(serviceIndex, idx);
                                toast.success(`${booster.name} fjernet`);
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available boosters */}
                  {remainingSlots > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-muted-foreground">
                          Tilgængelige boosters ({sortedBoosters.length}):
                        </h5>
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                          <SelectTrigger className="w-[180px]" aria-label="Sorter efter">
                            <SelectValue placeholder="Sorter efter" />
                          </SelectTrigger>
                          <SelectContent className="z-50">
                            <SelectItem value="rating">Bedst bedømte</SelectItem>
                            <SelectItem value="soonest">Første ledige tid</SelectItem>
                            <SelectItem value="nearest">Nærmeste</SelectItem>
                            <SelectItem value="price">Pris</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Søger efter boosters...
                        </div>
                      ) : sortedBoosters.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Ingen tilgængelige boosters på dette tidspunkt
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sortedBoosters.map((booster) => {
                            const alreadyAssigned = assigned.some(b => b.id === booster.id);
                            
                            return (
                              <Card key={booster.id} className={alreadyAssigned ? "opacity-50" : "hover:shadow-md transition-shadow"}>
                                <CardContent className="p-4">
                                  <div className="flex gap-3">
                                    <img
                                      src={booster.portfolio_image_url || '/placeholder.svg'}
                                      alt={booster.name}
                                      className="w-16 h-16 rounded-lg object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h6 className="font-semibold text-sm mb-1">{booster.name}</h6>
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                        <MapPin className="h-3 w-3" />
                                        {booster.location}
                                      </div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="flex items-center gap-1 text-xs">
                                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          <span>{booster.rating}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          ({booster.review_count})
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1 mb-3">
                                        {booster.specialties.slice(0, 3).map((specialty) => (
                                          <Badge key={specialty} variant="outline" className="text-xs">
                                            {specialty}
                                          </Badge>
                                        ))}
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => onManualAssign(serviceIndex, booster)}
                                        disabled={alreadyAssigned}
                                        className="w-full"
                                      >
                                        {alreadyAssigned ? 'Allerede valgt' : 'Vælg booster'}
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
