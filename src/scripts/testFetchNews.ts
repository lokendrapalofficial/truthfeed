import { fetchNews } from "../app/actions/fetchNews";

async function main() {
  console.log("Triggering RSS Fetch...");
  const res = await fetchNews();
  console.log("RSS Fetch result:", res);
}

main().catch(console.error);
