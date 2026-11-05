import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AdminGuard } from "../auth/auth.guard";
import { PostDto, ReorderDto } from "./posts.dto";
import { PostsService } from "./posts.service";

@Controller()
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get("api/public/posts")
  publicList() {
    return this.posts.publicList();
  }

  @Get("api/public/posts/featured")
  featured() {
    return this.posts.featured();
  }

  @Get("api/admin/posts")
  @UseGuards(AdminGuard)
  adminList() {
    return this.posts.adminList();
  }

  @Post("api/admin/posts")
  @UseGuards(AdminGuard)
  create(@Body() dto: PostDto) {
    return this.posts.create(dto);
  }

  @Put("api/admin/posts/:id")
  @UseGuards(AdminGuard)
  update(@Param("id") id: string, @Body() dto: PostDto) {
    return this.posts.update(id, dto);
  }

  @Patch("api/admin/posts/:id/toggle")
  @UseGuards(AdminGuard)
  toggle(@Param("id") id: string) {
    return this.posts.toggle(id);
  }

  @Patch("api/admin/posts/:id/feature")
  @UseGuards(AdminGuard)
  feature(@Param("id") id: string) {
    return this.posts.feature(id);
  }

  @Post("api/admin/posts/reorder")
  @UseGuards(AdminGuard)
  reorder(@Body() dto: ReorderDto) {
    return this.posts.reorder(dto.ids);
  }

  @Delete("api/admin/posts/:id")
  @UseGuards(AdminGuard)
  remove(@Param("id") id: string) {
    return this.posts.remove(id);
  }
}
