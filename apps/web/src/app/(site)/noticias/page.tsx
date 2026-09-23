import { PostsPageSection } from "@/components/site/posts-section";

const api = process.env.INTERNAL_API_URL ?? "http://localhost:3001";

async function getPosts() {
  try {
    const res = await fetch(`${api}/api/public/posts`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function NoticiasPage() {
  const posts = await getPosts();
  return (
    <div className="pt-4">
      <PostsPageSection posts={posts} />
    </div>
  );
}
