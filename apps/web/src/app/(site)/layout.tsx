import { SiteFooter, SiteHeader } from "@/components/site/shell";
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

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const content = mergeSiteContent(settings?.content as SiteContent | null);
  const brand = settings?.brandingName ?? "Corujinha";

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader brand={brand} />
      <main id="main" className="pt-[72px]">
        {children}
      </main>
      <SiteFooter
        brand={brand}
        tagline={content.footer.tagline}
        phone={settings?.contactPhone ?? content.contact.phone}
        email={settings?.contactEmail ?? content.contact.emailSecondary}
        links={content.footer.quickLinks}
      />
    </div>
  );
}
