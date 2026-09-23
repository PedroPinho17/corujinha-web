export type HeroFeature = { title: string; description: string; tone: "pink" | "orange" | "blue" };

export type HeroContent = {
  titleBefore: string;
  titlePink: string;
  titleMid: string;
  titleOrange: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  badgeValue: string;
  badgeLabel: string;
  logoPath: string;
  features: HeroFeature[];
};

export type ServiceCard = {
  title: string;
  description: string;
  items: string[];
  tone: "pink" | "orange" | "blue";
};

export type ServicesContent = {
  title: string;
  titleAccent: string;
  subtitle: string;
  cards: ServiceCard[];
};

export type AboutContent = {
  sectionTitle: string;
  sectionAccent: string;
  sectionSubtitle: string;
  founderName: string;
  founderRole: string;
  founderBio: string;
  founderImagePath: string;
  storyHtml: string;
  quote: string;
  experienceTitle: string;
  experienceSubtitle: string;
  experienceCards: { title: string; body: string; tone: "pink" | "orange" | "blue" }[];
  timeline: { title: string; description: string; tone: "pink" | "orange" | "blue" }[];
};

export type PartnerContent = {
  badge: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  name: string;
  tagline: string;
  services: string[];
  body: string;
  phone?: string;
  email?: string;
  website?: string;
};

export type ContactContent = {
  title: string;
  titleAccent: string;
  subtitle: string;
  phone: string;
  emailPrimary: string;
  emailSecondary: string;
  addressMainLabel: string;
  addressMainLines: string[];
  addressSecondaryLabel: string;
  addressSecondaryLines: string[];
  locations: string[];
  mapEmbedUrl?: string;
  /** Weekday schedule lines, e.g. "Seg–Sex 14h–19h" */
  hoursLines: string[];
  subjects: string[];
  schoolYears: string[];
};

export type FaqItem = { question: string; answer: string };

export type Testimonial = { quote: string; author: string; role: string };

export type SocialProofContent = {
  faqTitle: string;
  faqSubtitle: string;
  faq: FaqItem[];
  testimonialsTitle: string;
  testimonialsSubtitle: string;
  testimonials: Testimonial[];
};

export type FooterContent = {
  tagline: string;
  quickLinks: { label: string; href: string }[];
};

