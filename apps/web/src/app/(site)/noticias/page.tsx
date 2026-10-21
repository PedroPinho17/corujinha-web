import type { Metadata } from "next";
import { PostsPageSection, type PostItem } from "@/components/site/posts-section";
import { fetchPublicList } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Novidades",
  description: "Notícias, formações e anúncios do Centro de Apoio Escolar Corujinha.",
};

export default async function NoticiasPage() {
  const posts = await fetchPublicList<PostItem>("/api/public/posts", ["posts"]);
  return (
    <div className="pt-4">
      <PostsPageSection posts={posts} />
    </div>
  );
}
