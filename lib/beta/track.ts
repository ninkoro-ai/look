import { betaUserId, isBetaUser } from "@/lib/beta/storage";
import { putBetaEvent } from "@/lib/db";
import { uid } from "@/lib/format";
import type { BetaEventName, BetaEventRecord } from "@/lib/beta/events";

/**
 * Beta 埋点：只记录行为统计，绝不记录照片/姓名/手机号等隐私。
 * 非 Beta 用户调用为 no-op，不影响普通用户。
 */
export async function track(
  event: BetaEventName,
  data?: Omit<Partial<BetaEventRecord>, "id" | "betaUserId" | "createdAt" | "event">,
): Promise<void> {
  if (!isBetaUser()) return;
  try {
    await putBetaEvent({
      id: uid(),
      betaUserId: betaUserId(),
      createdAt: new Date().toISOString(),
      event,
      ...data,
    });
  } catch {
    // 埋点失败不影响主流程
  }
}
