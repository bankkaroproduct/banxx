import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogs } from "@/data/blogs";
import BlogsPostView from "@/views/BlogsPost";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogs.map((blog) => ({ slug: blog.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = blogs.find((b) => b.slug === slug);

  if (!blog) {
    return { title: "Article Not Found | BankKaro" };
  }

  return {
    title: `${blog.title} | BankKaro Blog`,
    description: blog.excerpt,
    robots: 'noindex, follow',
    alternates: { canonical: `https://great.cards/blogs/${slug}` },
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: [{ url: blog.image, width: 800, height: 600 }],
      type: "article",
    },
  };
}

export default async function BlogSlugPage({ params }: Props) {
  const { slug } = await params;
  const blog = blogs.find((b) => b.slug === slug);

  if (!blog) {
    notFound();
  }

  return <BlogsPostView slug={slug} />;
}
