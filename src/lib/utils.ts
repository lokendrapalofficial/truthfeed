export interface SmartDateResult {
  text: string;
  showRedDot: boolean;
}

export function formatSmartDate(dateInput: string | Date | number): SmartDateResult {
  const date = new Date(dateInput);
  const now = new Date();
  
  if (isNaN(date.getTime())) {
    return { text: String(dateInput), showRedDot: false };
  }

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  // 1. Less than 60 minutes
  if (diffMins < 60 && diffMins >= 0) {
    const minVal = Math.max(1, diffMins);
    return {
      text: `${minVal}m ago`,
      showRedDot: minVal < 15,
    };
  }

  // Time formatter: "H:MM AM/PM"
  const formatTime = (d: Date) => {
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should be 12
    return `${hours}:${minutes} ${ampm}`;
  };

  // Check if today
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return {
      text: `Today at ${formatTime(date)}`,
      showRedDot: false,
    };
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return {
      text: `Yesterday at ${formatTime(date)}`,
      showRedDot: false,
    };
  }

  // Older: "Mon DD, YYYY" (e.g. "Jun 04, 2026")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedDate = `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;

  return {
    text: formattedDate,
    showRedDot: false,
  };
}

export function getArticleCategory(title: string, summary: string): string {
  const t = `${title} ${summary}`.toLowerCase();
  if (t.match(/\b(india|indian|delhi|mumbai|bengaluru|modi|gandhi|bollywood|rupee|bjp|isro|hindustan|cbi|lok sabha|rajya sabha)\b/)) return "india";
  if (t.match(/\b(local|weather|city|traffic|metro|municipal|mayor|resident|neighborhood|community|district|highway|commute|station)\b/)) return "local";
  if (t.match(/\b(apple|google|microsoft|ai|meta|nvidia|intel|openai|semiconductor|chip|cybersecurity|software|tech|technology|phone|quantum|robot|internet|app|mobile)\b/)) return "technology";
  if (t.match(/\b(health|cancer|vaccine|virus|covid|fda|medical|disease|drug|outbreak|clinical|hospital|patient|treatment|doctor|nurse|surgery|mental|wellness|diet)\b/)) return "health";
  if (t.match(/\b(space|mars|nasa|science|telescope|scientific|gene|dna|chemistry|physics|universe|planet|galaxy|scientist)\b/)) return "science";
  if (t.match(/\b(market|finance|stock|stocks|wall st|economy|economic|business|ceo|company|billion|inflation|fed|rate|interest|bank|rupee|investment|profit|revenue)\b/)) return "business";
  if (t.match(/\b(movie|film|actor|actress|bollywood|hollywood|music|singer|song|album|celebrity|oscar|grammy|netflix|cinema|show|theatre|concert|star|pop)\b/)) return "entertainment";
  if (t.match(/\b(sports|football|basketball|soccer|baseball|tennis|olympics|nfl|nba|cup|game|stadium|athlete|championship|tournament|cricket|ipl|batsman|bowler|wicket|match)\b/)) return "sports";
  return "world";
}
