"use client";

import { useState } from "react";
import { isBetaUser } from "@/lib/beta/storage";
import { track } from "@/lib/beta/track";

type Sentiment = "like" | "neutral" | "dislike";

/** Beta 模式轻量反馈入口（非 Beta 用户不渲染） */
export function BetaFeedback() {
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  if (!isBetaUser()) return null;

  const submit = () => {
    void track("feedback_submitted", {
      feedback: sentiment ?? undefined,
      feedbackText: text.trim() || undefined,
      page: "home",
    });
    setSent(true);
  };

  if (sent) {
    return (
      <section className="mt-6 px-5">
        <div className="rounded-3xl border border-line bg-surface p-4 text-center text-sm text-muted">
          已收到你的反馈，谢谢参与 Beta 测试 🌱
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 px-5">
      <div className="rounded-3xl border border-line bg-surface p-4">
        <p className="text-center text-[13px] font-medium text-ink">今天推荐怎么样？</p>
        <div className="mt-3 flex justify-center gap-3">
          {(
            [
              ["like", "😊", "喜欢"],
              ["neutral", "😐", "一般"],
              ["dislike", "😞", "不喜欢"],
            ] as const
          ).map(([value, emoji, label]) => (
            <button
              key={value}
              onClick={() => setSentiment(value)}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-4 py-2 text-xs transition ${
                sentiment === value ? "border-accent bg-accent-soft text-accent" : "border-line text-muted"
              }`}
            >
              <span className="text-xl">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="想说点什么？（可选）"
          rows={2}
          className="mt-3 w-full rounded-2xl border border-line bg-sand/50 px-3 py-2 text-xs text-ink outline-none placeholder:text-muted/60 focus:border-accent"
        />
        <button
          onClick={submit}
          disabled={!sentiment}
          className="mt-2 w-full rounded-full bg-ink py-2.5 text-sm text-white disabled:opacity-40"
        >
          提交反馈
        </button>
      </div>
    </section>
  );
}
