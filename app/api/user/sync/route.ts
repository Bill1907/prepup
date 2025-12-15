import { auth, currentUser } from "@clerk/nextjs/server";
import { graphqlClient, ENSURE_USER_EXISTS } from "@/lib/graphql";

/**
 * POST /api/user/sync
 * Ensure the current user exists in the database
 * This is a safety mechanism in case Clerk webhooks fail or are delayed
 */
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user email from Clerk if available
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || null;

    // Ensure user exists (idempotent - safe to call multiple times)
    await graphqlClient.request(ENSURE_USER_EXISTS, {
      userId,
      email: userEmail,
    });

    return Response.json({ success: true, userId });
  } catch (error) {
    console.error("Error syncing user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
