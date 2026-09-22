import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const DEV_COOKIE_NAME = "campusvote_ballot";
const PROD_COOKIE_NAME = "__Host-campusvote_ballot";

function cookieName() {
  return process.env.NODE_ENV === "production"
    ? PROD_COOKIE_NAME
    : DEV_COOKIE_NAME;
}

export function createBallotToken() {
  const rawToken = randomBytes(32).toString("base64url");
  return { rawToken, tokenHash: hashBallotToken(rawToken) };
}

export function hashBallotToken(rawToken: string) {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function setBallotTokenCookie<T extends NextResponse>(
  response: T,
  rawToken: string,
  expiresAt: string,
) {
  response.cookies.set(cookieName(), rawToken, {
    expires: new Date(expiresAt),
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    priority: "high",
  });
  return response;
}

export async function getBallotTokenHash() {
  const rawToken = (await cookies()).get(cookieName())?.value;
  return rawToken ? hashBallotToken(rawToken) : null;
}

export function clearBallotTokenCookie<T extends NextResponse>(response: T) {
  response.cookies.set(cookieName(), "", {
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    priority: "high",
  });
  return response;
}
