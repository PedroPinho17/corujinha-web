import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Controller()
export class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get("api/public/home")
  async home() {
    const cached = await this.redis.getJson("public:home");
    if (cached) return cached;

    const [formations, team, posts, protocols, gallery, centers, settings] = await Promise.all([
      this.prisma.formation.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        take: 12,
        select: {
          id: true,
          name: true,
          description: true,
          duration: true,
          entity: { select: { name: true } },
        },
      }),
      this.prisma.teamMember.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        take: 8,
        select: { id: true, name: true, imageKey: true },
      }),
      this.prisma.post.findMany({
        where: { published: true, featured: true },
        orderBy: { sortOrder: "asc" },
        take: 6,
        select: {
          id: true,
          title: true,
          content: true,
          imageKey: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.schoolProtocol.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          schoolName: true,
          link: true,
          description: true,
          documentKey: true,
        },
      }),
      this.prisma.galleryImage.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        take: 8,
        select: {
          id: true,
          imageKey: true,
          alt: true,
          album: true,
          center: { select: { slug: true, name: true, shortName: true } },
        },
      }),
      this.prisma.center.findMany({
        where: { published: true },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          slug: true,
          name: true,
          shortName: true,
          address: true,
          city: true,
          postalCode: true,
          phone: true,
          email: true,
          isPrimary: true,
        },
      }),
      this.prisma.siteSettings.findFirst({ orderBy: { createdAt: "asc" } }),
    ]);

    const data = { formations, team, posts, protocols, gallery, centers, settings };
    await this.redis.setJson("public:home", data);
    return data;
  }

  @Get("api/admin/dashboard")
  @UseGuards(AdminGuard)
  async dashboard() {
    const active = { erasedAt: null as Date | null };
    const [users, teams, posts, formations, protocols, contacts, unreadContacts, recentContacts] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.teamMember.count(),
        this.prisma.post.count(),
        this.prisma.formation.count(),
        this.prisma.schoolProtocol.count({ where: { active: true } }),
        this.prisma.contactMessage.count({ where: { ...active, status: "NEW" } }),
        this.prisma.contactMessage.count({ where: { ...active, readAt: null } }),
        this.prisma.contactMessage.findMany({
          where: active,
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            kind: true,
            subject: true,
            location: true,
            readAt: true,
            createdAt: true,
            message: true,
          },
        }),
      ]);
    return {
      users,
      teams,
      posts,
      formations,
      protocols,
      contacts,
      unreadContacts,
      recentContacts,
    };
  }
}
