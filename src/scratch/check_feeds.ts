import Parser from "rss-parser";

async function checkFeeds() {
  const parser = new Parser();
  const FEED_URLS = [
    { name: "main", url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en" },
    { name: "world", url: "https://news.google.com/rss/sections/CAAqJggKIiBDQkFTRWdvSUwyMHZNR3h6TVd3U0dnd0pJZ05FUVNnQVAB?hl=en-US&gl=US&ceid=US:en" },
    { name: "business", url: "https://news.google.com/rss/sections/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVd4b0dnd0pJZ05FUVNnQVAB?hl=en-US&gl=US&ceid=US:en" },
    { name: "tech_topic", url: "https://news.google.com/news/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en" },
    { name: "world_topic", url: "https://news.google.com/news/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en" }
  ];

  for (const f of FEED_URLS) {
    try {
      const feed = await parser.parseURL(f.url);
      console.log(`Feed [${f.name}]: SUCCESS, items count: ${feed.items?.length || 0}`);
    } catch (err: any) {
      console.error(`Feed [${f.name}]: FAILED with error: ${err.message || String(err)}`);
    }
  }
}

checkFeeds();
