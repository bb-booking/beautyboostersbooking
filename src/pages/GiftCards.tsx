import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function GiftCards() {
  const [amount, setAmount] = useState<number>(500);
  const presets = [250, 500, 750, 1000];

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>Køb gavekort | BeautyBoosters</title>
        <meta name="description" content="Køb gavekort til BeautyBoosters. Vælg beløb og glæd en du holder af." />
        <link rel="canonical" href="/giftcards" />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">Køb gavekort</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vælg beløb</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {presets.map((p) => (
                <Button key={p} variant={amount === p ? "default" : "outline"} onClick={() => setAmount(p)}>
                  {p} DKK
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Andet beløb</Label>
              <Input type="number" min={100} step={50} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div className="text-sm text-muted-foreground">Gavekort er gyldige i 24 måneder fra købsdato.</div>
            <Button size="lg" className="w-full" disabled>
              Køb gavekort (snart)
            </Button>
            <div className="text-sm text-muted-foreground text-center">Har du spørgsmål? <Link to="/inquiry" className="underline">Kontakt os</Link></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sådan fungerer det</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Vælg et beløb eller indtast dit eget</li>
              <li>Modtag gavekortet straks på e-mail</li>
              <li>Kan bruges på alle BeautyBoosters services</li>
              <li>Gyldigt i 24 måneder</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
