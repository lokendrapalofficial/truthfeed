"use server";

export interface MappedFactCheck {
  claimText: string;
  publisherName: string;
  textualRating: string;
  reviewTitle: string;
  reviewUrl: string;
}

export async function fetchFactChecks(searchQuery: string) {
  try {
    const apiKey = process.env.FACT_CHECK_API_KEY;

    // Graceful offline mock fallback if key is missing to ensure zero-downtime demos
    if (!apiKey || apiKey.trim() === "" || apiKey === "MOCK_KEY") {
      console.warn("Using mock Fact-Checks because FACT_CHECK_API_KEY is not defined.");
      
      // Simulate network request delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const queryLower = searchQuery.toLowerCase();
      
      // High-fidelity structured mock matches for typical news topics to make testing beautiful!
      if (queryLower.includes("climate") || queryLower.includes("geneva") || queryLower.includes("accord")) {
        const mockReviews: MappedFactCheck[] = [
          {
            claimText: "120 countries signed a binding emissions treaty in Geneva.",
            publisherName: "Reuters Fact Check",
            textualRating: "True",
            reviewTitle: "Geneva Accord Emissions Commitments Fact-Check",
            reviewUrl: "https://example.com/factcheck/reuters-geneva-accord",
          },
          {
            claimText: "The climate treaty binds major global economies to enforceable reductions.",
            publisherName: "PolitiFact",
            textualRating: "Mostly True",
            reviewTitle: "Analyzing binding status of global carbon targets",
            reviewUrl: "https://example.com/factcheck/politifact-emissions",
          }
        ];
        return { success: true, reviews: mockReviews, isMock: true };
      }

      if (queryLower.includes("mosquito") || queryLower.includes("mosquitoes") || queryLower.includes("google")) {
        const mockReviews: MappedFactCheck[] = [
          {
            claimText: "Google plans to release 32 million genetically modified mosquitoes in California.",
            publisherName: "Snopes",
            textualRating: "Mostly False",
            reviewTitle: "Did Google Apply to Release 32 Million Modified Mosquitoes?",
            reviewUrl: "https://example.com/factcheck/snopes-mosquitoes",
          },
          {
            claimText: "California released sterile mosquitoes in localized disease eradication programs.",
            publisherName: "AP News Fact Check",
            textualRating: "Mixed",
            reviewTitle: "Verifying sterile mosquito release programs in Florida & California",
            reviewUrl: "https://example.com/factcheck/ap-mosquitoes",
          }
        ];
        return { success: true, reviews: mockReviews, isMock: true };
      }

      if (queryLower.includes("tax") || queryLower.includes("deficit") || queryLower.includes("overhaul")) {
        const mockReviews: MappedFactCheck[] = [
          {
            claimText: "The federal tax reform bill lowers income tax rates for 90% of working families.",
            publisherName: "FactCheck.org",
            textualRating: "Misleading",
            reviewTitle: "Deficit impact and tax bracket adjustments analyzed",
            reviewUrl: "https://example.com/factcheck/factcheck-tax",
          }
        ];
        return { success: true, reviews: mockReviews, isMock: true };
      }

      if (queryLower.includes("ebola") || queryLower.includes("outbreak") || queryLower.includes("moderna")) {
        const mockReviews: MappedFactCheck[] = [
          {
            claimText: "Ebola outbreak spreading in Africa is far worse than official statistics.",
            publisherName: "BBC Reality Check",
            textualRating: "True",
            reviewTitle: "Verifying Ebola infection numbers in Central Africa",
            reviewUrl: "https://example.com/factcheck/bbc-ebola",
          }
        ];
        return { success: true, reviews: mockReviews, isMock: true };
      }

      // Default empty state for non-viral topics
      return { success: true, reviews: [], isMock: true };
    }

    // Active Google Fact Check Tools API query
    const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(
      searchQuery
    )}&key=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API returned HTTP error status ${response.status}`,
      };
    }

    const data = await response.json();
    
    if (!data.claims || data.claims.length === 0) {
      return { success: true, reviews: [] };
    }

    const mappedReviews: MappedFactCheck[] = [];

    for (const claim of data.claims) {
      if (!claim.claimReview || claim.claimReview.length === 0) continue;
      
      const review = claim.claimReview[0];
      mappedReviews.push({
        claimText: claim.text || "",
        publisherName: review.publisher?.name || "Unknown Publisher",
        textualRating: review.textualRating || "Unrated",
        reviewTitle: review.title || "Claim Review Report",
        reviewUrl: review.url || "#",
      });
    }

    return { success: true, reviews: mappedReviews, isMock: false };
  } catch (error: any) {
    console.error("Error executing fact check lookup:", error);
    return { success: false, error: error.message || String(error) };
  }
}
