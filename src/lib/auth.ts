import "server-only";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "crm_session";
const SESSION_TTL = "30d";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET no está configurado en .env");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export const getCurrentUser = cache(async () => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autenticado");
  return user;
}

/** Like requireUser, but sends non-paying accounts to the paywall before rendering the page. */
export async function requireActiveUser() {
  const user = await requireUser();
  if (user.subscriptionStatus !== "ACTIVE" && user.subscriptionStatus !== "EXEMPT") {
    redirect("/suscripcion");
  }
  return user;
}

/**
 * Confirms a pending email-verification token: marks the account verified,
 * clears the token, and starts a session. Called directly from the
 * /verificar-email/[token] server component (not a form action).
 */
export async function verifyEmailToken(token: string): Promise<"ok" | "invalid" | "expired"> {
  const user = await prisma.user.findUnique({ where: { emailVerificationToken: token } });
  if (!user) return "invalid";
  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    return "expired";
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  });

  await createSession(user.id);
  return "ok";
}
