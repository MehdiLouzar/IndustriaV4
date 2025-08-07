// Front-End/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Industria - Plateforme B2B Zones Industrielles",
  description: "Découvrez et réservez des zones industrielles, parcs logistiques et zones franches à travers le Maroc. Votre partenaire pour l'implantation industrielle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}