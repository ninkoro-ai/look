"use client";

import { useRef, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet";
import { IconCamera, IconRefresh } from "@/components/icons";
import { demoUserModel } from "@/lib/seed";
import { standardizeModelPhoto, type ModelPhoto } from "@/lib/pose";
import { useAppData } from "@/hooks/useAppData";

type Phase = "menu" | "detecting" | "preview" | "error";

interface ModelSheetProps {
  open: boolean;
  onClose: () => void;
  onUpdated?: (message: string) => void;
}

export function ModelSheet({ open, onClose, onUpdated }: ModelSheetProps) {
  const { userModel, replaceUserModel } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [preview, setPreview] = useState<ModelPhoto | null>(null);
  const [error, setError] = useState("");

  const reset = () => {
    setPhase("menu");
    setPreview(null);
    setError("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setPhase("detecting");
    setError("");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const img = new Image();
        img.src = String(reader.result);
        await img.decode();
        const result = await standardizeModelPhoto(img);
        setPreview(result);
        setPhase("preview");
      } catch (e) {
        setError(e instanceof Error ? e.message : "识别人体失败，请换一张试试");
        setPhase("error");
      }
    };
    reader.readAsDataURL(file);
  };

  const confirm = async () => {
    if (!preview || !userModel) return;
    await replaceUserModel({
      ...userModel,
      modelImage: preview.dataUrl,
      source: "photo",
      body: preview.body,
    });
    onUpdated?.("模特已更新，衣服位置已自动调整");
    close();
  };

  const restoreDemo = async () => {
    await replaceUserModel(demoUserModel());
    onUpdated?.("已恢复演示模特");
    close();
  };

  return (
    <BottomSheet open={open} onClose={close} title="我的模特">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {phase === "menu" && (
        <div className="space-y-4">
          {userModel && (
            <div className="flex items-center gap-4 rounded-2xl bg-sand p-3">
              <div className="w-14 shrink-0 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={userModel.modelImage} alt="当前模特" className="aspect-[1/2] w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {userModel.source === "photo" ? "我的照片模特" : "演示模特"}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  换装时所有衣服会按你的身材自动定位
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-[15px] font-medium text-white shadow-[0_8px_20px_rgba(185,106,75,0.25)] transition active:scale-[0.98]"
          >
            <IconCamera width={19} height={19} />
            上传一张全身照
          </button>

          <div className="rounded-2xl border border-line bg-surface p-4 text-[13px] leading-relaxed text-muted">
            <p className="mb-1 font-medium text-ink">拍照小贴士</p>
            <p>・正面站立、全身完整入镜</p>
            <p>・光线充足，穿着贴身或浅色衣服更准</p>
            <p>・手机竖拍，人与镜头保持 2-3 米</p>
          </div>

          {userModel?.source === "photo" && (
            <button
              onClick={() => void restoreDemo()}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-line py-3 text-sm text-muted"
            >
              <IconRefresh width={16} height={16} />
              恢复演示模特
            </button>
          )}
        </div>
      )}

      {phase === "detecting" && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent" />
          <p className="text-sm text-muted">正在识别人体，请稍候…</p>
        </div>
      )}

      {phase === "error" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 text-[13px] leading-relaxed text-muted">
            <p className="mb-1 font-medium text-ink">建议这样拍</p>
            <p>・请朋友帮忙拍全身照，或用手机支架</p>
            <p>・确保头顶、脚底都在画面内，不要被裁剪</p>
            <p>・正对镜头，自然站立，手臂自然下垂</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-full bg-ink py-3.5 text-[15px] font-medium text-white transition active:scale-[0.98]"
          >
            重新选择照片
          </button>
        </div>
      )}

      {phase === "preview" && preview && (
        <div className="space-y-4">
          <div className="mx-auto w-40 overflow-hidden rounded-2xl bg-sand shadow-[inset_0_0_0_1px_rgba(42,36,32,0.04)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.dataUrl} alt="标准化后的模特" className="aspect-[1/2] w-full object-cover" />
          </div>
          <div className="rounded-2xl bg-sand p-4 text-[13px] leading-relaxed text-ink/80">
            <p>已按 600×1200 标准画布自动裁剪，衣服位置将按这个身材重算。</p>
            {preview.warnings.map((w) => (
              <p key={w} className="mt-1 text-accent-deep">
                {w}
              </p>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="h-12 flex-1 rounded-full border border-line text-[15px] text-ink transition active:scale-[0.98]"
            >
              重新选择
            </button>
            <button
              onClick={() => void confirm()}
              className="h-12 flex-1 rounded-full bg-accent text-[15px] font-medium text-white shadow-[0_8px_20px_rgba(185,106,75,0.25)] transition active:scale-[0.98]"
            >
              使用这张照片
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
