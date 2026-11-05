"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/admin-api";
import { MediaFileInput } from "@/components/admin/media-file-input";
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

const TABS = [
  { id: "inicio", label: "Página inicial", help: "O que as famílias veem primeiro: imagem, título e os três cartões.", href: "/" },
  { id: "servicos", label: "Serviços", help: "Os serviços apresentados na página inicial.", href: "/#services" },
  { id: "sobre", label: "Sobre nós", help: "A fundadora, a formação e a história da Corujinha.", href: "/about" },
  { id: "contactos", label: "Contactos", help: "Telefone, moradas, horário e opções do formulário de inscrição.", href: "/#contact" },
  { id: "perguntas", label: "Perguntas e opiniões", help: "As perguntas frequentes e o que dizem as famílias.", href: "/#faq" },
  { id: "mais", label: "Mais opções", help: "Parceria e rodapé. Raramente é preciso mudar.", href: "/#novidades" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Keeps the raw text while typing: parsing it back on each key would eat spaces and new lines. */
function LinesField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string[];
  onChange: (parsed: string[]) => void;
}) {
  const [text, setText] = useState(() => lines(value));
  return (
    <Textarea
      id={id}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(fromLines(e.target.value));
      }}
    />
  );
}

type Tone = "pink" | "orange" | "blue";

function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

function ToneSelect({ id, value, onChange }: { id: string; value: Tone; onChange: (tone: Tone) => void }) {
  return (
    <div>
      <Label htmlFor={id}>Cor</Label>
      <select
        id={id}
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value as Tone)}
      >
        <option value="pink">Rosa</option>
        <option value="orange">Laranja</option>
        <option value="blue">Roxo</option>
      </select>
    </div>
  );
}

function ItemControls({
  label,
  index,
  count,
  onMove,
  onRemove,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const arrow =
    "flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 sm:h-8 sm:w-8";
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-bold uppercase text-slate-600">{label}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={arrow}
          disabled={index === 0}
          aria-label={`Subir ${label}`}
          onClick={() => onMove(index - 1)}
        >
          ↑
        </button>
        <button
          type="button"
          className={arrow}
          disabled={index === count - 1}
          aria-label={`Descer ${label}`}
          onClick={() => onMove(index + 1)}
        >
          ↓
        </button>
        <button
          type="button"
          className="ml-1 min-h-11 px-2 text-xs font-semibold text-rose-700 hover:underline sm:min-h-0"
          aria-label={`Remover ${label}`}
          onClick={onRemove}
        >
          Remover
        </button>
      </div>
    </div>
  );
}

