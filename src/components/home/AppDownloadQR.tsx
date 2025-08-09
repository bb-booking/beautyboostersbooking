import React from "react";

const AppDownloadQR: React.FC = () => {
  return (
    <section id="download-app" className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold">Scan & download app</h2>
          <p className="mt-2 text-muted-foreground">Scan QR-koden for at hente vores app.</p>
          <div className="mt-6 flex items-center justify-center">
            <img
              src="/lovable-uploads/qr-download-app.png"
              alt="QR‑kode til at downloade BeautyBoosters app"
              width={256}
              height={256}
              loading="lazy"
              className="rounded-lg border"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadQR;
