import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { generateGeminiVision, parseGeminiJson } from "@/lib/gemini/client";

interface VisionDraft {
  participants: Array<{
    name: string | null;
    kills: number | null;
    deaths: number | null;
    assists: number | null;
    damageDealt: number | null;
  }>;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const { mimeType, data } = await readImage(request);
    const prompt = [
      "리그 오브 레전드 점수판 이미지에서 참가자 행을 읽으세요.",
      "각 참가자의 이름, kills, deaths, assists, damageDealt를 추출하세요.",
      "확인할 수 없는 값은 추측하지 말고 null로 두세요.",
      '반드시 {"participants":[{"name":string|null,"kills":number|null,"deaths":number|null,"assists":number|null,"damageDealt":number|null}]} JSON만 반환하세요.',
    ].join("\n");
    const draft = parseGeminiJson<VisionDraft>(
      await generateGeminiVision(prompt, { mimeType, data }),
    );
    if (!Array.isArray(draft.participants)) {
      throw new ApiError(502, "GEMINI_INVALID_RESPONSE", "참가자 초안을 확인하지 못했습니다.");
    }
    return NextResponse.json({ draft });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

async function readImage(request: Request): Promise<{ mimeType: string; data: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    throw new ApiError(415, "IMAGE_REQUIRED", "multipart/form-data 이미지가 필요합니다.");
  }
  const file = (await request.formData()).get("image");
  if (!(file instanceof File)) {
    throw new ApiError(400, "IMAGE_REQUIRED", "image 파일을 첨부해 주세요.");
  }
  if (!file.type.startsWith("image/")) {
    throw new ApiError(415, "INVALID_IMAGE_TYPE", "이미지 파일만 업로드할 수 있습니다.");
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new ApiError(413, "INVALID_IMAGE_SIZE", "이미지는 8MB 이하여야 합니다.");
  }
  return {
    mimeType: file.type,
    data: Buffer.from(await file.arrayBuffer()).toString("base64"),
  };
}
