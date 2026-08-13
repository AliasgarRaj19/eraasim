export type AdminNavigationItem = {
  label: string;
  href?: string;
  permission?: string;
  children?: readonly AdminNavigationItem[];
};

export const adminNavigation: readonly AdminNavigationItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  {
    label: "Blog",
    permission: "blog.posts.view",
    children: [
      { label: "New Post", href: "/blog/new", permission: "blog.posts.create" },
      { label: "Draft Posts", href: "/blog/drafts", permission: "blog.posts.view" },
      { label: "All Posts", href: "/blog", permission: "blog.posts.view" },
      { label: "Deleted Posts", href: "/blog/deleted", permission: "blog.posts.view_deleted" },
    ],
  },
  {
    label: "Category",
    permission: "categories.view",
    children: [
      { label: "New Category", href: "/categories/new", permission: "categories.create" },
      { label: "List Categories", href: "/categories", permission: "categories.view" },
    ],
  },
  {
    label: "Staff",
    permission: "staff.view",
    children: [
      { label: "Add Staff", href: "/staff/new", permission: "staff.create" },
      { label: "Staff List", href: "/staff", permission: "staff.view" },
      { label: "Roles", href: "/staff/roles", permission: "roles.view" },
      { label: "Permissions", href: "/staff/permissions", permission: "permissions.view" },
    ],
  },
  { label: "Analytics", href: "/analytics", permission: "analytics.view" },
  {
    label: "Pages",
    permission: "pages.view",
    children: [
      { label: "Home Page", href: "/pages/home", permission: "pages.home.view" },
      { label: "Create Page", href: "/pages/new", permission: "pages.create" },
      { label: "Pages List", href: "/pages", permission: "pages.view" },
    ],
  },
  { label: "Uploads", href: "/uploads", permission: "uploads.view" },
  { label: "Header", href: "/header", permission: "header.view" },
  { label: "Logs", href: "/logs", permission: "logs.view" },
  { label: "Sitemap", href: "/sitemap", permission: "sitemap.view" },
  { label: "Footer", href: "/footer/content", permission: "footer.view" },
];

export function findNavigationItem(href: string) {
  for (const item of adminNavigation) {
    if (item.href === href) return item;
    const child = item.children?.find((candidate) => candidate.href === href);
    if (child) return child;
  }
  return undefined;
}

export function filterNavigation(
  isMasterAdmin: boolean,
  permissionKeys: ReadonlySet<string>,
): AdminNavigationItem[] {
  const canSee = (permission?: string) => isMasterAdmin || !permission || permissionKeys.has(permission);

  return adminNavigation.flatMap((item) => {
    if (!item.children) return canSee(item.permission) ? [item] : [];

    const children = item.children.filter((child) => canSee(child.permission));
    return children.length ? [{ ...item, children }] : [];
  });
}
