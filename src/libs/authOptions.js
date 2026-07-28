import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember_me: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/login`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
              remember_me: credentials?.remember_me === "true",
            }),
          },
        );

        const result = await res.json();

        if (result.status && result.data?.user) {
          const { token, user } = result.data;
          return {
            id: user.id,
            name: user.full_name ?? user.name,
            customer_id: user.customer_id,
            email: user.email,
            verified_badge: user.verified_badge ?? false,
            email_verified: user.email_verified ?? false,
            token,
            expires_at: result.data.expires_at ?? null,
          };
        }

        return null;
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.customer_id = user.customer_id;
        token.email = user.email;
        token.verified_badge = user.verified_badge;
        token.email_verified = user.email_verified;
        token.token = user.token;
        token.expires_at = user.expires_at;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.customer_id = token.customer_id;
      session.user.email = token.email;
      session.user.verified_badge = token.verified_badge;
      session.user.email_verified = token.email_verified;
      session.user.token = token.token;
      session.user.expires_at = token.expires_at;
      return session;
    },
  },

  pages: { signIn: "/login" },

  secret: process.env.NEXTAUTH_SECRET,
};
