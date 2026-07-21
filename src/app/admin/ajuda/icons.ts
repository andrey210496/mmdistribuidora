import {
  Rocket,
  Store,
  Keyboard,
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  PackagePlus,
  FileDigit,
  CreditCard,
  ShieldCheck,
  Globe,
  LifeBuoy,
  BookOpen,
} from "lucide-react";

/** Icone de cada capitulo. O conteudo guarda so o nome (e dado, nao componente). */
const MAP = {
  Rocket,
  Store,
  Keyboard,
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  PackagePlus,
  FileDigit,
  CreditCard,
  ShieldCheck,
  Globe,
  LifeBuoy,
} as const;

export function chapterIcon(name: string): typeof BookOpen {
  return (MAP as Record<string, typeof BookOpen>)[name] ?? BookOpen;
}