export default function AdminSiteContentPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabId>("inicio");
  const [savedSnapshot, setSavedSnapshot] = useState("");

  useEffect(() => {
    apiFetch<Settings>("/api/admin/settings")
      .then((data) => {
        const loaded = { ...data, content: mergeSiteContent(data.content) };
        setSettings(loaded);
        setSavedSnapshot(JSON.stringify(loaded));
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Erro ao carregar"));
  }, []);

  const dirty = useMemo(
    () => settings !== null && JSON.stringify(settings) !== savedSnapshot,
    [settings, savedSnapshot],
  );

  // Avisa antes de sair com alterações por guardar (fechar o separador ou clicar num link).
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank") return;
      if (!window.confirm("Tens alterações por guardar. Sair sem guardar?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  if (!settings) {
    return msg ? (
      <div className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700 ring-1 ring-rose-100" role="alert">
        <p className="font-semibold">Não foi possível carregar o conteúdo do site</p>
        <p className="mt-1">{msg}</p>
        <Button type="button" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
          Tentar de novo
        </Button>
      </div>
    ) : (
      <p className="text-slate-600">A carregar…</p>
    );
  }

  const c = settings.content;
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];

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
      // ValidationPipe rejecta campos da entity (id/createdAt/updatedAt)
      const { id: _id, createdAt: _c, updatedAt: _u, ...payload } = settings as Settings & {
        id?: string;
        createdAt?: string;
        updatedAt?: string;
      };
      void _id;
      void _c;
      void _u;
      const updated = await apiFetch<Settings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const fresh = { ...updated, content: mergeSiteContent(updated.content) };
      setSettings(fresh);
      setSavedSnapshot(JSON.stringify(fresh));
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Erro ao guardar";
      setMsg(raw.includes("statusCode") ? "Não foi possível guardar. Verifique os campos e tente de novo." : raw);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="min-w-0 space-y-5">
        <nav aria-label="Secções do site" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? "true" : undefined}
              onClick={() => setTab(t.id)}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition sm:min-h-0 ${
                tab === t.id
                  ? "bg-pink text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-pink-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-sm text-slate-600">{activeTab.help}</p>
          <a
            href={activeTab.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-pink-700 hover:underline sm:min-h-0"
          >
            Ver no site ↗
          </a>
        </div>

        {/* Marca */}
        {tab === "contactos" && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Dados gerais</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="branding-name">Nome do centro</Label>
              <Input
                id="branding-name"
                value={settings.brandingName}
                onChange={(e) => setSettings({ ...settings, brandingName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Telefone</Label>
              <Input
                id="contact-phone"
                value={settings.contactPhone ?? ""}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email mostrado no rodapé</Label>
              <Input
                id="contact-email"
                value={settings.contactEmail ?? ""}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
          </div>
        </section>
        )}

        {/* Imagem do topo */}
        {tab === "inicio" && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-semibold">Imagem</h2>
              <MediaFileInput
                label="Imagem do topo"
                folder="branding"
                size="large"
                value={c.hero.logoPath}
                hint="Aparece ao lado do título. Uma fotografia real das crianças ou das salas funciona melhor. Se a removeres, volta o logótipo."
                onChange={(key) =>
                  setContent({
                    ...c,
                    hero: { ...c.hero, logoPath: key || "/logo.webp" },
                  })
                }
              />
        </section>
        )}

        {/* Fotografia da fundadora */}
        {tab === "sobre" && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-semibold">Fotografia da fundadora</h2>
              <MediaFileInput
                label="Fotografia da fundadora"
                folder="branding"
                size="large"
                value={c.about.founderImagePath}
                hint="Aparece na página inicial e em Sobre. Se a removeres, volta a fotografia original."
                onChange={(key) =>
                  setContent({
                    ...c,
                    about: { ...c.about, founderImagePath: key || "/Vera.webp" },
                  })
                }
              />
        </section>
        )}

        {/* Topo da home */}
        {tab === "inicio" && (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Textos</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="hero-title-before">Título: primeira parte (a preto)</Label>
              <Input
                id="hero-title-before"
                value={c.hero.titleBefore}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titleBefore: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="hero-title-pink">Título: primeira palavra colorida</Label>
              <Input
                id="hero-title-pink"
                value={c.hero.titlePink}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titlePink: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="hero-title-mid">Título: palavra de ligação (ex.: &quot;e&quot;)</Label>
              <Input
                id="hero-title-mid"
                value={c.hero.titleMid}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titleMid: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="hero-title-orange">Título: segunda palavra colorida</Label>
              <Input
                id="hero-title-orange"
                value={c.hero.titleOrange}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, titleOrange: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="hero-cta-primary">Texto do botão principal</Label>
              <Input
                id="hero-cta-primary"
                value={c.hero.ctaPrimary}
                onChange={(e) => setContent({ ...c, hero: { ...c.hero, ctaPrimary: e.target.value } })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="hero-subtitle">Texto por baixo do título</Label>
            <Textarea
              id="hero-subtitle"
              value={c.hero.subtitle}
              onChange={(e) => setContent({ ...c, hero: { ...c.hero, subtitle: e.target.value } })}
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Os três cartões por baixo do título</p>
            {c.hero.features.map((f, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 md:grid-cols-3">
                <div>
                  <Label htmlFor={`hero-feature-${i}-title`}>Título</Label>
                  <Input
                    id={`hero-feature-${i}-title`}
                    value={f.title}
                    placeholder="Título"
                    onChange={(e) => {
                      const features = c.hero.features.map((x, idx) =>
                        idx === i ? { ...x, title: e.target.value } : x,
                      );
                      setContent({ ...c, hero: { ...c.hero, features } });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`hero-feature-${i}-description`}>Descrição</Label>
                  <Input
                    id={`hero-feature-${i}-description`}
                    value={f.description}
                    placeholder="Descrição"
                    onChange={(e) => {
                      const features = c.hero.features.map((x, idx) =>
                        idx === i ? { ...x, description: e.target.value } : x,
                      );
                      setContent({ ...c, hero: { ...c.hero, features } });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`hero-feature-${i}-tone`}>Cor</Label>
                  <select
                    id={`hero-feature-${i}-tone`}
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
                    <option value="blue">Roxo</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Serviços */}
        {tab === "servicos" && (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Serviços</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="services-title">Título da secção</Label>
              <Input
                id="services-title"
                value={c.services.title}
                onChange={(e) => setContent({ ...c, services: { ...c.services, title: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="services-title-accent">Palavra colorida do título</Label>
              <Input
                id="services-title-accent"
                value={c.services.titleAccent}
                onChange={(e) =>
                  setContent({ ...c, services: { ...c.services, titleAccent: e.target.value } })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="services-subtitle">Frase por baixo do título</Label>
            <Textarea
              id="services-subtitle"
              value={c.services.subtitle}
              onChange={(e) => setContent({ ...c, services: { ...c.services, subtitle: e.target.value } })}
            />
          </div>
          {c.services.cards.map((card, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-xs font-bold uppercase text-slate-600">Cartão {i + 1}</p>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <Label htmlFor={`service-${i}-title`}>Título</Label>
                  <Input
                    id={`service-${i}-title`}
                    value={card.title}
                    onChange={(e) => updateService(i, { title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`service-${i}-tone`}>Cor</Label>
                  <select
                    id={`service-${i}-tone`}
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
                    <option value="blue">Roxo</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor={`service-${i}-description`}>Descrição</Label>
                <Textarea
                  id={`service-${i}-description`}
                  value={card.description}
                  onChange={(e) => updateService(i, { description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`service-${i}-items`}>Pontos da lista (um por linha; o site mostra os 3 primeiros)</Label>
                <LinesField
                id={`service-${i}-items`}
                value={card.items}
                onChange={(parsed) =>
                  updateService(i, { items: parsed })
                }
              />
              </div>
            </div>
          ))}
        </section>
        )}

        {/* Sobre / Fundadora */}
        {tab === "sobre" && (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Textos</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="about-section-title">Título da secção</Label>
              <Input
                id="about-section-title"
                value={c.about.sectionTitle}
                onChange={(e) => setContent({ ...c, about: { ...c.about, sectionTitle: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="about-section-accent">Palavra colorida do título</Label>
              <Input
                id="about-section-accent"
                value={c.about.sectionAccent}
                onChange={(e) => setContent({ ...c, about: { ...c.about, sectionAccent: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="about-founder-name">Nome da fundadora</Label>
              <Input
                id="about-founder-name"
                value={c.about.founderName}
                onChange={(e) => setContent({ ...c, about: { ...c.about, founderName: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="about-founder-role">Função</Label>
              <Input
                id="about-founder-role"
                value={c.about.founderRole}
                onChange={(e) => setContent({ ...c, about: { ...c.about, founderRole: e.target.value } })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="about-section-subtitle">Frase por baixo do título (página Sobre)</Label>
            <Textarea
              id="about-section-subtitle"
              value={c.about.sectionSubtitle}
              onChange={(e) => setContent({ ...c, about: { ...c.about, sectionSubtitle: e.target.value } })}
            />
          </div>
          <div>
            <Label htmlFor="about-founder-bio">Apresentação da fundadora</Label>
            <Textarea
              id="about-founder-bio"
              value={c.about.founderBio}
              onChange={(e) => setContent({ ...c, about: { ...c.about, founderBio: e.target.value } })}
            />
          </div>
          <div>
            <Label htmlFor="about-story">A história da Corujinha (página Sobre)</Label>
            <Textarea
              id="about-story"
              rows={4}
              value={c.about.storyHtml}
              onChange={(e) => setContent({ ...c, about: { ...c.about, storyHtml: e.target.value } })}
            />
          </div>
          <div>
            <Label htmlFor="about-quote">Frase em destaque</Label>
            <Textarea
              id="about-quote"
              value={c.about.quote}
              onChange={(e) => setContent({ ...c, about: { ...c.about, quote: e.target.value } })}
            />
          </div>
        </section>
        )}

        {/* Formação e experiência */}
        {tab === "sobre" && (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Formação e experiência</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="about-experience-title">Título da secção</Label>
              <Input
                id="about-experience-title"
                value={c.about.experienceTitle}
                onChange={(e) => setContent({ ...c, about: { ...c.about, experienceTitle: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="about-experience-subtitle">Frase por baixo do título</Label>
              <Input
                id="about-experience-subtitle"
                value={c.about.experienceSubtitle}
                onChange={(e) => setContent({ ...c, about: { ...c.about, experienceSubtitle: e.target.value } })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Cartões</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent({
                  ...c,
                  about: {
                    ...c.about,
                    experienceCards: [...c.about.experienceCards, { title: "", body: "", tone: "pink" }],
                  },
                })
              }
            >
              + Cartão
            </Button>
          </div>
          {c.about.experienceCards.map((card, i) => {
            const setCards = (experienceCards: typeof c.about.experienceCards) =>
              setContent({ ...c, about: { ...c.about, experienceCards } });
            const patch = (change: Partial<(typeof c.about.experienceCards)[number]>) =>
              setCards(c.about.experienceCards.map((x, idx) => (idx === i ? { ...x, ...change } : x)));
            return (
              <div key={i} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <ItemControls
                  label={`Cartão ${i + 1}`}
                  index={i}
                  count={c.about.experienceCards.length}
                  onMove={(to) => setCards(moveItem(c.about.experienceCards, i, to))}
                  onRemove={() => setCards(c.about.experienceCards.filter((_, idx) => idx !== i))}
                />
                <div className="grid gap-2 md:grid-cols-[1fr_180px]">
                  <div>
                    <Label htmlFor={`experience-${i}-title`}>Título</Label>
                    <Input
                      id={`experience-${i}-title`}
                      value={card.title}
                      onChange={(e) => patch({ title: e.target.value })}
                    />
                  </div>
                  <ToneSelect id={`experience-${i}-tone`} value={card.tone} onChange={(tone) => patch({ tone })} />
                </div>
                <div>
                  <Label htmlFor={`experience-${i}-body`}>Texto</Label>
                  <Textarea
                    id={`experience-${i}-body`}
                    value={card.body}
                    onChange={(e) => patch({ body: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </section>
        )}

        {/* A nossa história */}
        {tab === "sobre" && (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">A nossa história</h2>
              <p className="text-sm text-slate-600">Os momentos aparecem por esta ordem na página Sobre.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setContent({
                  ...c,
                  about: {
                    ...c.about,
                    timeline: [...c.about.timeline, { title: "", description: "", tone: "pink" }],
                  },
                })
              }
            >
              + Momento
            </Button>
          </div>
          {c.about.timeline.map((item, i) => {
            const setTimeline = (timeline: typeof c.about.timeline) =>
              setContent({ ...c, about: { ...c.about, timeline } });
            const patch = (change: Partial<(typeof c.about.timeline)[number]>) =>
              setTimeline(c.about.timeline.map((x, idx) => (idx === i ? { ...x, ...change } : x)));
            return (
              <div key={i} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <ItemControls
                  label={`Momento ${i + 1}`}
                  index={i}
                  count={c.about.timeline.length}
                  onMove={(to) => setTimeline(moveItem(c.about.timeline, i, to))}
                  onRemove={() => setTimeline(c.about.timeline.filter((_, idx) => idx !== i))}
                />
                <div className="grid gap-2 md:grid-cols-[1fr_180px]">
                  <div>
                    <Label htmlFor={`timeline-${i}-title`}>Título</Label>
                    <Input
                      id={`timeline-${i}-title`}
                      value={item.title}
                      onChange={(e) => patch({ title: e.target.value })}
                    />
                  </div>
                  <ToneSelect id={`timeline-${i}-tone`} value={item.tone} onChange={(tone) => patch({ tone })} />
                </div>
                <div>
                  <Label htmlFor={`timeline-${i}-description`}>Texto</Label>
                  <Textarea
                    id={`timeline-${i}-description`}
                    rows={2}
                    value={item.description}
                    onChange={(e) => patch({ description: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </section>
        )}

        {/* Contacto / inscrição */}
        {tab === "contactos" && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Secção de contacto</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="contact-title">Título da secção</Label>
              <Input
                id="contact-title"
                value={c.contact.title}
                onChange={(e) => setContent({ ...c, contact: { ...c.contact, title: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="contact-title-accent">Palavra colorida do título</Label>
              <Input
                id="contact-title-accent"
                value={c.contact.titleAccent}
                onChange={(e) => setContent({ ...c, contact: { ...c.contact, titleAccent: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="contact-email-primary">Primeiro email</Label>
              <Input
                id="contact-email-primary"
                value={c.contact.emailPrimary}
                onChange={(e) => setContent({ ...c, contact: { ...c.contact, emailPrimary: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="contact-email-secondary">Segundo email</Label>
              <Input
                id="contact-email-secondary"
                value={c.contact.emailSecondary}
                onChange={(e) =>
                  setContent({ ...c, contact: { ...c.contact, emailSecondary: e.target.value } })
                }
              />
            </div>
            <div>
              <Label htmlFor="contact-address-main-label">Nome do primeiro centro</Label>
              <Input
                id="contact-address-main-label"
                value={c.contact.addressMainLabel}
                onChange={(e) =>
                  setContent({ ...c, contact: { ...c.contact, addressMainLabel: e.target.value } })
                }
              />
            </div>
            <div>
              <Label htmlFor="contact-address-secondary-label">Nome do segundo centro</Label>
              <Input
                id="contact-address-secondary-label"
                value={c.contact.addressSecondaryLabel}
                onChange={(e) =>
                  setContent({ ...c, contact: { ...c.contact, addressSecondaryLabel: e.target.value } })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contact-subtitle">Frase por baixo do título</Label>
            <Textarea
              id="contact-subtitle"
              value={c.contact.subtitle}
              onChange={(e) => setContent({ ...c, contact: { ...c.contact, subtitle: e.target.value } })}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="contact-address-main-lines">Morada do primeiro centro (uma linha de cada vez)</Label>
              <LinesField
                id="contact-address-main-lines"
                value={c.contact.addressMainLines}
                onChange={(parsed) =>
                  setContent({
                    ...c,
                    contact: { ...c.contact, addressMainLines: parsed },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="contact-address-secondary-lines">Morada do segundo centro (uma linha de cada vez)</Label>
              <LinesField
                id="contact-address-secondary-lines"
                value={c.contact.addressSecondaryLines}
                onChange={(parsed) =>
                  setContent({
                    ...c,
                    contact: { ...c.contact, addressSecondaryLines: parsed },
                  })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contact-hours">Horário (uma linha de cada vez)</Label>
            <LinesField
                id="contact-hours"
                value={c.contact.hoursLines}
                onChange={(parsed) =>
                  setContent({ ...c, contact: { ...c.contact, hoursLines: parsed } })
                }
              />
          </div>
          <div>
            <Label htmlFor="contact-subjects">Disciplinas a escolher no formulário (uma por linha)</Label>
            <LinesField
                id="contact-subjects"
                value={c.contact.subjects}
                onChange={(parsed) =>
                  setContent({ ...c, contact: { ...c.contact, subjects: parsed } })
                }
              />
          </div>
          <div>
            <Label htmlFor="contact-school-years">Anos a escolher no formulário (um por linha)</Label>
            <LinesField
                id="contact-school-years"
                value={c.contact.schoolYears}
                onChange={(parsed) =>
                  setContent({ ...c, contact: { ...c.contact, schoolYears: parsed } })
                }
              />
          </div>
        </section>
        )}

        {/* Parceria */}
        {tab === "mais" && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Parceria</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="partner-website">Site do parceiro</Label>
              <Input
                id="partner-website"
                value={c.partner.website ?? ""}
                onChange={(e) => setContent({ ...c, partner: { ...c.partner, website: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="partner-name">Nome do parceiro</Label>
              <Input
                id="partner-name"
                value={c.partner.name}
                onChange={(e) => setContent({ ...c, partner: { ...c.partner, name: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="partner-tagline">Frase curta</Label>
              <Input
                id="partner-tagline"
                value={c.partner.tagline}
                onChange={(e) => setContent({ ...c, partner: { ...c.partner, tagline: e.target.value } })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="partner-body">Texto sobre a parceria</Label>
            <Textarea
              id="partner-body"
              value={c.partner.body}
              onChange={(e) => setContent({ ...c, partner: { ...c.partner, body: e.target.value } })}
            />
          </div>
          <div>
            <Label htmlFor="partner-services">O que o parceiro oferece (um por linha)</Label>
            <LinesField
                id="partner-services"
                value={c.partner.services}
                onChange={(parsed) =>
                  setContent({
                  ...c,
                  partner: { ...c.partner, services: parsed },
                })
                }
              />
          </div>
        </section>
        )}

        {/* FAQ + testemunhos */}
        {tab === "perguntas" && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Perguntas e opiniões</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="social-faq-title">Título das perguntas</Label>
              <Input
                id="social-faq-title"
                value={c.social.faqTitle}
                onChange={(e) => setContent({ ...c, social: { ...c.social, faqTitle: e.target.value } })}
              />
            </div>
            <div>
              <Label htmlFor="social-testimonials-title">Título das opiniões</Label>
              <Input
                id="social-testimonials-title"
                value={c.social.testimonialsTitle}
                onChange={(e) =>
                  setContent({ ...c, social: { ...c.social, testimonialsTitle: e.target.value } })
                }
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Perguntas frequentes</p>
                <p className="text-xs text-slate-600">A página inicial mostra as 5 primeiras.</p>
              </div>
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
                  <p className="text-xs font-bold uppercase text-slate-600">Pergunta {i + 1}</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-700 hover:underline"
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
                <div>
                  <Label htmlFor={`faq-${i}-question`}>Pergunta</Label>
                  <Input
                    id={`faq-${i}-question`}
                    value={f.question}
                    placeholder="Pergunta"
                    onChange={(e) => {
                      const faq = c.social.faq.map((x, idx) =>
                        idx === i ? { ...x, question: e.target.value } : x,
                      );
                      setContent({ ...c, social: { ...c.social, faq } });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`faq-${i}-answer`}>Resposta</Label>
                  <Textarea
                    id={`faq-${i}-answer`}
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
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Opiniões das famílias</p>
                <p className="text-xs text-slate-600">A página inicial mostra as 3 primeiras.</p>
              </div>
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
                + Opinião
              </Button>
            </div>
            {c.social.testimonials.map((t, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-slate-600">Opinião {i + 1}</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-700 hover:underline"
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
                <div>
                  <Label htmlFor={`testimonial-${i}-quote`}>Opinião</Label>
                  <Textarea
                    id={`testimonial-${i}-quote`}
                    value={t.quote}
                    placeholder="O que a família disse"
                    rows={2}
                    onChange={(e) => {
                      const testimonials = c.social.testimonials.map((x, idx) =>
                        idx === i ? { ...x, quote: e.target.value } : x,
                      );
                      setContent({ ...c, social: { ...c.social, testimonials } });
                    }}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <Label htmlFor={`testimonial-${i}-author`}>Nome</Label>
                    <Input
                      id={`testimonial-${i}-author`}
                      value={t.author}
                      placeholder="Nome"
                      onChange={(e) => {
                        const testimonials = c.social.testimonials.map((x, idx) =>
                          idx === i ? { ...x, author: e.target.value } : x,
                        );
                        setContent({ ...c, social: { ...c.social, testimonials } });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`testimonial-${i}-role`}>Origem (ex.: no Google)</Label>
                    <Input
                      id={`testimonial-${i}-role`}
                      value={t.role}
                      placeholder="no Google"
                      onChange={(e) => {
                        const testimonials = c.social.testimonials.map((x, idx) =>
                          idx === i ? { ...x, role: e.target.value } : x,
                        );
                        setContent({ ...c, social: { ...c.social, testimonials } });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Rodapé */}
        {tab === "mais" && (
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-semibold">Rodapé do site</h2>
          <div>
            <Label htmlFor="footer-tagline">Frase do rodapé</Label>
            <Textarea
              id="footer-tagline"
              value={c.footer.tagline}
              onChange={(e) => setContent({ ...c, footer: { ...c.footer, tagline: e.target.value } })}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Ligações do rodapé</p>
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
                <div>
                  <Label htmlFor={`footer-link-${i}-label`}>Texto</Label>
                  <Input
                    id={`footer-link-${i}-label`}
                    value={l.label}
                    placeholder="Sobre"
                    onChange={(e) => {
                      const quickLinks = c.footer.quickLinks.map((x, idx) =>
                        idx === i ? { ...x, label: e.target.value } : x,
                      );
                      setContent({ ...c, footer: { ...c.footer, quickLinks } });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`footer-link-${i}-href`}>Endereço (ex.: /about)</Label>
                  <Input
                    id={`footer-link-${i}-href`}
                    value={l.href}
                    placeholder="/about"
                    onChange={(e) => {
                      const quickLinks = c.footer.quickLinks.map((x, idx) =>
                        idx === i ? { ...x, href: e.target.value } : x,
                      );
                      setContent({ ...c, footer: { ...c.footer, quickLinks } });
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="self-end"
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
        )}

        {/* Sempre à vista: quem edita tem de saber se já guardou. */}
        <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
          <p
            className={`min-w-0 pl-1 text-sm font-medium ${
              msg ? "text-rose-700" : dirty ? "text-amber-800" : "text-emerald-700"
            }`}
            role="status"
          >
            {msg || (dirty ? "Tens alterações por guardar" : "Tudo guardado")}
          </p>
          <Button className="ml-auto" onClick={save} disabled={saving || !dirty}>
            {saving ? "A guardar…" : "Guardar alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
