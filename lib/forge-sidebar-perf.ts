import {
  forgePerfLog,
  forgePerfMark,
  forgePerfMeasure,
} from "@/lib/forge-perf-log";

type PendingSidebarNav = {
  href: string;
  mark: string;
};

let pendingSidebarNav: PendingSidebarNav | null = null;

function normalizeSidebarHref(href: string | null | undefined): string | null {
  if (!href) {
    return null;
  }

  try {
    const url = new URL(href, "http://local");
    return url.pathname;
  } catch {
    return href.split("?")[0] ?? href;
  }
}

export function forgeSidebarPerfClick(href: string): void {
  const path = normalizeSidebarHref(href);
  if (!path || path.startsWith("#")) {
    return;
  }

  const mark = `sidebar-click:${Date.now()}`;
  pendingSidebarNav = { href: path, mark };
  forgePerfMark(mark);
  forgePerfLog("sidebar.click", { href: path });
}

export function forgeSidebarPerfRouteStart(route: string, source?: string): void {
  forgePerfLog("sidebar.route-start", { route, source, pendingHref: pendingSidebarNav?.href });

  if (pendingSidebarNav) {
    forgePerfMeasure("sidebar.click-to-route-start", pendingSidebarNav.mark, {
      href: pendingSidebarNav.href,
      route,
      source,
    });
  }
}

export function forgeSidebarPerfShellReady(route: string, shell: "player" | "studio"): void {
  forgePerfLog("sidebar.shell-ready", { route, shell });

  if (pendingSidebarNav) {
    forgePerfMeasure("sidebar.click-to-shell-ready", pendingSidebarNav.mark, {
      href: pendingSidebarNav.href,
      route,
      shell,
    });
  }
}

export function forgeSidebarPerfContentSkeleton(
  route: string,
  reason: string,
  detail?: Record<string, unknown>,
): void {
  forgePerfLog("sidebar.content-skeleton", { route, reason, ...detail });
}

export function forgeSidebarPerfContentReady(
  route: string,
  detail?: Record<string, unknown>,
): void {
  forgePerfLog("sidebar.content-ready", { route, ...detail });

  if (pendingSidebarNav) {
    forgePerfMeasure("sidebar.click-to-content-ready", pendingSidebarNav.mark, {
      href: pendingSidebarNav.href,
      route,
      ...detail,
    });
    pendingSidebarNav = null;
  }
}

export function forgeSidebarPerfNavClickCapture(event: {
  target: EventTarget | null;
}): void {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const anchor = target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) {
    return;
  }

  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return;
  }

  forgeSidebarPerfClick(anchor.getAttribute("href") ?? anchor.pathname);
}
