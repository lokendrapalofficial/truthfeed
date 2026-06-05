"use server";

import { createServerActionClient } from "@/lib/supabaseServer";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitNote(articleId: string, text: string, sourceUrl: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!session || !userId) {
      return { success: false, error: "You must be signed in to submit a community note." };
    }

    if (!text || text.trim() === "") {
      return { success: false, error: "Note text cannot be empty." };
    }

    if (!sourceUrl || sourceUrl.trim() === "") {
      return { success: false, error: "Source citation URL is required." };
    }

    const note = await prisma.communityNote.create({
      data: {
        articleId,
        userId,
        text: text.trim(),
        sourceUrl: sourceUrl.trim(),
        upvotes: 0,
        downvotes: 0,
      },
    });

    console.log(`User ${userId} created Community Note on Article ${articleId}`);
    revalidatePath(`/article/${articleId}`);
    return { success: true, note };
  } catch (error: any) {
    console.error("Error submitting community note:", error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function voteNote(noteId: string, voteType: "UPVOTE" | "DOWNVOTE") {
  try {
    const cookieStore = await cookies();
    const supabase = createServerActionClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "You must be signed in to vote on community notes." };
    }

    const note = await prisma.communityNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return { success: false, error: "Community note not found." };
    }

    await prisma.communityNote.update({
      where: { id: noteId },
      data: {
        upvotes: voteType === "UPVOTE" ? { increment: 1 } : undefined,
        downvotes: voteType === "DOWNVOTE" ? { increment: 1 } : undefined,
      },
    });

    console.log(`Vote type ${voteType} cast on note ${noteId}`);
    revalidatePath(`/article/${note.articleId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error casting vote on note:", error);
    return { success: false, error: error.message || String(error) };
  }
}
