import { Suspense } from "react";
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

async function BrandHeader() {
  const settings = await getSettings();
  return <SiteHeader brand={settings?.brandingName ?? "Corujinha"} />;
}

async function SettingsFooter() {
  const settings = await getSettings();
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
    />
  );
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
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
