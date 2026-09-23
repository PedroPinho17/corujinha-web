import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { DEFAULT_SITE_CONTENT } from "@corujinha/shared";

loadEnv({ path: resolve(__dirname, "../../../.env") });
loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@corujinha.local";
  const password = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const name = process.env.ADMIN_NAME ?? "Admin Corujinha";
  const passwordHash = await hashPassword(password);

  let admin = await prisma.user.findUnique({ where: { email } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email,
        name,
        emailVerified: true,
        role: UserRole.ADMIN,
        mustChangePassword: false,
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
      data: { name, role: UserRole.ADMIN },
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
