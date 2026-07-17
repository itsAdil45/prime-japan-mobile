// lib/authOptions.js (or authOptions.ts)
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // calls your Laravel API's login endpoint, returns a user object
        // (or null if invalid) — this is what actually issues session.user.token
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
          },
        );
        const data = await res.json();
        if (res.ok && data?.token) return { ...data.user, token: data.token };
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.user = user; // carries the token/user through
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
