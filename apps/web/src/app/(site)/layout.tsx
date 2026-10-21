import { Suspense } from "react";
import { LocalBusinessJsonLd } from "@/components/site/json-ld";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { fetchPublicJson, fetchPublicList } from "@/lib/public-api";
import { mergeSiteContent, type SiteContent } from "@/lib/site-content";

async function getSettings() {
  return fetchPublicJson<{
    brandingName?: string;
    contactPhone?: string | null;
    contactEmail?: string | null;
    content?: unknown;
  }>("/api/public/settings", ["settings"]);
}

type PublicCenter = {
  name: string;
  shortName?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
};

async function getCenters() {
  return fetchPublicList<PublicCenter>("/api/public/centers", ["centers"]);
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
