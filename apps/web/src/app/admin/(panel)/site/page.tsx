"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/lib/admin-api";
import { KrajeeFileInput } from "@/components/admin/krajee-file-input";
import { mergeSiteContent, type SiteContent, type ServiceCard } from "@/lib/site-content";
import { mediaUrl } from "@/lib/utils";

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
      // ValidationPipe rejecta campos do Prisma (id/createdAt/updatedAt)
      const { id: _id, createdAt: _c, updatedAt: _u, ...payload } = settings as Settings & {
        id?: string;
        createdAt?: string;
        updatedAt?: string;
      };
      void _id;
      void _c;
      void _u;
      const updated = await adminFetch<Settings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSettings({
        ...updated,
        content: mergeSiteContent(updated.content),
      });
      setMsg("Guardado com sucesso");
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Erro ao guardar";
      setMsg(raw.includes("statusCode") ? "Não foi possível guardar. Verifique os campos e tente de novo." : raw);
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

        {/* Imagens principais */}
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div>
            <h2 className="text-lg font-semibold">Imagens principais</h2>
            <p className="text-sm text-slate-500">
              Logótipo do topo na home e fotografia da fundadora. Pré-visualiza e guarda com o resto do conteúdo.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
              <p className="text-xs font-bold uppercase tracking-wide text-pink-600">Topo da home</p>
              <KrajeeFileInput
                label="Imagem do topo"
                folder="site"
                size="large"
                value={c.hero.logoPath}
                hint="Aparece no quadro à direita do título. Se removeres, volta a /logo.webp."
                onChange={(key) =>
                  setContent({
                    ...c,
                    hero: { ...c.hero, logoPath: key || "/logo.webp" },
                  })
                }
              />
            </div>
            <div className="space-y-2 rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
              <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Fundadora</p>
              <KrajeeFileInput
                label="Fotografia da fundadora"
                folder="site"
                size="large"
                value={c.about.founderImagePath}
                hint="Usada na home e em Sobre. Se removeres, volta a /Vera.webp."
                onChange={(key) =>
                  setContent({
                    ...c,
                    about: { ...c.about, founderImagePath: key || "/Vera.webp" },
                  })
                }
              />
            </div>
          </div>
        </section>

        {/* Topo da home */}
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div>
            <h2 className="text-lg font-semibold">Topo da página inicial</h2>
            <p className="text-sm text-slate-500">
              Textos do destaque — a imagem configura-se acima, em Imagens principais.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Início do título</Label>
              <Input
                value={c.hero.titleBefore}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titleBefore: e.target.value } })}
              />
            </div>
            <div>
              <Label>Palavra em destaque (rosa)</Label>
              <Input
                value={c.hero.titlePink}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titlePink: e.target.value } })}
              />
            </div>
            <div>
              <Label>Palavra do meio (ex.: &quot;e&quot;)</Label>
              <Input
                value={c.hero.titleMid}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titleMid: e.target.value } })}
              />
            </div>
            <div>
              <Label>Palavra em destaque (laranja)</Label>
              <Input
                value={c.hero.titleOrange}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titleOrange: e.target.value } })}
              />
            </div>
            <div>
              <Label>Botão principal</Label>
              <Input
                value={c.hero.ctaPrimary}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, ctaPrimary: e.target.value } })}
              />
            </div>
            <div>
              <Label>Botão secundário</Label>
              <Input
                value={c.hero.ctaSecondary}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, ctaSecondary: e.target.value } })}
              />
            </div>
            <div>
              <Label>Número do destaque (ex.: +500)</Label>
              <Input
                value={c.hero.badgeValue}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, badgeValue: e.target.value } })}
              />
            </div>
            <div>
              <Label>Texto do destaque (ex.: Crianças apoiadas)</Label>
              <Input
                value={c.hero.badgeLabel}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, badgeLabel: e.target.value } })}
              />
            </div>
          </div>
          <div>
            <Label>Texto de apoio</Label>
            <Textarea
              value={c.hero.subtitle}
              onChange={(e) => setContent({ ...c, hero: { ...c.hero, subtitle: e.target.value } })}
            />
          </div>
          <div className="space-y-3">
            <Label>Cartões de destaque no topo</Label>
            {c.hero.features.map((f, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 md:grid-cols-3">
                <Input
                  value={f.title}
                  placeholder="Título"
                  onChange={(e) => {
                    const features = c.hero.features.map((x, idx) =>
                      idx === i ? { ...x, title: e.target.value } : x,
                    );
                    setContent({ ...c, hero: { ...c.hero, features } });
                  }}
                />
                <Input
                  value={f.description}
                  placeholder="Descrição"
                  onChange={(e) => {
                    const features = c.hero.features.map((x, idx) =>
                      idx === i ? { ...x, description: e.target.value } : x,
                    );
                    setContent({ ...c, hero: { ...c.hero, features } });
                  }}
                />
                <select
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={f.tone}
                  onChange={(e) => {
                    const tone = e.target.value as "pink" | "orange" | "blue";
                    const features = c.hero.features.map((x, idx) =>
                      idx === i ? { ...x, tone } : x,
                    );
                    setContent({ ...c, hero: { ...c.hero, features } });
                  }}
                >
                  <option value="pink">Rosa</option>
                  <option value="orange">Laranja</option>
                  <option value="blue">Azul</option>
                </select>
              </div>
            ))}
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
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div>
            <h2 className="text-lg font-semibold">About / Fundadora</h2>
            <p className="text-sm text-slate-500">
              Textos da fundadora — a fotografia configura-se acima, em Imagens principais.
            </p>
          </div>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Perguntas frequentes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setContent({
                    ...c,
                    social: {
                      ...c.social,
                      faq: [...c.social.faq, { question: "", answer: "" }],
                    },
                  })
                }
              >
                + Pergunta
              </Button>
            </div>
            {c.social.faq.map((f, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-slate-400">Pergunta {i + 1}</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-600 hover:underline"
                    onClick={() =>
                      setContent({
                        ...c,
                        social: {
                          ...c.social,
                          faq: c.social.faq.filter((_, idx) => idx !== i),
                        },
                      })
                    }
                  >
                    Remover
                  </button>
                </div>
                <Input
                  value={f.question}
                  placeholder="Pergunta"
                  onChange={(e) => {
                    const faq = c.social.faq.map((x, idx) =>
                      idx === i ? { ...x, question: e.target.value } : x,
                    );
                    setContent({ ...c, social: { ...c.social, faq } });
                  }}
                />
                <Textarea
                  value={f.answer}
                  placeholder="Resposta"
                  rows={2}
                  onChange={(e) => {
                    const faq = c.social.faq.map((x, idx) =>
                      idx === i ? { ...x, answer: e.target.value } : x,
                    );
                    setContent({ ...c, social: { ...c.social, faq } });
                  }}
                />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Testemunhos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setContent({
                    ...c,
                    social: {
                      ...c.social,
                      testimonials: [...c.social.testimonials, { quote: "", author: "", role: "" }],
                    },
                  })
                }
              >
                + Testemunho
              </Button>
            </div>
            {c.social.testimonials.map((t, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-slate-400">Testemunho {i + 1}</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-600 hover:underline"
                    onClick={() =>
                      setContent({
                        ...c,
                        social: {
                          ...c.social,
                          testimonials: c.social.testimonials.filter((_, idx) => idx !== i),
                        },
                      })
                    }
                  >
                    Remover
                  </button>
                </div>
                <Textarea
                  value={t.quote}
                  placeholder="Citação"
                  rows={2}
                  onChange={(e) => {
                    const testimonials = c.social.testimonials.map((x, idx) =>
                      idx === i ? { ...x, quote: e.target.value } : x,
                    );
                    setContent({ ...c, social: { ...c.social, testimonials } });
                  }}
                />
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    value={t.author}
                    placeholder="Nome"
                    onChange={(e) => {
                      const testimonials = c.social.testimonials.map((x, idx) =>
                        idx === i ? { ...x, author: e.target.value } : x,
                      );
                      setContent({ ...c, social: { ...c.social, testimonials } });
                    }}
                  />
                  <Input
                    value={t.role}
                    placeholder="Papel (ex.: no Google)"
                    onChange={(e) => {
                      const testimonials = c.social.testimonials.map((x, idx) =>
                        idx === i ? { ...x, role: e.target.value } : x,
                      );
                      setContent({ ...c, social: { ...c.social, testimonials } });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rodapé */}
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Rodapé do site</h2>
          <div>
            <Label>Frase do rodapé</Label>
            <Textarea
              value={c.footer.tagline}
              onChange={(e) => setContent({ ...c, footer: { ...c.footer, tagline: e.target.value } })}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Ligações rápidas</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setContent({
                    ...c,
                    footer: {
                      ...c.footer,
                      quickLinks: [...c.footer.quickLinks, { label: "", href: "/" }],
                    },
                  })
                }
              >
                + Ligação
              </Button>
            </div>
            {c.footer.quickLinks.map((l, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  value={l.label}
                  placeholder="Texto (ex.: Sobre)"
                  onChange={(e) => {
                    const quickLinks = c.footer.quickLinks.map((x, idx) =>
                      idx === i ? { ...x, label: e.target.value } : x,
                    );
                    setContent({ ...c, footer: { ...c.footer, quickLinks } });
                  }}
                />
                <Input
                  value={l.href}
                  placeholder="Caminho (ex.: /about)"
                  onChange={(e) => {
                    const quickLinks = c.footer.quickLinks.map((x, idx) =>
                      idx === i ? { ...x, href: e.target.value } : x,
                    );
                    setContent({ ...c, footer: { ...c.footer, quickLinks } });
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setContent({
                      ...c,
                      footer: {
                        ...c.footer,
                        quickLinks: c.footer.quickLinks.filter((_, idx) => idx !== i),
                      },
                    })
                  }
                >
                  Remover
                </Button>
              </div>
            ))}
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
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-pink-100 pt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(c.hero.logoPath) || "/logo.webp"}
                alt="Topo"
                className="h-16 w-full rounded-xl bg-white object-contain p-1 ring-1 ring-pink-100"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(c.about.founderImagePath) || "/Vera.webp"}
                alt="Fundadora"
                className="h-16 w-full rounded-xl bg-white object-cover ring-1 ring-pink-100"
              />
            </div>
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
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
