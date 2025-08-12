import Hero from "@/components/home/Hero";
import AppDownloadQR from "@/components/home/AppDownloadQR";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Professionelle beauty services til døren | BeautyBoosters</title>
        <meta name="description" content="Book udkørende artister i hele landet. Professionelle stylister direkte til døren." />
        <link rel="canonical" href="/" />
      </Helmet>
      <Hero />
      <AppDownloadQR />
    </div>
  );
};

export default Index;
