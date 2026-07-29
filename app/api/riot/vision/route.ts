import { NextResponse } from "next/server";

import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { generateGeminiJson } from "@/lib/gemini/client";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

interface VisionDraft {
  players: Array<{
    participantName: string;
    kills: number | null;
    deaths: number | null;
    assists: number | null;
    damageDealt: number | null;
    confidence: number;
  }>;
  warnings: string[];
}

const visionSchema = {
  type: "object",
  properties: {
    players: {
      type: "array",
      items: {
        type: "object",
        properties: {
          participantName: { type: "string" },
          kills: { type: "integer", nullable: true },
          deaths: { type: "integer", nullable: true },
          assists: { type: "integer", nullable: true },
          damageDealt: { type: "integer", nullable: true },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: [
          "participantName",
          "kills",
          "deaths",
          "assists",
          "damageDealt",
          "confidence",
        ],
      },
    },
    warnings: { type: "array", items: { type: "string" } },
  },
  required: ["players", "warnings"],
};

export async function POST(request: Request) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new ApiError(
        400,
        "INVALID_MULTIPART_FORM",
        "이미지를 multipart/form-data 형식으로 보내 주세요.",
      );
    }
    const image = formData.get("image");
    if (!(image instanceof File)) {
      throw new ApiError(
        400,
        "IMAGE_REQUIRED",
        "분석할 점수판 이미지를 첨부해 주세요.",
      );
    }
    if (!SUPPORTED_IMAGE_TYPES.has(image.type)) {
      throw new ApiError(
        415,
        "UNSUPPORTED_IMAGE",
        "JPG, PNG 또는 WebP 이미지만 사용할 수 있습니다.",
      );
    }
    if (image.size > MAX_IMAGE_BYTES) {
      throw new ApiError(
        413,
        "IMAGE_TOO_LARGE",
        "이미지는 10MB 이하로 올려 주세요.",
      );
    }

    const participantNames = formData.get("participantNames");
    const namesHint =
      typeof participantNames === "string"
        ? participantNames.slice(0, 2_000)
        : "제공되지 않음";
    const imageData = Buffer.from(await image.arrayBuffer()).toString("base64");
    const draft = await generateGeminiJson<VisionDraft>(
      [
        {
          text: `리그 오브 레전드 점수판 이미지에서 참가자명, K/D/A, 챔피언 대상 피해량을 읽어라.
후보 참가자명: ${namesHint}
확실하지 않은 숫자는 추측하지 말고 null로 두며 warnings에 사유를 적어라.
이 결과는 사용자가 검토할 수정 가능한 초안이므로 이미지에 없는 평가는 만들지 마라.`,
        },
        {
          inlineData: {
            mimeType: image.type,
            data: imageData,
          },
        },
      ],
      visionSchema,
    );

    return NextResponse.json({ draft });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
