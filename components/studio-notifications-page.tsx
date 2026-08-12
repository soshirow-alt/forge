"use client";

import { NotificationsV0Page } from "@/components/notifications-v0-page";

/**
 * Studio surface for shared notification list content.
 * Player canonical remains `/notifications`; item click targets are unchanged.
 */
export function StudioNotificationsPage() {
  return <NotificationsV0Page surface="studio" />;
}
