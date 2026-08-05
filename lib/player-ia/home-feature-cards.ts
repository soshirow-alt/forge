import {
  AppWindow,
  Gamepad2,
  Headphones,
  Upload,
  type LucideIcon,
} from "lucide-react";

export type PlayerIaHomeFeatureCard = {
  id: "play" | "listen" | "service" | "publish";
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

/** Home「Forgeでできること」— カテゴリ直接導線（用途 filter なし）。 */
export const PLAYER_IA_HOME_FEATURE_CARDS: readonly PlayerIaHomeFeatureCard[] = [
  {
    id: "play",
    title: "遊ぶ",
    description: "ゲームを探して遊ぶ",
    href: "/search?category=game",
    icon: Gamepad2,
  },
  {
    id: "listen",
    title: "聞く",
    description: "音楽・音声作品を探して聞く",
    href: "/search?category=audio",
    icon: Headphones,
  },
  {
    id: "service",
    title: "サービスを探す",
    description: "サービスやアプリを探して試す",
    href: "/search?category=service-app",
    icon: AppWindow,
  },
  {
    id: "publish",
    title: "掲載する",
    description: "作品を掲載して届ける",
    href: "/studio/submit",
    icon: Upload,
  },
] as const;
