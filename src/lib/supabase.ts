import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;
let activeSessionPromise: Promise<any> | null = null;
let activeUserPromise: Promise<any> | null = null;

// Standard browser client for client components (returns a client-side singleton)
export function createClientComponentClient() {
  if (typeof window === "undefined") {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

    // Cache original methods
    const originalGetSession = browserClient.auth.getSession.bind(browserClient.auth);
    const originalGetUser = browserClient.auth.getUser.bind(browserClient.auth);

    // Deduplicate getSession calls to prevent duplicate token refresh requests
    browserClient.auth.getSession = async (...args: any[]) => {
      if (activeSessionPromise) {
        return activeSessionPromise;
      }
      activeSessionPromise = originalGetSession(...args).finally(() => {
        activeSessionPromise = null;
      });
      return activeSessionPromise;
    };

    // Deduplicate getUser calls to prevent duplicate token verification requests
    browserClient.auth.getUser = async (...args: any[]) => {
      if (activeUserPromise) {
        return activeUserPromise;
      }
      activeUserPromise = originalGetUser(...args).finally(() => {
        activeUserPromise = null;
      });
      return activeUserPromise;
    };
  }

  return browserClient;
}

// Default export for client-side queries
export const supabase = typeof window !== "undefined" 
  ? createClientComponentClient() 
  : createBrowserClient(supabaseUrl, supabaseAnonKey);
