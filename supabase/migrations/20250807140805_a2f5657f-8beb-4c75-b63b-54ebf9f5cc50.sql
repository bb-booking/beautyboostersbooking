-- Create booster_profiles table
CREATE TABLE public.booster_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  hourly_rate INTEGER NOT NULL,
  portfolio_image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  location TEXT NOT NULL,
  years_experience INTEGER DEFAULT 1,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.booster_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing boosters (public access)
CREATE POLICY "Boosters are viewable by everyone" 
ON public.booster_profiles 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_booster_profiles_updated_at
BEFORE UPDATE ON public.booster_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 30 BeautyBoosters with Danish data
INSERT INTO public.booster_profiles (name, specialties, bio, hourly_rate, portfolio_image_url, rating, review_count, location, years_experience, is_available) VALUES
('Anna G.', ARRAY['Makeup artist', 'Hårstylist'], 'Passioneret makeup artist og hårstylist med speciale i bryllupsmakeup og festlook. Jeg elsker at fremhæve hver persons naturlige skønhed.', 650, 'https://images.unsplash.com/photo-1594736797933-d0d26734e3b8?w=400&h=400&fit=crop', 4.8, 127, 'København', 6, true),
('Angelica', ARRAY['Makeup artist'], 'Specialiseret i naturlig makeup og hudpleje. Med 4 års erfaring hjælper jeg med at skabe det perfekte look til enhver lejlighed.', 550, 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop', 4.9, 89, 'Aarhus', 4, true),
('Ann-Katrine', ARRAY['Makeup artist', 'Hårstylist', 'Frisør'], 'Erfaren frisør og stylist med passion for kreative looks. Specialiseret i både klipning, farve og styling til alle anledninger.', 720, 'https://images.unsplash.com/photo-1559599746-fdc1d427e7f8?w=400&h=400&fit=crop', 4.7, 156, 'Odense', 8, true),
('Bela', ARRAY['Makeup artist', 'Hårstylist'], 'MAKEUP ARTIST og hårstylist med fokus på moderne trends og klassiske looks. Jeg skaber looks der får dig til at føle dig smuk og selvsikker.', 600, 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=400&fit=crop', 4.8, 92, 'København', 5, true),
('Carla Sofie F.', ARRAY['Makeup artist'], 'Makeup artist med speciale i editorial og fashion makeup. Jeg elsker at eksperimentere med farver og skabe unikke looks.', 580, 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=400&fit=crop', 4.6, 73, 'Aalborg', 3, true),
('Clara Alma', ARRAY['Makeup artist', 'Hårstylist', 'Frisør'], 'Kreativ stylist med erfaring inden for både makeup, hår og frisørarbejde. Jeg tilbyder komplette makeovers og styling.', 680, 'https://images.unsplash.com/photo-1544717684-6ae7b13d7a1c?w=400&h=400&fit=crop', 4.9, 143, 'København', 7, true),
('Darun', ARRAY['Makeup artist', 'Hårstylist', 'Frisør'], 'Professionel stylist med passion for at skabe flotte looks. Specialiseret i både naturlige og dramatiske styles.', 640, 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop', 4.7, 98, 'Aarhus', 6, true),
('Donna', ARRAY['Makeup artist', 'Hårstylist'], 'Makeup artist og hårstylist med over 10 års erfaring. Jeg hjælper dig med at finde din perfekte stil til enhver lejlighed.', 750, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop', 4.8, 189, 'København', 10, true),
('Fay', ARRAY['Makeup artist', 'Hårstylist'], 'Kreativ makeup artist og hårstylist med speciale i bryllup og events. Jeg skaber looks der holder hele dagen.', 620, 'https://images.unsplash.com/photo-1494790108755-2616c9ca8e40?w=400&h=400&fit=crop', 4.9, 134, 'Odense', 5, true),
('Gabriella', ARRAY['Makeup artist', 'Hårstylist'], 'Passioneret stylist med fokus på at fremhæve din naturlige skønhed. Specialiseret i både makeup og hårstyling.', 590, 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop', 4.7, 87, 'Århus', 4, true),
('Ida', ARRAY['Makeup artist', 'Hårstylist'], 'Makeup artist og hårstylist med erfaring inden for fashion og beauty. Jeg skaber moderne looks med personlig touch.', 610, 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop', 4.8, 116, 'København', 6, true),
('Jeanie', ARRAY['Makeup artist', 'Hårstylist', 'Frisør'], 'Erfaren frisør og stylist med passion for kreativitet. Jeg tilbyder både klipning, farve, makeup og styling.', 700, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop', 4.6, 167, 'Aalborg', 9, true),
('Josephine O.', ARRAY['Spraytan artist'], 'Spraytan artist med speciale i naturlige, solkyssede looks. Jeg giver dig den perfekte tan til enhver sæson.', 450, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop', 4.9, 78, 'København', 3, true),
('Josephine S.', ARRAY['Makeup artist', 'Hårstylist'], 'Makeup artist og hårstylist med fokus på elegante og tidløse looks. Perfekt til både hverdags- og festmakeup.', 580, 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop', 4.7, 101, 'Odense', 5, true),
('Karoline', ARRAY['Makeup artist', 'Hårstylist', 'Frisør'], 'Makeup artist, hårstyling og frisør med erfaring inden for både kommercielt og kreativt arbejde.', 660, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', 4.8, 128, 'Aarhus', 7, true),
('Katrine J.', ARRAY['Makeup artist', 'Hårstylist'], 'Passioneret makeup artist og hårstylist med speciale i natural glam og dewy looks. Perfekt til enhver hudtype.', 600, 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=400&h=400&fit=crop', 4.9, 145, 'København', 6, true),
('Kristine', ARRAY['Makeup artist', 'Hårstylist'], 'Makeup artist og hårstylist med fokus på at skabe looks der afspejler din personlighed og stil.', 570, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop', 4.6, 94, 'Aalborg', 4, true),
('Liza', ARRAY['Makeup artist', 'Hårstylist'], 'Booster Liza specialiserer sig i både dramatiske og naturlige looks. Med erfaring fra modebranchen skaber jeg unikke styles.', 630, 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=400&fit=crop', 4.8, 112, 'København', 5, true),
('Marie', ARRAY['Makeup artist', 'Hårstylist'], 'Makeup artist og hårstylist med passion for bryllupsmakeup og special events. Jeg sørger for at du ser perfekt ud hele dagen.', 650, 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=400&fit=crop', 4.9, 178, 'Odense', 8, true),
('Mariola', ARRAY['Makeup artist', 'Hårstylist'], 'Kreativ makeup artist og hårstylist med internationale erfaringer. Specialiseret i både europæiske og amerikanske trends.', 680, 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400&h=400&fit=crop', 4.7, 156, 'København', 7, true),
('Michaela', ARRAY['Makeup artist', 'Hårstylist'], 'Makeup artist og hårstylist med erfaring fra TV og film. Jeg skaber looks der både ser fantastiske ud og holder i mange timer.', 720, 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop', 4.8, 203, 'Aarhus', 9, true),
('My Phung', ARRAY['Makeup artist', 'Hårstylist'], 'Makeup artist og hårstylist med speciale i asiatisk skønhedsteknik og K-beauty trends. Perfekt til naturlige, strålende looks.', 590, 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop', 4.9, 87, 'København', 4, true),
('Nanna', ARRAY['Makeup artist', 'Hårstylist', 'Frisør'], 'Erfaren frisør og stylist med fokus på bæredygtige produkter og teknikker. Skaber smukke looks med respekt for miljøet.', 640, 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?w=400&h=400&fit=crop', 4.7, 134, 'Aalborg', 6, true),
('Niels', ARRAY['Makeup artist', 'Hårstylist'], 'Makeup artist og hårstylist med erfaring inden for både herremakeup og damemakeup. Jeg skaber looks for alle køn og aldre.', 580, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', 4.6, 76, 'Odense', 3, true),
('Stephanie', ARRAY['Makeup artist', 'Hårstylist', 'SFX makeup', 'Lash/brow lift', 'Negleteknikker'], 'Makeup artist, hårstylist, SFX makeup, lash/brow lift og negleteknikker. Jeg tilbyder omfattende skønhedsbehandlinger under ét tag.', 800, 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&h=400&fit=crop', 4.9, 267, 'København', 12, true),
('Tenna', ARRAY['Makeup artist', 'Hårstylist'], 'Makeup artist og hårstylist med speciale i vintage og retro looks. Perfekt hvis du ønsker et unikt og tidløst look.', 620, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop', 4.8, 119, 'Aarhus', 5, true),
('Thurka', ARRAY['Makeup artist', 'Hårstylist'], 'Makeup artist og hårstylist med speciale i multikulturel skønhed. Jeg har erfaring med alle hudtoner og hårtyper.', 610, 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400&h=400&fit=crop', 4.7, 98, 'København', 4, true),
('Trine', ARRAY['Makeup artist', 'Hårstylist', 'Frisør'], 'Makeup artist, hårstylist og frisør med over 15 års erfaring. Jeg tilbyder komplette makeovers og vejledning i hudpleje.', 750, 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=400&h=400&fit=crop', 4.9, 298, 'Odense', 15, true),
('Ulla', ARRAY['Makeup artist', 'Hårstylist'], 'MAKEUP ARTIST & HÅRSTYLIST med erfaring fra luksusbranchen. Jeg skaber elegante looks med fokus på kvalitet og detaljer.', 700, 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop', 4.8, 178, 'København', 8, true),
('Yasmin', ARRAY['Makeup artist', 'Hårstylist'], 'Makeup artist og hårstylist med passion for både traditionelle og moderne teknikker. Specialiseret i mellemøstlige skønhedstraditioner.', 630, 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&h=400&fit=crop', 4.7, 156, 'Aalborg', 6, true);