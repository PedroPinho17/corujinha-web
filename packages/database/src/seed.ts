import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "path";
import { hashPassword } from "better-auth/crypto";
import { DEFAULT_SITE_CONTENT } from "@corujinha/shared";
import {
  Account,
  Center,
  Entity,
  Formation,
  Post,
  SchoolProtocol,
  SiteSettings,
  TeamMember,
  User,
  UserRole,
  ensureDataSource,
} from "./index";

for (const path of [
  resolve(__dirname, "../../../.env"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), ".env"),
]) {
  if (existsSync(path)) loadEnv({ path });
}

async function main() {
  const ds = await ensureDataSource();
  const users = ds.getRepository(User);
  const accounts = ds.getRepository(Account);
  const settingsRepo = ds.getRepository(SiteSettings);
  const teamMembers = ds.getRepository(TeamMember);
  const entities = ds.getRepository(Entity);
  const formations = ds.getRepository(Formation);
  const posts = ds.getRepository(Post);
  const protocols = ds.getRepository(SchoolProtocol);
  const centers = ds.getRepository(Center);

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

  let admin = await users.findOneBy({ email });
  if (!admin) {
    admin = await users.save(
      users.create({
        email,
        name,
        emailVerified: true,
        role: UserRole.ADMIN,
        mustChangePassword: true,
      }),
    );
    await accounts.save(
      accounts.create({
        userId: admin.id,
        // better-auth 1.7+ credential lookup: accountId must equal user.id
        accountId: admin.id,
        providerId: "credential",
        password: passwordHash,
      }),
    );
  } else {
    admin.name = name;
    admin.role = UserRole.ADMIN;
    admin.mustChangePassword = true;
    await users.save(admin);
    const existingAccount = await accounts.findOne({
      where: { userId: admin.id, providerId: "credential" },
    });
    if (existingAccount) {
      existingAccount.password = passwordHash;
      existingAccount.accountId = admin.id;
      await accounts.save(existingAccount);
    } else {
      await accounts.save(
        accounts.create({
          userId: admin.id,
          accountId: admin.id,
          providerId: "credential",
          password: passwordHash,
        }),
      );
    }
  }

  const settings = await settingsRepo.find({ take: 1 }).then((r) => r[0] ?? null);
  if (!settings) {
    await settingsRepo.save(
      settingsRepo.create({
        brandingName: process.env.BRANDING_NAME ?? "Corujinha",
        contactEmail: "Geral@ninhodacoruja.pt",
        contactPhone: "+351 916 280 509",
        content: DEFAULT_SITE_CONTENT as unknown as Record<string, unknown>,
      }),
    );
  } else if (!settings.content) {
    settings.content = DEFAULT_SITE_CONTENT as unknown as Record<string, unknown>;
    await settingsRepo.save(settings);
  } else {
    const content = settings.content as {
      social?: { testimonials?: { author?: string; quote?: string }[] };
    };
    const testimonials = content.social?.testimonials ?? [];
    const authors = testimonials.map((t) => t.author ?? "");
    const hasPlaceholders = authors.some((a) =>
      ["Ana M.", "Ricardo S.", "Carla P."].includes(a),
    );
    const starSuffix = /\s*Recomendo\s*5⭐️?(?:⭐️?){0,4}\s*$/u;
    const missingRecomendo = /\s*estudar e conviver\.?\s*$/u;
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
      settings.content = {
        ...(content as object),
        social: {
          ...(content.social ?? {}),
          testimonials: nextTestimonials,
        },
      } as Record<string, unknown>;
      await settingsRepo.save(settings);
    }
  }

  if ((await teamMembers.count()) === 0) {
    await teamMembers.save([
      teamMembers.create({
        name: "Equipa pedagógica",
        description: "Profissionais dedicados ao apoio escolar e desenvolvimento das crianças.",
        sortOrder: 1,
      }),
      teamMembers.create({
        name: "Direção",
        description: "Coordenação do Centro de Apoio Escolar Corujinha.",
        sortOrder: 2,
      }),
    ]);
  }

  if ((await entities.count()) === 0) {
    const entity = await entities.save(
      entities.create({
        name: "Corujinha — Centro de Apoio Escolar",
        description: "Apoio escolar, formações e acompanhamento pedagógico.",
        location: "Portugal",
        sortOrder: 1,
      }),
    );
    await formations.save(
      formations.create({
        name: "Apoio ao estudo",
        description: "Acompanhamento personalizado nas disciplinas escolares.",
        duration: "Anual",
        location: "Presencial",
        entityId: entity.id,
        sortOrder: 1,
        active: true,
      }),
    );
  }

  if ((await posts.count()) === 0) {
    await posts.save(
      posts.create({
        title: "Bem-vindo à Corujinha",
        content: "O novo portal do Centro de Apoio Escolar Corujinha está online.",
        featured: true,
        published: true,
        publishedAt: new Date(),
        sortOrder: 1,
      }),
    );
  }

  if ((await protocols.count()) === 0) {
    await protocols.save(
      protocols.create({
        schoolName: "Protocolo exemplo",
        link: "https://example.com",
        sortOrder: 1,
        active: true,
      }),
    );
  }

  if ((await centers.count()) === 0) {
    await centers.save([
      centers.create({
        slug: "lobao",
        name: "Centro Lobão",
        shortName: "Lobão",
        address: "R. Namorados 566",
        city: "Lobão",
        postalCode: "4505-444",
        isPrimary: true,
        sortOrder: 1,
      }),
      centers.create({
        slug: "sao-joao-de-ver",
        name: "Centro São João de Ver",
        shortName: "São João de Ver",
        address: "Av. Dr. Francisco Sá Carneiro 1192 Loja H",
        city: "São João de Ver",
        postalCode: "4520-617",
        isPrimary: false,
        sortOrder: 2,
      }),
      centers.create({
        slug: "sanguedo",
        name: "Centro Sanguedo",
        shortName: "Sanguedo",
        city: "Sanguedo",
        isPrimary: false,
        sortOrder: 3,
      }),
    ]);
  }

  console.log("Seed complete. Admin:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { AppDataSource } = await import("./index");
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });
