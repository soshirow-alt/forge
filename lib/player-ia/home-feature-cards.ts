import {
  AppWindow,
  Box,
  Gamepad2,
  Headphones,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ProjectCategoryId } from "@/lib/project-categories";

export type PlayerIaHomeCategoryCta =
  | {
      id: "spotlight";
      label: "注目作品を見る";
      kind: "link";
      href: string;
    }
  | {
      id: "spotlight";
      label: "注目作品を見る";
      kind: "coming_soon";
    }
  | {
      id: "search";
      label: "条件で探す";
      kind: "link";
      href: string;
    };

export type PlayerIaHomeFeatureCard = {
  id: ProjectCategoryId;
  title: string;
  description: string;
  icon: LucideIcon;
  ctas: readonly PlayerIaHomeCategoryCta[];
};

export type PublicCategoryPresence = Record<ProjectCategoryId, boolean>;

export function emptyPublicCategoryPresence(): PublicCategoryPresence {
  return {
    game: false,
    audio: false,
    asset: false,
    "dev-tool": false,
    "service-app": false,
  };
}

/** Spotlight becomes a live /home/[category] link when that category has ≥1 public work. */
export function resolvePlayerIaHomeFeatureCards(
  presence: PublicCategoryPresence,
): PlayerIaHomeFeatureCard[] {
  return PLAYER_IA_HOME_FEATURE_CARDS.map((card) => ({
    ...card,
    ctas: card.ctas.map((cta) => {
      if (cta.id !== "spotlight") return cta;
      if (presence[card.id]) {
        return {
          id: "spotlight",
          label: "注目作品を見る",
          kind: "link",
          href: `/home/${card.id}`,
        };
      }
      return {
        id: "spotlight",
        label: "注目作品を見る",
        kind: "coming_soon",
      };
    }),
  }));
}

/** Home「作品を見つける・試す」— 5カテゴリ × 2導線（カード全体は非リンク）。 */
export const PLAYER_IA_HOME_FEATURE_CARDS: readonly PlayerIaHomeFeatureCard[] = [
  {
    id: "game",
    title: "ゲーム",
    description: "完成前のゲームを遊んでみる",
    icon: Gamepad2,
    ctas: [
      {
        id: "spotlight",
        label: "注目作品を見る",
        kind: "link",
        href: "/home/game",
      },
      {
        id: "search",
        label: "条件で探す",
        kind: "link",
        href: "/search?category=game",
      },
    ],
  },
  {
    id: "audio",
    title: "音楽・音声",
    description: "音楽・音声作品を探して試す",
    icon: Headphones,
    ctas: [
      {
        id: "spotlight",
        label: "注目作品を見る",
        kind: "coming_soon",
      },
      {
        id: "search",
        label: "条件で探す",
        kind: "link",
        href: "/search?category=audio",
      },
    ],
  },
  {
    id: "asset",
    title: "アセット",
    description: "アセット作品を探して試す",
    icon: Box,
    ctas: [
      {
        id: "spotlight",
        label: "注目作品を見る",
        kind: "coming_soon",
      },
      {
        id: "search",
        label: "条件で探す",
        kind: "link",
        href: "/search?category=asset",
      },
    ],
  },
  {
    id: "dev-tool",
    title: "開発ツール",
    description: "開発ツールを探して試す",
    icon: Wrench,
    ctas: [
      {
        id: "spotlight",
        label: "注目作品を見る",
        kind: "coming_soon",
      },
      {
        id: "search",
        label: "条件で探す",
        kind: "link",
        href: "/search?category=dev-tool",
      },
    ],
  },
  {
    id: "service-app",
    title: "サービス",
    description: "サービスやアプリを探して試す",
    icon: AppWindow,
    ctas: [
      {
        id: "spotlight",
        label: "注目作品を見る",
        kind: "coming_soon",
      },
      {
        id: "search",
        label: "条件で探す",
        kind: "link",
        href: "/search?category=service-app",
      },
    ],
  },
] as const;
