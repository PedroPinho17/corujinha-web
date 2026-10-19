import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "path";
import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { DEFAULT_SITE_CONTENT } from "@corujinha/shared";

for (const path of [
  resolve(__dirname, "../../../.env"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), ".env"),
]) {
  if (existsSync(path)) loadEnv({ path });
}

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || "Admin Corujinha";

  if (!email) {
    throw new Error("Defina ADMIN_EMAIL no .env antes de correr o seed.");
  }
  if (!password || password.length < 12) {
    throw new Error(
      "Defina ADMIN_PASSWORD no .env (mín. 12 caracteres). Não há password por omissão.",
    );
  }
  if (/admin123/i.test(password) || password === "password" || password === "12345678") {
    throw new Error("ADMIN_PASSWORD demasiado fraca / conhecida — escolha outra.");
  }

  const passwordHash = await hashPassword(password);

  let admin = await prisma.user.findUnique({ where: { email } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: true,
        role: UserRole.ADMIN,
        mustChangePassword: true,
        accounts: {
          create: {
            accountId: email,
            providerId: "credential",
            password: passwordHash,
          },
        },
      },
    });
  } else {
    await prisma.user.update({
      where: { id: admin.id },
      data: { name, role: UserRole.ADMIN, mustChangePassword: true },
    });
    const existingAccount = await prisma.account.findFirst({
      where: { userId: admin.id, providerId: "credential" },
    });
    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: passwordHash },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: admin.id,
          accountId: email,
          providerId: "credential",
          password: passwordHash,
        },
      });
    }
  }

  const settings = await prisma.siteSettings.findFirst();
  if (!settings) {
    await prisma.siteSettings.create({
      data: {
        brandingName: process.env.BRANDING_NAME ?? "Corujinha",
        contactEmail: "Geral@ninhodacoruja.pt",
        contactPhone: "+351 916 280 509",
        content: DEFAULT_SITE_CONTENT as object,
      },
    });
  } else if (!settings.content) {
    await prisma.siteSettings.update({
      where: { id: settings.id },
      data: { content: DEFAULT_SITE_CONTENT as object },
    });
  } else {
    // Replace placeholder testimonials (Ana M. / Ricardo S. / Carla P.) with real Google reviews.
    // Strip trailing "5⭐…" from Sandra but keep «Recomendo.» (stars already shown on the card).
    const content = settings.content as {
      social?: { testimonials?: { author?: string; quote?: string }[] };
    };
    const testimonials = content.social?.testimonials ?? [];
    const authors = testimonials.map((t) => t.author ?? "");
    const hasPlaceholders = authors.some((a) =>
      ["Ana M.", "Ricardo S.", "Carla P."].includes(a),
    );
    const starSuffix = /\s*Recomendo\s*5⭐️?(?:⭐️?){0,4}\s*$/u;
    const missingRecomendo =
      /\s*estudar e conviver\.?\s*$/u;
    const needsSandraFix = testimonials.some((t) => {
      if (t.author !== "Sandra Gomes" || !t.quote) return false;
      return starSuffix.test(t.quote) || (missingRecomendo.test(t.quote) && !/Recomendo/i.test(t.quote));
    });
    if (hasPlaceholders || needsSandraFix) {
      const nextTestimonials = hasPlaceholders
        ? DEFAULT_SITE_CONTENT.social.testimonials
        : testimonials.map((t) => {
            if (t.author !== "Sandra Gomes" || !t.quote) return t;
            if (starSuffix.test(t.quote)) {
              return { ...t, quote: t.quote.replace(starSuffix, " Recomendo.").trimEnd() };
            }
            if (missingRecomendo.test(t.quote) && !/Recomendo/i.test(t.quote)) {
              return {
                ...t,
                quote: t.quote.replace(missingRecomendo, " estudar e conviver. Recomendo."),
              };
            }
            return t;
          });
      const next = {
        ...(content as object),
        social: {
          ...(content.social ?? {}),
          testimonials: nextTestimonials,
        },
      };
      await prisma.siteSettings.update({
        where: { id: settings.id },
        data: { content: next as object },
      });
    }
  }

  if ((await prisma.teamMember.count()) === 0) {
    await prisma.teamMember.createMany({
      data: [
        {
          name: "Equipa pedagógica",
          description: "Profissionais dedicados ao apoio escolar e desenvolvimento das crianças.",
          sortOrder: 1,
        },
        {
          name: "Direção",
          description: "Coordenação do Centro de Apoio Escolar Corujinha.",
          sortOrder: 2,
        },
      ],
    });
  }

  if ((await prisma.entity.count()) === 0) {
    const entity = await prisma.entity.create({
      data: {
        name: "Corujinha — Centro de Apoio Escolar",
        description: "Apoio escolar, formações e acompanhamento pedagógico.",
        location: "Portugal",
        sortOrder: 1,
      },
    });
    await prisma.formation.create({
      data: {
        name: "Apoio ao estudo",
        description: "Acompanhamento personalizado nas disciplinas escolares.",
        duration: "Anual",
        location: "Presencial",
        entityId: entity.id,
        sortOrder: 1,
        active: true,
      },
    });
  }

  if ((await prisma.post.count()) === 0) {
    await prisma.post.create({
      data: {
        title: "Bem-vindo à Corujinha",
        content: "O novo portal do Centro de Apoio Escolar Corujinha está online.",
        featured: true,
        published: true,
        publishedAt: new Date(),
        sortOrder: 1,
      },
    });
  }

  if ((await prisma.schoolProtocol.count()) === 0) {
    await prisma.schoolProtocol.create({
      data: {
        schoolName: "Protocolo exemplo",
        link: "https://example.com",
        sortOrder: 1,
        active: true,
      },
    });
  }

  if ((await prisma.center.count()) === 0) {
    await prisma.center.createMany({
      data: [
        {
          slug: "lobao",
          name: "Centro Lobão",
          shortName: "Lobão",
          address: "R. Namorados 566",
          city: "Lobão",
          postalCode: "4505-444",
          isPrimary: true,
          sortOrder: 1,
        },
        {
          slug: "sao-joao-de-ver",
          name: "Centro São João de Ver",
          shortName: "São João de Ver",
          address: "Av. Dr. Francisco Sá Carneiro 1192 Loja H",
          city: "São João de Ver",
          postalCode: "4520-617",
          isPrimary: false,
          sortOrder: 2,
        },
        {
          slug: "sanguedo",
          name: "Centro Sanguedo",
          shortName: "Sanguedo",
          city: "Sanguedo",
          isPrimary: false,
          sortOrder: 3,
        },
      ],
    });
  }

  console.log("Seed complete. Admin:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
