import { fetchSubstackPosts } from '@/lib/substack';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const posts = await fetchSubstackPosts();
  return NextResponse.json(posts);
}
