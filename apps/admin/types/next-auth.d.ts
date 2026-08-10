import "next-auth";

declare module "next-auth" {
  interface User { isMasterAdmin: boolean; }
  interface Session { user: { id: string; email: string; name?: string | null; isMasterAdmin: boolean; }; }
}

declare module "next-auth/jwt" {
  interface JWT { isMasterAdmin?: boolean; }
}
