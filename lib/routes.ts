export const mainNavigation = [
  { href: "/login", label: "Login", tone: "default" },
  { href: "/panel", label: "Panel", tone: "default" },
  { href: "/admin", label: "Admin", tone: "accent" },
] as const;

export const protectedPrefixes = ["/panel", "/admin"];
