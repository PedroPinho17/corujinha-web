"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/lib/admin-api";
import { mergeSiteContent, type SiteContent, type ServiceCard } from "@/lib/site-content";

type Settings = {
  brandingName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  content: SiteContent;
};

function lines(arr: string[]) {
  return arr.join("\n");
}

function fromLines(v: string) {
  return v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminSiteContentPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    adminFetch<Settings>("/api/admin/settings")
      .then((data) =>
        setSettings({
          ...data,
          content: mergeSiteContent(data.content),
        }),
      )
      .catch((e) => setMsg(e instanceof Error ? e.message : "Erro ao carregar"));
  }, []);

  if (!settings) {
    return <p className="text-muted">A carregar…</p>;
  }

  const c = settings.content;

  function setContent(next: SiteContent) {
    setSettings({ ...settings!, content: next });
  }

  function updateService(i: number, patch: Partial<ServiceCard>) {
    const cards = c.services.cards.map((card, idx) => (idx === i ? { ...card, ...patch } : card));
    setContent({ ...c, services: { ...c.services, cards } });
  }

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const updated = await adminFetch<Settings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings({
        ...updated,
        content: mergeSiteContent(updated.content),
      });
      setMsg("Guardado com sucesso");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <div className="max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-pink-600">Conteúdo do Site</h1>
            <p className="text-sm text-slate-500">
              Textos da home e páginas públicas — editáveis sem mexer no código.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="xl:hidden" onClick={() => setShowPreview((v) => !v)}>
              Preview
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "A guardar…" : "Guardar"}
            </Button>
          </div>
        </div>
        {msg && <p className="text-sm font-medium text-pink-600">{msg}</p>}

        {/* Branding */}
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Branding</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Nome da marca</Label>
              <Input
                value={settings.brandingName}
                onChange={(e) => setSettings({ ...settings, brandingName: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefone (geral)</Label>
              <Input
                value={settings.contactPhone ?? ""}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              />
            </div>
            <div>
              <Label>Email (geral)</Label>
              <Input
                value={settings.contactEmail ?? ""}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <Label>Morada (resumo)</Label>
              <Input
                value={settings.address ?? ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </div>
            <div>
              <Label>Facebook URL</Label>
              <Input
                value={settings.facebookUrl ?? ""}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
              />
            </div>
            <div>
              <Label>Instagram URL</Label>
              <Input
                value={settings.instagramUrl ?? ""}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Hero */}
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Hero</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Título (antes)</Label>
              <Input
                value={c.hero.titleBefore}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titleBefore: e.target.value } })}
              />
            </div>
            <div>
              <Label>Palavra rosa</Label>
              <Input
                value={c.hero.titlePink}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titlePink: e.target.value } })}
              />
            </div>
            <div>
              <Label>Meio (ex.: &quot;e&quot;)</Label>
              <Input
                value={c.hero.titleMid}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titleMid: e.target.value } })}
              />
            </div>
            <div>
              <Label>Palavra laranja</Label>
              <Input
                value={c.hero.titleOrange}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titleOrange: e.target.value } })}
              />
            </div>
            <div>
              <Label>CTA principal</Label>
              <Input
                value={c.hero.ctaPrimary}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, ctaPrimary: e.target.value } })}
              />
            </div>
            <div>
              <Label>CTA secundário</Label>
              <Input
                value={c.hero.ctaSecondary}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, ctaSecondary: e.target.value } })}
              />
            </div>
            <div>
              <Label>Badge valor</Label>
              <Input
                value={c.hero.badgeValue}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, badgeValue: e.target.value } })}
              />
            </div>
            <div>
              <Label>Badge texto</Label>
              <Input
                value={c.hero.badgeLabel}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, badgeLabel: e.target.value } })}
              />
            </div>
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Textarea
              value={c.hero.subtitle}
              onChange={(e) => setContent({ ...c, hero: { ...c.hero, subtitle: e.target.value } })}
            />
          </div>
          <div>
            <Label>Destaques do hero (formato: título | descrição | pink/orange/blue)</Label>
            <Textarea
              rows={4}
              value={c.hero.features.map((f) => `${f.title} | ${f.description} | ${f.tone}`).join("\n")}
              onChange={(e) =>
                setContent({
                  ...c,
                  hero: {
                    ...c.hero,
                    features: fromLines(e.target.value).map((line) => {
                      const [title, description, tone] = line.split("|").map((s) => s.trim());
                      const t = tone === "orange" || tone === "blue" ? tone : "pink";
                      return { title: title || "", description: description || "", tone: t };
                    }),
                  },
                })
              }
            />
          </div>
        </section>

        {/* Serviços */}
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Serviços</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Título</Label>
              <Input
                value={c.services.title}
                onChange={(e) => setContent({ ...c, services: { ...c.services, title: e.target.value } })}
              />
            </div>
            <div>
              <Label>Título accent</Label>
              <Input
                value={c.services.titleAccent}
                onChange={(e) =>
                  setContent({ ...c, services: { ...c.services, titleAccent: e.target.value } })
                }
              />
            </div>
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Textarea
              value={c.services.subtitle}
              onChange={(e) => setContent({ ...c, services: { ...c.services, subtitle: e.target.value } })}
            />
          </div>
          {c.services.cards.map((card, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">Cartão {i + 1}</p>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <Label>Título</Label>
                  <Input value={card.title} onChange={(e) => updateService(i, { title: e.target.value })} />
                </div>
                <div>
                  <Label>Tom</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={card.tone}
                    onChange={(e) =>
                      updateService(i, {
                        tone: e.target.value as ServiceCard["tone"],
                      })
                    }
                  >
                    <option value="pink">Rosa</option>
                    <option value="orange">Laranja</option>
                    <option value="blue">Azul</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={card.description}
                  onChange={(e) => updateService(i, { description: e.target.value })}
                />
              </div>
              <div>
                <Label>Itens (um por linha)</Label>
                <Textarea
                  value={lines(card.items)}
                  onChange={(e) => updateService(i, { items: fromLines(e.target.value) })}
                />
              </div>
            </div>
          ))}
        </section>

        {/* About */}
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">About / Fundadora</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Título secção</Label>
              <Input
                value={c.about.sectionTitle}
                onChange={(e) => setContent({ ...c, about: { ...c.about, sectionTitle: e.target.value } })}
              />
            </div>
            <div>
              <Label>Accent</Label>
              <Input
                value={c.about.sectionAccent}
                onChange={(e) => setContent({ ...c, about: { ...c.about, sectionAccent: e.target.value } })}
              />
            </div>
            <div>
              <Label>Nome</Label>
              <Input
                value={c.about.founderName}
                onChange={(e) => setContent({ ...c, about: { ...c.about, founderName: e.target.value } })}
              />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input
                value={c.about.founderRole}
                onChange={(e) => setContent({ ...c, about: { ...c.about, founderRole: e.target.value } })}
              />
            </div>
          </div>
          <div>
            <Label>Subtítulo secção</Label>
            <Textarea
              value={c.about.sectionSubtitle}
              onChange={(e) => setContent({ ...c, about: { ...c.about, sectionSubtitle: e.target.value } })}
            />
          </div>
          <div>
            <Label>Bio (home)</Label>
            <Textarea
              value={c.about.founderBio}
              onChange={(e) => setContent({ ...c, about: { ...c.about, founderBio: e.target.value } })}
            />
          </div>
          <div>
            <Label>História (página Sobre)</Label>
            <Textarea
              rows={4}
              value={c.about.storyHtml}
              onChange={(e) => setContent({ ...c, about: { ...c.about, storyHtml: e.target.value } })}
            />
          </div>
          <div>
            <Label>Citação</Label>
            <Textarea
              value={c.about.quote}
              onChange={(e) => setContent({ ...c, about: { ...c.about, quote: e.target.value } })}
            />
          </div>
        </section>

        {/* Contact / inscrição */}
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Contacto e inscrição</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Título</Label>
              <Input
                value={c.contact.title}
                onChange={(e) => setContent({ ...c, contact: { ...c.contact, title: e.target.value } })}
              />
            </div>
            <div>
              <Label>Accent</Label>
              <Input
                value={c.contact.titleAccent}
                onChange={(e) => setContent({ ...c, contact: { ...c.contact, titleAccent: e.target.value } })}
              />
            </div>
            <div>
              <Label>Telefone (página)</Label>
              <Input
                value={c.contact.phone}
                onChange={(e) => setContent({ ...c, contact: { ...c.contact, phone: e.target.value } })}
              />
            </div>
            <div>
              <Label>Email principal</Label>
              <Input
                value={c.contact.emailPrimary}
                onChange={(e) => setContent({ ...c, contact: { ...c.contact, emailPrimary: e.target.value } })}
              />
            </div>
            <div>
              <Label>Email secundário</Label>
              <Input
                value={c.contact.emailSecondary}
                onChange={(e) =>
                  setContent({ ...c, contact: { ...c.contact, emailSecondary: e.target.value } })
                }
              />
            </div>
            <div>
              <Label>Label morada principal</Label>
              <Input
                value={c.contact.addressMainLabel}
                onChange={(e) =>
                  setContent({ ...c, contact: { ...c.contact, addressMainLabel: e.target.value } })
                }
              />
            </div>
            <div>
              <Label>Label morada SJV</Label>
              <Input
                value={c.contact.addressSecondaryLabel}
                onChange={(e) =>
                  setContent({ ...c, contact: { ...c.contact, addressSecondaryLabel: e.target.value } })
                }
              />
            </div>
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Textarea
              value={c.contact.subtitle}
              onChange={(e) => setContent({ ...c, contact: { ...c.contact, subtitle: e.target.value } })}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Morada principal (linhas)</Label>
              <Textarea
                value={lines(c.contact.addressMainLines)}
                onChange={(e) =>
                  setContent({
                    ...c,
                    contact: { ...c.contact, addressMainLines: fromLines(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label>Morada SJV (linhas)</Label>
              <Textarea
                value={lines(c.contact.addressSecondaryLines)}
                onChange={(e) =>
                  setContent({
                    ...c,
                    contact: { ...c.contact, addressSecondaryLines: fromLines(e.target.value) },
                  })
                }
              />
            </div>
          </div>
          <div>
            <Label>Horários (um por linha)</Label>
            <Textarea
              value={lines(c.contact.hoursLines)}
              onChange={(e) =>
                setContent({ ...c, contact: { ...c.contact, hoursLines: fromLines(e.target.value) } })
              }
            />
          </div>
          <div>
            <Label>Polos (formulário)</Label>
            <Textarea
              value={lines(c.contact.locations)}
              onChange={(e) =>
                setContent({ ...c, contact: { ...c.contact, locations: fromLines(e.target.value) } })
              }
            />
          </div>
          <div>
            <Label>Disciplinas (formulário)</Label>
            <Textarea
              value={lines(c.contact.subjects)}
              onChange={(e) =>
                setContent({ ...c, contact: { ...c.contact, subjects: fromLines(e.target.value) } })
              }
            />
          </div>
          <div>
            <Label>Anos escolares (formulário)</Label>
            <Textarea
              value={lines(c.contact.schoolYears)}
              onChange={(e) =>
                setContent({ ...c, contact: { ...c.contact, schoolYears: fromLines(e.target.value) } })
              }
            />
          </div>
        </section>

        {/* Partner */}
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Parceria</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Badge</Label>
              <Input
                value={c.partner.badge}
                onChange={(e) => setContent({ ...c, partner: { ...c.partner, badge: e.target.value } })}
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={c.partner.website ?? ""}
                onChange={(e) => setContent({ ...c, partner: { ...c.partner, website: e.target.value } })}
              />
            </div>
            <div>
              <Label>Título</Label>
              <Input
                value={c.partner.title}
                onChange={(e) => setContent({ ...c, partner: { ...c.partner, title: e.target.value } })}
              />
            </div>
            <div>
              <Label>Accent</Label>
              <Input
                value={c.partner.titleAccent}
                onChange={(e) =>
                  setContent({ ...c, partner: { ...c.partner, titleAccent: e.target.value } })
                }
              />
            </div>
            <div>
              <Label>Nome</Label>
              <Input
                value={c.partner.name}
                onChange={(e) => setContent({ ...c, partner: { ...c.partner, name: e.target.value } })}
              />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input
                value={c.partner.tagline}
                onChange={(e) => setContent({ ...c, partner: { ...c.partner, tagline: e.target.value } })}
              />
            </div>
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Textarea
              value={c.partner.subtitle}
              onChange={(e) => setContent({ ...c, partner: { ...c.partner, subtitle: e.target.value } })}
            />
          </div>
          <div>
            <Label>Texto</Label>
            <Textarea
              value={c.partner.body}
              onChange={(e) => setContent({ ...c, partner: { ...c.partner, body: e.target.value } })}
            />
          </div>
          <div>
            <Label>Serviços (um por linha)</Label>
            <Textarea
              value={lines(c.partner.services)}
              onChange={(e) =>
                setContent({
                  ...c,
                  partner: { ...c.partner, services: fromLines(e.target.value) },
                })
              }
            />
          </div>
        </section>

        {/* FAQ + testemunhos */}
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">FAQ e testemunhos</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Título FAQ</Label>
              <Input
                value={c.social.faqTitle}
                onChange={(e) => setContent({ ...c, social: { ...c.social, faqTitle: e.target.value } })}
              />
            </div>
            <div>
              <Label>Título testemunhos</Label>
              <Input
                value={c.social.testimonialsTitle}
                onChange={(e) =>
                  setContent({ ...c, social: { ...c.social, testimonialsTitle: e.target.value } })
                }
              />
            </div>
          </div>
          <div>
            <Label>FAQ (pergunta || resposta)</Label>
            <Textarea
              rows={6}
              value={c.social.faq.map((f) => `${f.question} || ${f.answer}`).join("\n")}
              onChange={(e) =>
                setContent({
                  ...c,
                  social: {
                    ...c.social,
                    faq: fromLines(e.target.value).map((line) => {
                      const [question, ...rest] = line.split("||");
                      return { question: (question ?? "").trim(), answer: rest.join("||").trim() };
                    }),
                  },
                })
              }
            />
          </div>
          <div>
            <Label>Testemunhos (citação || autor || papel)</Label>
            <Textarea
              rows={5}
              value={c.social.testimonials
                .map((t) => `${t.quote} || ${t.author} || ${t.role}`)
                .join("\n")}
              onChange={(e) =>
                setContent({
                  ...c,
                  social: {
                    ...c.social,
                    testimonials: fromLines(e.target.value).map((line) => {
                      const parts = line.split("||").map((p) => p.trim());
                      return { quote: parts[0] ?? "", author: parts[1] ?? "", role: parts[2] ?? "" };
                    }),
                  },
                })
              }
            />
          </div>
        </section>

        {/* Footer */}
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Footer</h2>
          <div>
            <Label>Tagline</Label>
            <Textarea
              value={c.footer.tagline}
              onChange={(e) => setContent({ ...c, footer: { ...c.footer, tagline: e.target.value } })}
            />
          </div>
          <div>
            <Label>Links rápidos (label | href)</Label>
            <Textarea
              value={c.footer.quickLinks.map((l) => `${l.label} | ${l.href}`).join("\n")}
              onChange={(e) =>
                setContent({
                  ...c,
                  footer: {
                    ...c.footer,
                    quickLinks: fromLines(e.target.value).map((line) => {
                      const [label, href] = line.split("|").map((s) => s.trim());
                      return { label: label || "", href: href || "/" };
                    }),
                  },
                })
              }
            />
          </div>
        </section>

        <Button onClick={save} disabled={saving}>
          {saving ? "A guardar…" : "Guardar alterações"}
        </Button>
      </div>

      {showPreview && (
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 via-white to-orange-50 p-4 shadow-lg ring-1 ring-pink-100">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-pink-600">Preview</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-pink-600">
              {settings.brandingName}
            </p>
            <h2 className="mt-2 text-xl font-bold leading-tight text-slate-900">
              {c.hero.titleBefore} <span className="text-pink-600">{c.hero.titlePink}</span>{" "}
              {c.hero.titleMid} <span className="text-orange-600">{c.hero.titleOrange}</span>
            </h2>
            <p className="mt-2 line-clamp-3 text-sm text-slate-600">{c.hero.subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-pink-600 px-3 py-1 text-xs font-semibold text-white">
                {c.hero.ctaPrimary}
              </span>
              <span className="rounded-full border border-pink-300 px-3 py-1 text-xs font-semibold text-pink-700">
                {c.hero.ctaSecondary}
              </span>
            </div>
            <ul className="mt-4 space-y-1 border-t border-pink-100 pt-3 text-xs text-slate-500">
              <li>
                <strong>Serviços:</strong> {c.services.cards.map((x) => x.title).join(", ")}
              </li>
              <li>
                <strong>Polos:</strong> {c.contact.locations.join(", ")}
              </li>
              <li>
                <strong>FAQ:</strong> {c.social.faq.length} · <strong>Testemunhos:</strong>{" "}
                {c.social.testimonials.length}
              </li>
            </ul>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-center text-xs font-bold text-pink-600 hover:underline"
            >
              Abrir site ↗
            </a>
          </div>
        </aside>
      )}
    </div>
  );
}
