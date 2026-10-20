import { Suspense } from "react";
import { LocalBusinessJsonLd } from "@/components/site/json-ld";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { mergeSiteContent, type SiteContent } from "@/lib/site-content";

const api = process.env.INTERNAL_API_URL ?? "http://localhost:3001";

async function getSettings() {
  try {
    const res = await fetch(`${api}/api/public/settings`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getCenters() {
  try {
    const res = await fetch(`${api}/api/public/centers`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function BrandHeader() {
  const settings = await getSettings();
  return <SiteHeader brand={settings?.brandingName ?? "Corujinha"} />;
}

async function SettingsFooter() {
  const [settings, centers] = await Promise.all([getSettings(), getCenters()]);
  const content = mergeSiteContent(settings?.content as SiteContent | null);
  const brand = settings?.brandingName ?? "Corujinha";
  const phone = settings?.contactPhone ?? content.contact.phone;

  return (
    <SiteFooter
      brand={brand}
      tagline={content.footer.tagline}
      phone={phone}
      email={settings?.contactEmail ?? content.contact.emailSecondary}
      whatsapp={process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? phone}
      links={content.footer.quickLinks}
      centers={centers}
    />
  );
}

async function SiteJsonLd() {
  const [settings, centers] = await Promise.all([getSettings(), getCenters()]);
  const content = mergeSiteContent(settings?.content as SiteContent | null);
  return (
    <LocalBusinessJsonLd
      brand={settings?.brandingName ?? "Corujinha"}
      phone={settings?.contactPhone ?? content.contact.phone}
      email={settings?.contactEmail ?? content.contact.emailSecondary}
      centers={centers}
    />
  );
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={null}>
        <SiteJsonLd />
      </Suspense>
      <Suspense fallback={<SiteHeader />}>
        <BrandHeader />
      </Suspense>
      <main id="main" className="pt-[72px]">
        {children}
      </main>
      <Suspense fallback={<SiteFooter />}>
        <SettingsFooter />
      </Suspense>
    </div>
  );
}