export type SiteContent = {
  hero: HeroContent;
  services: ServicesContent;
  about: AboutContent;
  partner: PartnerContent;
  contact: ContactContent;
  social: SocialProofContent;
  footer: FooterContent;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    titleBefore: "Educação com",
    titlePink: "Carinho",
    titleMid: "e",
    titleOrange: "Dedicação",
    subtitle:
      "Centro de explicações e apoio educativo para crianças até ao 12º ano e preparação para os exames. Na Corujinha, cada criança recebe atenção personalizada para alcançar o seu melhor potencial.",
    ctaPrimary: "Pedir inscrição",
    ctaSecondary: "Saiba Mais",
    badgeValue: "+500",
    badgeLabel: "Crianças Apoiadas",
    logoPath: "/logo1.webp",
    features: [
      {
        title: "Explicações",
        description:
          "Apoio escolar personalizado para todas as disciplinas até ao 12º ano e preparação para os exames",
        tone: "pink",
      },
      {
        title: "Atividades de Férias",
        description: "Programas divertidos e educativos durante as férias escolares",
        tone: "orange",
      },
      {
        title: "Acompanhamento",
        description: "Atenção individualizada e proximidade com as famílias",
        tone: "blue",
      },
    ],
  },
  services: {
    title: "Os Nossos",
    titleAccent: "Serviços",
    subtitle: "Soluções completas para o apoio educativo e bem-estar das crianças",
    cards: [
      {
        title: "Explicações",
        description:
          "Apoio escolar personalizado para crianças até ao 9º ano de escolaridade. Todas as disciplinas com professores especializados.",
        items: [
          "Matemática e Ciências",
          "Português e Línguas",
          "Apoio aos Trabalhos de Casa",
          "Preparação para Testes",
        ],
        tone: "pink",
      },
      {
        title: "Atividades de Férias",
        description:
          "Durante as férias escolares, oferecemos um programa completo de atividades lúdicas e educativas para as crianças.",
        items: ["Jogos Educativos", "Atividades Criativas", "Recreação ao Ar Livre"],
        tone: "orange",
      },
      {
        title: "Formação",
        description:
          "Cursos técnicos e formações profissionais em parceria com entidades especializadas.",
        items: ["Cursos técnicos", "Formação contínua", "Parcerias educativas"],
        tone: "blue",
      },
    ],
  },
  about: {
    sectionTitle: "Sobre a",
    sectionAccent: "Corujinha",
    sectionSubtitle:
      "Um projeto nascido do coração, dedicado ao desenvolvimento e bem-estar das crianças",
    founderName: "Vera Branquinho",
    founderRole: "Fundadora da Corujinha",
    founderBio:
      "Nascida a 10 de outubro de 1980, Licenciada e detentora de um Mestrado em Sociologia das Organizações e do Trabalho. Complementou a formação com Pós-Graduação em Gestão de Recursos Humanos e formação especializada em TDAH e Hiperatividade.",
    founderImagePath: "/Vera.webp",
    storyHtml:
      "Vera Branquinho sempre teve um sonho: fazer a diferença na vida das pessoas — especialmente das crianças e jovens. Desde cedo ligada à área da educação e formação, acreditou sempre que aprender vai muito além dos livros.",
    quote:
      "O que começou como um pequeno sonho tornou-se, com muito trabalho e determinação, um projeto sólido e reconhecido na região.",
    experienceTitle: "Formação e Experiência",
    experienceSubtitle: "Uma trajetória dedicada à educação e desenvolvimento humano",
    experienceCards: [
      {
        title: "Formação Académica",
        body: "Licenciatura e Mestrado em Sociologia; Pós-Graduação em GRH; formação em TDAH e Hiperatividade.",
        tone: "pink",
      },
      {
        title: "Experiência Profissional",
        body: "Passou pela Minisom e encontrou a vocação na educação comunitária e no apoio escolar.",
        tone: "orange",
      },
      {
        title: "Missão",
        body: "Acompanhar cada criança com proximidade, rigor pedagógico e carinho.",
        tone: "blue",
      },
    ],
    timeline: [
      {
        title: "Início",
        description: "Nascimento do projeto Corujinha com foco no apoio escolar personalizado.",
        tone: "pink",
      },
      {
        title: "Lobão",
        description: "Consolidação do centro principal em Lobão.",
        tone: "orange",
      },
      {
        title: "São João de Ver",
        description: "Expansão com novo polo para servir mais famílias.",
        tone: "blue",
      },
    ],
  },
  partner: {
    badge: "Parceria Especial",
    title: "Juntos pelo",
    titleAccent: "Desenvolvimento",
    subtitle: "Em colaboração com profissionais especializados para um acompanhamento completo",
    name: "Labirintológico",
    tagline: "Clínica de Acompanhamento Terapêutico",
    services: ["Psicologia", "Terapia Ocupacional", "Terapia da Fala", "Integração Sensorial"],
    body: "Uma parceria pensada para dar às crianças e famílias um acompanhamento educativo e terapêutico integrado.",
  },
  contact: {
    title: "Entre em",
    titleAccent: "Contacto",
    subtitle: "Peça inscrição ou envie uma mensagem — respondemos com horário e disponibilidade.",
    phone: "+351 916 280 509",
    emailPrimary: "Formacao@ninhodacoruja.pt",
    emailSecondary: "Geral@ninhodacoruja.pt",
    addressMainLabel: "Centro Lobão",
    addressMainLines: ["R. Namorados 566", "4505-444 Lobão"],
    addressSecondaryLabel: "Centro São João de Ver",
    addressSecondaryLines: ["Av. Dr. Francisco Sá Carneiro 1192 Loja H", "4520-617 São João de Ver"],
    locations: ["Lobão", "São João de Ver"],
    hoursLines: [
      "Segunda a Sexta: 14h00 – 19h30",
      "Sábados: sob marcação",
      "Horários de aula combinados consigo após o contacto",
    ],
    subjects: [
      "Matemática",
      "Português",
      "Inglês",
      "Física e Química",
      "Ciências Naturais",
      "História",
      "Geografia",
      "Preparação de exames",
      "Outra / várias",
    ],
    schoolYears: [
      "1.º ciclo",
      "5.º / 6.º ano",
      "7.º / 8.º / 9.º ano",
      "10.º / 11.º / 12.º ano",
      "Exames nacionais",
    ],
  },
  social: {
    faqTitle: "Perguntas",
    faqSubtitle: "Respostas rápidas para famílias que nos contactam pela primeira vez",
    faq: [
      {
        question: "Como funciona o pedido de inscrição?",
        answer:
          "Preencha o formulário com disciplina, ano e polo preferido. Entramos em contacto para combinar horário e disponibilidade.",
      },
      {
        question: "Quais os polos e horários?",
        answer:
          "Temos centros em Lobão e São João de Ver. O horário das aulas é personalizado — tipicamente à tarde durante a semana.",
      },
      {
        question: "Até que ano dão apoio?",
        answer:
          "Apoiamos desde o 1.º ciclo até ao 12.º ano, incluindo preparação para exames.",
      },
      {
        question: "Posso visitar o centro antes?",
        answer:
          "Sim. Indique no pedido de contacto que gostaria de uma visita e combinamos um momento conveniente.",
      },
    ],
    testimonialsTitle: "O que dizem",
    testimonialsSubtitle: "Famílias que confiam na Corujinha",
    testimonials: [
      {
        quote:
          "O acompanhamento é próximo e a minha filha ganhou confiança nas aulas. Sentimos sempre disponibilidade para falar.",
        author: "Ana M.",
        role: "Mãe — Lobão",
      },
      {
        quote:
          "A preparação para os exames fez a diferença. Ambiente acolhedor e professores atentos.",
        author: "Ricardo S.",
        role: "Pai — São João de Ver",
      },
      {
        quote:
          "Desde as férias até ao apoio semanal, a Corujinha tornou-se parte da rotina da nossa família.",
        author: "Carla P.",
        role: "Mãe",
      },
    ],
  },
  footer: {
    tagline: "Centro de Apoio Escolar — educação com carinho e dedicação.",
    quickLinks: [
      { label: "Sobre", href: "/about" },
      { label: "Galeria", href: "/galeria" },
      { label: "Equipa", href: "/equipa" },
      { label: "Notícias", href: "/noticias" },
      { label: "Contacto", href: "/#contact" },
    ],
  },
};

