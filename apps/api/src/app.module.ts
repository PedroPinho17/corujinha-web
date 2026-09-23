import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { MailModule } from "./mail/mail.module";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { MediaModule } from "./media/media.module";
import { TranslateModule } from "./translate/translate.module";
import { ContactModule } from "./contact/contact.module";
import { TeamsModule } from "./teams/teams.module";
import { PostsModule } from "./posts/posts.module";
import { EntitiesModule } from "./entities/entities.module";
import { FormationsModule } from "./formations/formations.module";
import { ProtocolsModule } from "./protocols/protocols.module";
import { GalleryModule } from "./gallery/gallery.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { UsersModule } from "./users/users.module";
import { SettingsModule } from "./settings/settings.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL ?? "redis://localhost:6379",
      },
    }),
    PrismaModule,
    RedisModule,
    MailModule,
    AuthModule,
    HealthModule,
    MediaModule,
    TranslateModule,
    ContactModule,
    TeamsModule,
    PostsModule,
    EntitiesModule,
    FormationsModule,
    ProtocolsModule,
    GalleryModule,
    DashboardModule,
    UsersModule,
    SettingsModule,
  ],
})
export class AppModule {}
