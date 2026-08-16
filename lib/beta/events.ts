/** Phase 6D Beta Analytics 事件定义（仅行为数据，禁止任何照片/身份信息） */

export type BetaEventName =
  | "session_started"
  | "wardrobe_onboarding_started"
  | "garment_upload_started"
  | "garment_detection_completed"
  | "garment_added"
  | "daily_outfit_viewed"
  | "dress_page_viewed"
  | "outfit_favorited"
  | "vton_clicked"
  | "feedback_submitted"
  | "beta_data_deleted";

export interface BetaEventRecord {
  id: string;
  betaUserId: string;
  createdAt: string;
  event: BetaEventName;
  source?: "outfit_photo" | "single_item";
  detectedCount?: number;
  confirmedCount?: number;
  category?: string;
  feedback?: "like" | "neutral" | "dislike";
  feedbackText?: string;
  page?: string;
}
