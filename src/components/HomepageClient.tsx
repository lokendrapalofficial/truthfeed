"use client";

import React, { useState, useMemo, useTransition } from "react";
import Navbar from "@/components/Navbar";
import NewsCard, { ArticleMock } from "@/components/NewsCard";
import { Filter, CheckCircle, XCircle, AlertCircle, HelpCircle, FileText, Activity, Users, Database, RefreshCw, BookOpen } from "lucide-react";
import { fetchNews } from "@/app/actions/fetchNews";
import Link from "next/link";

interface HomepageClientProps {
  initialArticles: any[];
}

export default function HomepageClient({ initialArticles }: HomepageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRating, setSelectedRating] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const articles: ArticleMock[] = useMemo(() => {
    return initialArticles.map((art) => ({
      id: art.id,
      title: art.title,
      url: `/article/${art.id}`,
      content: art.content,
      summary: art.summary || art.content || "",
      sourceName: art.sourceName,
      publishedAt: art.publishedAt.toISOString ? art.publishedAt.toISOString() : String(art.publishedAt),
      factChecks: art.factChecks ? art.factChecks.map((fc: any) => ({
        id: fc.id,
        claimText: fc.claimText,
        verdict: fc.verdict,
        rating: fc.rating,
        sourceOrganization: fc.sourceOrganization,
        factCheckUrl: fc.factCheckUrl,
      })) : [],
      source: art.source,
    }));
  }, [initialArticles]);

  const handleRefresh = () => {
    startTransition(async () => {
      setRefreshMessage("Fetching latest Google News RSS...");
      const result = await fetchNews();
      if (result.success) {
        setRefreshMessage(`Successfully synchronized ${result.count} articles!`);
        setTimeout(() => setRefreshMessage(null), 4000);
      } else {
        setRefreshMessage(`Sync failed: ${result.error || result.message}`);
        setTimeout(() => setRefreshMessage(null), 5000);
      }
    });
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearch =
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === "fact-checks") {
        if (!article.factChecks || article.factChecks.length === 0) return false;
      }
      if (selectedRating !== "ALL") {
        const factCheck = article.factChecks?.[0];
        if (selectedRating === "UNVERIFIED") return !factCheck || factCheck.rating === "UNVERIFIED";
        return factCheck?.rating === selectedRating;
      }
      return true;
    });
  }, [articles, searchQuery, activeTab, selectedRating]);

  const stats = useMemo(() => {
    const total = articles.length;
    const trueCount = articles.filter(a => a.factChecks?.[0]?.rating === "TRUE").length;
    const falseCount = articles.filter(a => a.factChecks?.[0]?.rating === "FALSE").length;
    const mixedCount = articles.filter(a => a.factChecks?.[0]?.rating === "MIXED").length;
    const unverifiedCount = articles.filter(a => !a.factChecks || a.factChecks.length === 0 || a.factChecks[0]?.rating === "UNVERIFIED").length;
    return { total, trueCount, falseCount, mixedCount, unverifiedCount };
  }, [articles]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900">
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "about" ? (
          /* About Platform Tab */
          <div className="max-w-3xl mx-auto py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white mb-6">
              <span className="font-serif text-lg font-bold tracking-tight">TF</span>
            </div>
            <h1 className="font-serif text-4xl font-black tracking-tight mb-4 text-zinc-900">
              About TruthFeed
            </h1>
            <p className="text-lg leading-relaxed text-zinc-600 mb-8">
              TruthFeed is an open-source news aggregation and integrity validation platform. We believe that a well-informed public is the cornerstone of democratic society. By tracking major news claims and matching them against verified fact-checking institutions, we help citizens distinguish signal from noise.
            </p>

            <h2 className="font-serif text-2xl font-bold mb-3 text-zinc-900">Our Core Pillars</h2>
            <div className="grid gap-6 sm:grid-cols-2 mb-12">
              <div className="p-5 border border-zinc-200 rounded-xl bg-white shadow-sm">
                <h3 className="font-bold text-zinc-900 mb-1.5 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Transparency
                </h3>
                <p className="text-sm text-zinc-600">
                  Every verdict link is directly mapped to the original, extensive analysis from professional, accredited verification organizations.
                </p>
              </div>
              <div className="p-5 border border-zinc-200 rounded-xl bg-white shadow-sm">
                <h3 className="font-bold text-zinc-900 mb-1.5 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-zinc-500" />
                  Real-time Auditing
                </h3>
                <p className="text-sm text-zinc-600">
                  We monitor viral headlines and claims, making it effortless to search or browse current fact-checks in a single streamlined interface.
                </p>
              </div>
            </div>

            <h2 className="font-serif text-2xl font-bold mb-3 text-zinc-900">Technology Stack</h2>
            <p className="text-sm text-zinc-600 mb-6">
              Our initial platform build leverages high-performance, modern frameworks to ensure security, rapid response, and absolute correctness:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Framework", value: "Next.js 14+" },
                { label: "Styling", value: "Tailwind CSS" },
                { label: "Database", value: "Prisma & SQLite" },
                { label: "Icons", value: "Lucide React" },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 text-center rounded-lg border border-zinc-200 bg-white shadow-sm">
                  <p className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">{label}</p>
                  <p className="font-serif font-extrabold text-sm text-zinc-900 mt-1">{value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* News Feed and Fact Checks Grid View */
          <div>
            {/* Hero Banner */}
            <div className="relative rounded-3xl border border-zinc-200 bg-white p-8 sm:p-12 mb-12 shadow-sm overflow-hidden">
              <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-zinc-50 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-zinc-50 blur-3xl" />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  {/* Full Editorial Masthead — Hero Treatment */}
                  <div className="mb-8">
                    <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 leading-none">
                      TruthFeed
                    </h1>
                    <p className="mt-3 font-sans text-base sm:text-lg font-normal tracking-wide text-zinc-500">
                      Read the news. Know the truth.
                    </p>
                  </div>
                  <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
                    TruthFeed compiles, analyzes, and cross-checks the latest news stories using programmatic Google News RSS parsing and dynamic Gemini AI insights.
                  </p>
                </div>

                {/* Refresh Trigger Block */}
                <div className="shrink-0 flex flex-col items-center md:items-end gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white disabled:bg-zinc-200 disabled:text-zinc-400 font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 duration-200 cursor-pointer text-[10px]"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                    <span>{isPending ? "Refreshing..." : "Refresh News"}</span>
                  </button>
                  {refreshMessage && (
                    <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200 transition-opacity duration-300">
                      {refreshMessage}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Grid Layout: Main Feed & Sidebar */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Articles Main Stream */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Rating filter tools */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Filter className="h-4 w-4" />
                    <span className="text-xs uppercase font-bold tracking-wider">Filters</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: "ALL", label: "All Stories", color: "border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700" },
                      { key: "TRUE", label: "Verified True", color: "border-emerald-200 hover:bg-emerald-50 text-emerald-700" },
                      { key: "FALSE", label: "False/Misleading", color: "border-rose-200 hover:bg-rose-50 text-rose-700" },
                      { key: "MIXED", label: "Mixed", color: "border-amber-200 hover:bg-amber-50 text-amber-700" },
                      { key: "UNVERIFIED", label: "Unverified", color: "border-zinc-200 hover:bg-zinc-100 text-zinc-600" },
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => setSelectedRating(btn.key)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer ${
                          selectedRating === btn.key
                            ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                            : btn.color
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid container */}
                {filteredArticles.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredArticles.map((article) => (
                      <NewsCard key={article.id} article={article} />
                    ))}
                  </div>
                ) : (
                  /* Empty state */
                  <div className="text-center py-16 px-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                    <HelpCircle className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
                    <h3 className="text-lg font-bold text-zinc-900 font-serif">No articles available</h3>
                    <p className="text-zinc-500 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
                      There are no stories mapped to this filter in SQLite. Click the "Refresh News" button at the top to fetch active Google News RSS headlines!
                    </p>
                    <button
                      onClick={handleRefresh}
                      disabled={isPending}
                      className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700 hover:text-zinc-900 underline hover:no-underline cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                      <span>Sync articles now</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Section 1: Dashboard Stats */}
                <div className="p-6 border border-zinc-200 bg-white rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-800 border-b border-zinc-100 pb-3 mb-4">
                    <Activity className="h-4.5 w-4.5 text-zinc-500" />
                    <h4 className="font-serif font-bold text-sm uppercase tracking-wide">Platform Audit Stats</h4>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-zinc-600">
                        <FileText className="h-3.5 w-3.5 text-zinc-400" /> Total Audited Articles
                      </span>
                      <span className="font-bold bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200 text-zinc-700">{stats.total}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Verified True
                      </span>
                      <span className="font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{stats.trueCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-rose-700">
                        <XCircle className="h-3.5 w-3.5 text-rose-500" /> False/Misleading
                      </span>
                      <span className="font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">{stats.falseCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-amber-700">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Mixed Truth
                      </span>
                      <span className="font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">{stats.mixedCount}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-zinc-500">
                        <HelpCircle className="h-3.5 w-3.5 text-zinc-400" /> Unverified Claims
                      </span>
                      <span className="font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">{stats.unverifiedCount}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Methodology */}
                <div className="p-6 border border-zinc-200 bg-white rounded-2xl shadow-sm text-xs">
                  <div className="flex items-center gap-2 text-zinc-800 border-b border-zinc-100 pb-3 mb-3">
                    <BookOpen className="h-4.5 w-4.5 text-zinc-500" />
                    <h4 className="font-serif font-bold text-sm uppercase tracking-wide">Methodology</h4>
                  </div>
                  <p className="leading-relaxed text-zinc-600 mb-3">
                    TruthFeed tracks live news utilizing the Google News XML RSS feed. By clicking into details, the platform initiates a real-time factual audit powered by Gemini AI, generating key claim extractions and objective neutral summarizations.
                  </p>
                  <p className="font-semibold text-zinc-700 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-zinc-500" /> Checked by trusted AI models
                  </p>
                  <p className="leading-relaxed text-zinc-500 mt-1">
                    Verifiable claims are processed in strict objective analysis using neural models to dismantle biased framing.
                  </p>
                </div>

                {/* Section 3: Database & API */}
                <div className="p-6 border border-zinc-200 bg-white rounded-2xl shadow-sm text-xs">
                  <div className="flex items-center gap-2 text-zinc-800 border-b border-zinc-100 pb-3 mb-3">
                    <Database className="h-4.5 w-4.5 text-zinc-500" />
                    <h4 className="font-serif font-bold text-sm uppercase tracking-wide">Database &amp; API</h4>
                  </div>
                  <p className="leading-relaxed text-zinc-600 mb-2">
                    Every article and audit maps directly to our SQLite storage via Prisma ORM:
                  </p>
                  <code className="block p-2 bg-zinc-50 rounded-xl font-mono text-[9px] text-zinc-500 overflow-x-auto whitespace-pre border border-zinc-100">
{`model Article {
  id          String   @id
  title       String
  url         String   @unique
  summary     String?
  sourceName  String
  publishedAt DateTime
}`}
                  </code>
                </div>

              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-zinc-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Footer Masthead */}
          <div className="mb-1">
            <span className="font-serif text-2xl font-bold tracking-tight text-zinc-900">
              TruthFeed
            </span>
          </div>
          <p className="font-sans text-sm font-normal tracking-wide text-zinc-400 mb-6">
            Read the news. Know the truth.
          </p>
          <p className="text-xs text-zinc-400 mb-1">Designed for editorial integrity. All verified records are property of their respective fact-check organizations.</p>
          <p className="text-xs text-zinc-400">&copy; {new Date().getFullYear()} TruthFeed Initiative. Powered by Next.js and Prisma.</p>
        </div>
      </footer>
    </div>
  );
}
