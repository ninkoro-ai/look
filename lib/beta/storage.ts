/**
 * Beta Mode 状态与数据隔离。
 * - Beta 用户使用独立的 IndexedDB 数据库（chuanda-walk-in-closet-beta），
 *   与普通用户数据完全隔离，可整体删除。
 * - 只存本地 localStorage 标识，不涉及任何服务端/云端。
 */

const ACTIVE_KEY = "chuanda-beta-active";
const USER_KEY = "chuanda-beta-user";

export const MAIN_DB_NAME = "chuanda-walk-in-closet";
export const BETA_DB_NAME = "chuanda-walk-in-closet-beta";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** 当前是否 Beta 测试用户 */
export function isBetaUser(): boolean {
  if (!canUseStorage()) return false;
  try {
    return window.localStorage.getItem(ACTIVE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Beta 用户标识（生成后持久化在本地） */
export function betaUserId(): string {
  if (!canUseStorage()) return "beta-unknown";
  try {
    const existing = window.localStorage.getItem(USER_KEY);
    if (existing) return existing;
    const id = `beta-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(USER_KEY, id);
    return id;
  } catch {
    return "beta-unknown";
  }
}

/** 当前使用的 IndexedDB 名称（Beta 隔离核心） */
export function currentDbName(): string {
  return isBetaUser() ? BETA_DB_NAME : MAIN_DB_NAME;
}

/** 进入 Beta 模式（由邀请链接 ?beta=1 触发，或实验室入口） */
export function enterBetaMode(): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACTIVE_KEY, "1");
  void betaUserId();
}

/**
 * 退出 Beta 模式。
 * @param deleteData 是否同时删除 Beta 数据库（不可恢复）
 */
export function exitBetaMode(deleteData: boolean): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACTIVE_KEY);
  if (deleteData) {
    window.localStorage.removeItem(USER_KEY);
  }
}

export function betaActiveKey(): string {
  return ACTIVE_KEY;
}
