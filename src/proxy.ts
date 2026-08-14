import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/referrers/:path*",
    "/referrals/:path*",
    "/payouts/:path*",
    "/api/payouts/:path*",
  ],
};
