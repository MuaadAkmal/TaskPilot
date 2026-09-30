import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes that do not require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized(.*)",
  "/api/tasks(.*)",
  "/api/users(.*)",
  "/api/documents(.*)",
  "/api/agent(.*)",
  "/api/auth/sync(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // If Clerk keys are placeholder/dev mode, allow transparent bypass
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey || publishableKey.includes("placeholder") || publishableKey.startsWith("pk_test_placeholder")) {
    return;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
