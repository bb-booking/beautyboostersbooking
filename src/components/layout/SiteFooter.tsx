const SiteFooter = () => {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-10">
        <div id="kontakt" className="text-center max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold">Kontakt</h2>
          <p className="mt-2 text-muted-foreground">Vi hjælper dig gerne – kontakt os på mail eller telefon.</p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:hello@beautyboosters.dk" className="underline underline-offset-4">hello@beautyboosters.dk</a>
            <span className="hidden sm:block text-muted-foreground">•</span>
            <a href="tel:+4571786575" className="underline underline-offset-4">+45 71 78 65 75</a>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">© {new Date().getFullYear()} BeautyBoosters</p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
