// Deprecated NextAuth Route handler, replaced by Supabase Auth callback route.
export async function GET() {
  return new Response("NextAuth is disabled. Please use Supabase Auth.", { status: 404 });
}

export async function POST() {
  return new Response("NextAuth is disabled. Please use Supabase Auth.", { status: 404 });
}
