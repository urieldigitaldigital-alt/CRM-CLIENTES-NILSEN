import "server-only";
import { WhopClient } from "@whop/sdk";

function getApiKey() {
  const key = process.env.WHOP_API_KEY;
  if (!key) throw new Error("WHOP_API_KEY no está configurado en .env");
  return key;
}

function getClient() {
  return new WhopClient({ token: getApiKey() });
}

export async function cancelMembership(membershipId: string): Promise<void> {
  const client = getClient();
  await client.memberships.cancel({ id: membershipId });
}
