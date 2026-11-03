import { Controller, Get, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Center,
  ContactMessage,
  ContactStatus,
  Formation,
  GalleryImage,
  Post,
  SchoolProtocol,
  SiteSettings,
  TeamMember,
  User,
} from "@corujinha/database";
import { IsNull, Repository } from "typeorm";
import { AdminGuard } from "../auth/auth.guard";
import { RedisService } from "../redis/redis.service";

@Controller()
export class DashboardController {
  constructor(
    @InjectRepository(Formation) private readonly formations: Repository<Formation>,
    @InjectRepository(TeamMember) private readonly teamMembers: Repository<TeamMember>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(SchoolProtocol) private readonly protocols: Repository<SchoolProtocol>,
    @InjectRepository(GalleryImage) private readonly gallery: Repository<GalleryImage>,
    @InjectRepository(Center) private readonly centers: Repository<Center>,
    @InjectRepository(SiteSettings) private readonly settings: Repository<SiteSettings>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(ContactMessage) private readonly contacts: Repository<ContactMessage>,
    private readonly redis: RedisService,
  ) {}

  @Get("api/public/home")
  async home() {
    const cached = await this.redis.getJson("public:home");
    if (cached) return cached;

    const [formationRows, team, postRows, protocolRows, galleryRows, centerRows, settings] =
      await Promise.all([
        this.formations.find({
          where: { active: true },
          order: { sortOrder: "ASC" },
          take: 12,
          relations: { entity: true },
        }),
        this.teamMembers.find({
          where: { published: true },
          order: { sortOrder: "ASC" },
          take: 8,
          select: { id: true, name: true, imageKey: true },
        }),
        this.posts.find({
          where: { published: true, featured: true },
          order: { sortOrder: "ASC" },
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
        this.protocols.find({
          where: { active: true },
          order: { sortOrder: "ASC" },
          select: {
            id: true,
            schoolName: true,
            link: true,
            description: true,
            documentKey: true,
          },
        }),
        this.gallery.find({
          where: { published: true },
          order: { sortOrder: "ASC" },
          take: 8,
          relations: { center: true },
        }),
        this.centers.find({
          where: { published: true },
          order: { isPrimary: "DESC", sortOrder: "ASC" },
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
        this.settings.find({ order: { createdAt: "ASC" }, take: 1 }).then((r) => r[0] ?? null),
      ]);

    const formations = formationRows.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      duration: f.duration,
      entity: f.entity ? { name: f.entity.name } : null,
    }));
    const gallery = galleryRows.map((g) => ({
      id: g.id,
      imageKey: g.imageKey,
      alt: g.alt,
      album: g.album,
      center: g.center
        ? { slug: g.center.slug, name: g.center.name, shortName: g.center.shortName }
        : null,
    }));

    const data = {
      formations,
      team,
      posts: postRows,
      protocols: protocolRows,
      gallery,
      centers: centerRows,
      settings,
    };
    await this.redis.setJson("public:home", data);
    return data;
  }

  @Get("api/admin/dashboard")
  @UseGuards(AdminGuard)
  async dashboard() {
    const [users, teams, posts, formations, protocols, contacts, unreadContacts, recentContacts] =
      await Promise.all([
        this.users.count(),
        this.teamMembers.count(),
        this.posts.count(),
        this.formations.count(),
        this.protocols.count({ where: { active: true } }),
        this.contacts.count({
          where: { erasedAt: IsNull(), status: ContactStatus.NEW },
        }),
        this.contacts.count({
          where: { erasedAt: IsNull(), readAt: IsNull() },
        }),
        this.contacts.find({
          where: { erasedAt: IsNull() },
          order: { createdAt: "DESC" },
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
