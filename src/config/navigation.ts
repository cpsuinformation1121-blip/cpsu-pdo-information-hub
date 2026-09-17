export type NavigationItem = {
  label: string;
  path: string;
};

export const publicNavigation: readonly NavigationItem[] = [
  { label: "Home", path: "/" },
  { label: "Repository", path: "/repository" },
  { label: "Forms", path: "/repository?section=forms" },
  { label: "Physical Performance", path: "/accomplishments" },
  { label: "OPCR", path: "/opcr" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];
