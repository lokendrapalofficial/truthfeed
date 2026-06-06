import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sources = [
  {
    name: "Reuters",
    bias: "CENTER",
    credibility: "VERY_HIGH",
    description: "Highly regarded global news agency known for its objective, factual, and neutral reporting style.",
  },
  {
    name: "AP News",
    bias: "CENTER",
    credibility: "VERY_HIGH",
    description: "The Associated Press is an independent global news cooperative focused on unbiased, factual storytelling.",
  },
  {
    name: "BBC News",
    bias: "CENTER",
    credibility: "VERY_HIGH",
    description: "The British Broadcasting Corporation is a globally respected public broadcaster providing high-quality, verified journalism.",
  },
  {
    name: "Bloomberg",
    bias: "CENTER",
    credibility: "VERY_HIGH",
    description: "A premier international news and financial data publisher with a rigorous focus on accuracy and quantitative reporting.",
  },
  {
    name: "CNBC",
    bias: "CENTER",
    credibility: "HIGH",
    description: "A leading business and financial news network reporting extensively on markets, companies, and economy with strong credibility.",
  },
  {
    name: "NPR",
    bias: "LEAN_LEFT",
    credibility: "HIGH",
    description: "National Public Radio offers high-quality editorial reporting and long-form analytical stories with a minor left-of-center lean.",
  },
  {
    name: "The New York Times",
    bias: "LEAN_LEFT",
    credibility: "HIGH",
    description: "A preeminent American daily newspaper recognized for comprehensive investigative journalism, leaning left editorially.",
  },
  {
    name: "The Guardian",
    bias: "LEAN_LEFT",
    credibility: "HIGH",
    description: "A major British progressive daily newspaper, highly credible and focused on human rights, politics, and social justice.",
  },
  {
    name: "Politico",
    bias: "LEAN_LEFT",
    credibility: "HIGH",
    description: "A prominent political journalism publisher covering policy and government details with quick breaking updates.",
  },
  {
    name: "HuffPost",
    bias: "LEFT",
    credibility: "MEDIUM",
    description: "An editorially progressive news site specializing in commentary, cultural critiques, and advocacy-oriented journalism.",
  },
  {
    name: "CNN",
    bias: "LEFT",
    credibility: "MEDIUM",
    description: "A prominent cable news channel and digital platform with extensive breaking coverage, leaning left editorially.",
  },
  {
    name: "USA TODAY",
    bias: "CENTER",
    credibility: "HIGH",
    description: "A widely circulated national newspaper providing accessible, concise, and highly factual general interest news.",
  },
  {
    name: "CBS News",
    bias: "LEAN_LEFT",
    credibility: "HIGH",
    description: "A trusted major network news division delivering consistent broadcast reporting and factual focus.",
  },
  {
    name: "NBC News",
    bias: "LEAN_LEFT",
    credibility: "HIGH",
    description: "A leading television news division covering domestic and international events with a highly factual record.",
  },
  {
    name: "Forbes",
    bias: "CENTER",
    credibility: "HIGH",
    description: "A global media company focusing on business, technology, leadership, and science reporting with sound integrity.",
  },
  {
    name: "The Wall Street Journal",
    bias: "LEAN_RIGHT",
    credibility: "HIGH",
    description: "A highly credible financial daily newspaper with world-class reporting, leaning right in its editorial and opinion pages.",
  },
  {
    name: "Fox News",
    bias: "RIGHT",
    credibility: "MEDIUM",
    description: "A prominent cable news channel with highly popular right-leaning opinion commentary and factual breaking reportage.",
  },
  {
    name: "Daily Mail",
    bias: "RIGHT",
    credibility: "LOW",
    description: "A British tabloid newspaper with a large audience, often criticized for sensationalism and low factual verification.",
  },
  {
    name: "Breitbart",
    bias: "RIGHT",
    credibility: "LOW",
    description: "A highly partisan conservative news website characterized by sensationalist headlines and occasional misinformation.",
  },
];

async function main() {
  console.log("Start seeding Source Credibility & Media Bias directory...");
  for (const s of sources) {
    const source = await prisma.source.upsert({
      where: { name: s.name },
      update: {
        bias: s.bias as any,
        credibility: s.credibility as any,
        description: s.description,
      },
      create: {
        name: s.name,
        bias: s.bias as any,
        credibility: s.credibility as any,
        description: s.description,
      },
    });
    console.log(`Seeded source: ${source.name} [Bias: ${source.bias}, Credibility: ${source.credibility}]`);
  }
  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
