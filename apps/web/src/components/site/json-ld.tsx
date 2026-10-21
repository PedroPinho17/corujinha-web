type CenterLd = {
  name: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
};

const FALLBACK_CENTERS: CenterLd[] = [
  { name: "Lobão" },
  { name: "São João de Ver" },
  { name: "Sanguedo" },
];

export function LocalBusinessJsonLd({
  brand = "Corujinha",
  description,
  phone,
  email,
  centers,
}: {
  brand?: string;
  description?: string;
  phone?: string | null;
  email?: string | null;
  centers?: CenterLd[] | null;
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const list = centers?.length ? centers : FALLBACK_CENTERS;

  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: brand,
    description:
      description ??
      "Centro de explicações e apoio educativo para crianças até ao 12º ano.",
    url: siteUrl,
    logo: `${siteUrl}/logo.webp`,
    telephone: phone || undefined,
    email: email || undefined,
    areaServed: "PT",
    department: list.map((c) => ({
      "@type": "LocalBusiness",
      name: `${brand} — ${c.name}`,
      telephone: c.phone || phone || undefined,
      email: c.email || email || undefined,
      address: c.address
        ? {
            "@type": "PostalAddress",
            streetAddress: c.address,
            addressLocality: c.city || undefined,
            postalCode: c.postalCode || undefined,
            addressCountry: "PT",
          }
        : c.city
          ? {
              "@type": "PostalAddress",
              addressLocality: c.city,
              postalCode: c.postalCode || undefined,
              addressCountry: "PT",
            }
          : undefined,
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Escape < so editor-controlled strings cannot break out of the script tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
