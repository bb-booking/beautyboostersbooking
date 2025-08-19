import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'da' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  da: {
    // Header
    'header.search.placeholder': 'Søg efter services...',
    'header.menu': 'Menu',
    'header.navigation': 'Navigation',
    'header.services': 'Se services',
    'header.boosters': 'Vores Boosters',
    'header.giftcards': 'Køb gavekort',
    'header.become_booster': 'Bliv Booster',
    'header.admin_login': 'Log ind Admin',
    'header.contact': 'Kontakt',
    'header.download_app': 'Download app',
    'header.language': 'Sprog',
    'header.danish': 'Dansk',
    'header.english': 'English',
    'header.login': 'Log Ind',
    'header.logout': 'Log ud',
    'header.open_menu': 'Åbn menu',
    'header.all_services': 'Se alle services',
    
    // Hero section
    'hero.title': 'Find professionelle artister til din smukke begivenhed',
    'hero.subtitle': 'Book udkørende artister i København, Nordsjælland, Aarhus, Aalborg og Odense. Professionelle artister direkte til døren.',
    'hero.search.placeholder': 'Hvad skal du bookes til?',
    'hero.search.button': 'Søg',
    'hero.popular.title': 'Populære services',
    'hero.popular.makeup': 'Makeup Styling',
    'hero.popular.spray_tan': 'Spraytan',
    'hero.popular.hair': 'Hårstyling / håropsætning',
    'hero.popular.bridal': 'Brudestyling',
    'hero.popular.courses': 'Makeup Kursus',
    'hero.popular.event': 'Event makeup',
    
    // Service categories
    'categories.all_services': 'Alle services',
    'categories.makeup_hair': 'Makeup & Hår',
    'categories.spraytan': 'Spraytan',
    'categories.confirmation': 'Konfirmation',
    'categories.bridal': 'Bryllup - Brudestyling',
    'categories.makeup_courses': 'Makeup Kurser',
    'categories.event': 'Event',
    'categories.children': 'Børn',
    
    // App download
    'app.title': 'Download vores app',
    'app.subtitle': 'Få den bedste oplevelse med vores mobile app',
    'app.scan': 'Scan QR-koden for at downloade appen',
    
    // Booster signup
    'booster.portfolio.title': 'Portfolio og sociale medier',
    'booster.portfolio.description': 'Tilføj links til dit arbejde så vi kan se dine færdigheder (Instagram, Facebook, hjemmeside, etc.)',
    'booster.portfolio.placeholder': 'Skriv din ig/fb/web/link til portfolio'
  },
  en: {
    // Header
    'header.search.placeholder': 'Search for services...',
    'header.menu': 'Menu',
    'header.navigation': 'Navigation',
    'header.services': 'View services',
    'header.boosters': 'Our Boosters',
    'header.giftcards': 'Buy gift cards',
    'header.become_booster': 'Become Booster',
    'header.admin_login': 'Admin Login',
    'header.contact': 'Contact',
    'header.download_app': 'Download app',
    'header.language': 'Language',
    'header.danish': 'Dansk',
    'header.english': 'English',
    'header.login': 'Log In',
    'header.logout': 'Log Out',
    'header.open_menu': 'Open menu',
    'header.all_services': 'View all services',
    
    // Hero section
    'hero.title': 'Find professional artists for your beautiful event',
    'hero.subtitle': 'Book mobile artists in Copenhagen, North Zealand, Aarhus, Aalborg and Odense. Professional artists directly to your door.',
    'hero.search.placeholder': 'What do you need to book?',
    'hero.search.button': 'Search',
    'hero.popular.title': 'Popular services',
    'hero.popular.makeup': 'Makeup Styling',
    'hero.popular.spray_tan': 'Spray Tan',
    'hero.popular.hair': 'Hair Styling / Updo',
    'hero.popular.bridal': 'Bridal Styling',
    'hero.popular.courses': 'Makeup Course',
    'hero.popular.event': 'Event Makeup',
    
    // Service categories
    'categories.all_services': 'All services',
    'categories.makeup_hair': 'Makeup & Hair',
    'categories.spraytan': 'Spray Tan',
    'categories.confirmation': 'Confirmation',
    'categories.bridal': 'Wedding - Bridal Styling',
    'categories.makeup_courses': 'Makeup Courses',
    'categories.event': 'Event',
    'categories.children': 'Children',
    
    // App download
    'app.title': 'Download our app',
    'app.subtitle': 'Get the best experience with our mobile app',
    'app.scan': 'Scan the QR code to download the app',
    
    // Booster signup
    'booster.portfolio.title': 'Portfolio and social media',
    'booster.portfolio.description': 'Add links to your work so we can see your skills (Instagram, Facebook, website, etc.)',
    'booster.portfolio.placeholder': 'Enter your ig/fb/web/portfolio link'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('da');

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && (savedLang === 'da' || savedLang === 'en')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};