import { groq } from "../lib/groq";

async function main() {
  try {
    const list = await groq.models.list();
    console.log("Available Groq Models:");
    console.log(list.data.map(m => m.id));
  } catch (error) {
    console.error("Error listing Groq models:", error);
  }
}

main();
