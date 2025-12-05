export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
}

export interface MenuSection {
  title?: string;
  items: MenuItem[];
}
