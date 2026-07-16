import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {PrismaAdapter} from "@auth/prisma-adapter";
import {prisma} from "@/lib/prisma";

// Google is the only provider: credentials come from AUTH_GOOGLE_ID /
// AUTH_GOOGLE_SECRET, which Auth.js picks up by convention (see .env.local).
// With an adapter present the session strategy defaults to "database", so
// sessions live in the Session table rather than a JWT.
export const {handlers, auth, signIn, signOut} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    // The default session exposes name/email/image but not the row id, and
    // every appointment query scopes on that id — so copy it across.
    session({session, user}) {
      session.user.id = user.id;
      return session;
    },
  },
});
