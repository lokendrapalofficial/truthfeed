import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchNews } from "@/app/actions/fetchNews";
import { compileBriefing } from "@/app/actions/compileBriefing";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Check authorization header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("CRON_SECRET environment variable is not set.");
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on the server." },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("Unauthorized cron invocation attempt blocked.");
    return NextResponse.json(
      { error: "Unauthorized access." },
      { status: 401 }
    );
  }

  console.log("Authorized cron trigger: fetching RSS feed news...");
  const result = await fetchNews();

  if (result.success) {
    console.log(`Cron job sync successful. Synced ${result.count} articles.`);
    
    // Find all articles that do not have a corresponding Analysis cached
    const pendingArticles = await prisma.article.findMany({
      where: {
        analysis: null,
      },
      select: {
        id: true,
      },
    });

    console.log(`Found ${pendingArticles.length} articles needing briefing compilation.`);
    let compiledCount = 0;
    
    for (const article of pendingArticles) {
      try {
        const compRes = await compileBriefing(article.id);
        if (compRes.success) {
          compiledCount++;
        } else {
          console.error(`Failed compilation for article ${article.id}:`, compRes.error);
        }
      } catch (compileErr) {
        console.error(`Error compiling briefing for article ${article.id}:`, compileErr);
      }
    }

    console.log(`Successfully compiled ${compiledCount}/${pendingArticles.length} briefings.`);

    return NextResponse.json({
      success: true,
      message: `News synchronized and compiled successfully. Synced ${result.count} articles, compiled ${compiledCount} briefings.`,
      count: result.count,
      compiled: compiledCount,
    });
  } else {
    console.error("Cron job sync failed:", result.error);
    return NextResponse.json(
      { success: false, error: result.error || "Unknown sync error" },
      { status: 500 }
    );
  }
}
