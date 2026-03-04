import { fetchPostById } from "@/app/actions/post";
import PostCard from "@/components/posts/PostCard";

interface PostPageProps {
  params: Promise<{ id: string }>;
}
async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const post = await fetchPostById(id);
  if (!post) {
    return <div>Post not found</div>;
  }
  return (
    <>
      <PostCard post={post} />
    </>
  );
}

export default PostPage;