/** Deep-merge partial CMS content with defaults so new fields never break old DB JSON. */
export function mergeSiteContent(partial?: Partial<SiteContent> | null): SiteContent {
  const p = partial ?? {};
  return {
    hero: { ...DEFAULT_SITE_CONTENT.hero, ...p.hero, features: p.hero?.features ?? DEFAULT_SITE_CONTENT.hero.features },
    services: {
      ...DEFAULT_SITE_CONTENT.services,
      ...p.services,
      cards: p.services?.cards ?? DEFAULT_SITE_CONTENT.services.cards,
    },
    about: {
      ...DEFAULT_SITE_CONTENT.about,
      ...p.about,
      experienceCards: p.about?.experienceCards ?? DEFAULT_SITE_CONTENT.about.experienceCards,
      timeline: p.about?.timeline ?? DEFAULT_SITE_CONTENT.about.timeline,
    },
    partner: {
      ...DEFAULT_SITE_CONTENT.partner,
      ...p.partner,
      services: p.partner?.services ?? DEFAULT_SITE_CONTENT.partner.services,
    },
    contact: {
      ...DEFAULT_SITE_CONTENT.contact,
      ...p.contact,
      addressMainLines: p.contact?.addressMainLines ?? DEFAULT_SITE_CONTENT.contact.addressMainLines,
      addressSecondaryLines:
        p.contact?.addressSecondaryLines ?? DEFAULT_SITE_CONTENT.contact.addressSecondaryLines,
      locations: p.contact?.locations ?? DEFAULT_SITE_CONTENT.contact.locations,
      hoursLines: p.contact?.hoursLines ?? DEFAULT_SITE_CONTENT.contact.hoursLines,
      subjects: p.contact?.subjects ?? DEFAULT_SITE_CONTENT.contact.subjects,
      schoolYears: p.contact?.schoolYears ?? DEFAULT_SITE_CONTENT.contact.schoolYears,
    },
    social: {
      ...DEFAULT_SITE_CONTENT.social,
      ...p.social,
      faq: p.social?.faq ?? DEFAULT_SITE_CONTENT.social.faq,
      testimonials: p.social?.testimonials ?? DEFAULT_SITE_CONTENT.social.testimonials,
    },
    footer: {
      ...DEFAULT_SITE_CONTENT.footer,
      ...p.footer,
      quickLinks: p.footer?.quickLinks ?? DEFAULT_SITE_CONTENT.footer.quickLinks,
    },
  };
}
