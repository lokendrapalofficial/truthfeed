"use server";

import { analyzeArticle } from "./analyzeArticle";
import { WikiContext } from "@/lib/wiki";

export interface BriefingResult {
  briefing: string;
  articleText: string;
  wikiContexts: WikiContext[];
  category: string;
}

export async function compileBriefing(articleId: string) {
  return analyzeArticle(articleId);
}
