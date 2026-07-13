import { guestFeedbackErrorResponse } from "@/lib/guest-feedback/errors";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

/** 現行仕様: ゲストは DB へフィードバックを書き込めない。 */
export async function POST(_request: Request, _context: RouteContext) {
  return guestFeedbackErrorResponse("guest_feedback_disabled");
}
