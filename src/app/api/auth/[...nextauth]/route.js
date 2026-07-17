import NextAuth from "next-auth";
import { authOptions } from "@/libs/authOptions"; // or wherever your config lives

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
