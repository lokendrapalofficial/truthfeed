import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Display Name",
      credentials: {
        username: { label: "Display Name", type: "text", placeholder: "e.g. John Doe" },
      },
      async authorize(credentials) {
        if (!credentials?.username || credentials.username.trim() === "") {
          return null;
        }

        const name = credentials.username.trim();

        try {
          // Find or create user record in the SQLite database
          let user = await prisma.user.findUnique({
            where: { name },
          });

          if (!user) {
            user = await prisma.user.create({
              data: { name },
            });
            console.log(`Created new User record: "${user.name}" with ID ${user.id}`);
          } else {
            console.log(`Found existing User record: "${user.name}" with ID ${user.id}`);
          }

          return {
            id: user.id,
            name: user.name,
          };
        } catch (error) {
          console.error("Error authorizing user in credentials provider:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/", // redirect to homepage
  },
  secret: process.env.NEXTAUTH_SECRET || "truthfeed-super-secret-secret",
};
