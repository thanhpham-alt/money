import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/daily-expenses/ocr
 * Body: { imageBase64: string, mimeType?: string }
 * Response: { amount, description, occurredAt, bankRef, bank, kind, category, confidence }
 *
 * KHÔNG lưu ảnh. Gọi Gemini Vision, parse response, trả JSON.
 * Key lấy từ GEMINI_API_KEY env hoặc Settings.geminiApiKey trên Neon.
 */

async function resolveGemini() {
  const envKey = (process.env.GEMINI_API_KEY || "").trim();
  const envModel = (process.env.GEMINI_MODEL || "").trim();
  if (envKey) {
    return { key: envKey, model: envModel || "gemini-2.5-flash" };
  }
  const s = await prisma.settings.findUnique({ where: { id: "default" } });
  const key = (s?.geminiApiKey || "").trim();
  const model = (s?.geminiModel || envModel || "gemini-2.5-flash").trim();
  return { key, model };
}

const PROMPT = `Bạn đọc screenshot chuyển khoản / biên lai app ngân hàng Việt Nam (Techcombank, Vietcombank, MB, TPBank, OCB, SCB, BIDV, ACB, MoMo, ZaloPay…).

Quy tắc:
- "Chuyển thành công / Đã chuyển / Chuyển tiền / Tới [tên]" = expense (tiền ra).
- "Nhận tiền / Tiền vào / Từ [tên] chuyển đến" = income (tiền vào).
- amount là số VND nguyên, bỏ dấu chấm/phẩy (VND 250,000 → 250000).
- description = tiêu đề ngắn: tên người nhận/gửi + lời nhắn nếu có. VD: "TRAN THI KHUONG · Nhat Thanh chuyen khoan nhanh qua Zalo".
- occurredAt = ngày giao dịch YYYY-MM-DD (13 thg 8, 2026 → 2026-08-13).
- bankRef = mã giao dịch (FT…, Trace, Ref).
- bank = ngân hàng nguồn nếu thấy (TECHCOMBANK → TCB, Vietcombank → VCB).

Trả DUY NHẤT JSON:
{
  "amount": number,
  "description": string,
  "occurredAt": "YYYY-MM-DD",
  "bankRef": string | null,
  "bank": "TCB" | "TPB" | "OCB" | "SCB" | "MB" | "VCB" | "BIDV" | "ACB" | "MOMO" | null,
  "kind": "income" | "expense",
  "category": "an-uong" | "di-lai" | "mua-sam" | "luong" | "thu-nhap" | "khac",
  "confidence": number
}

Ảnh không phải giao dịch: {"error":"not_a_receipt"}.`;

type OcrResult = {
  amount: number;
  description: string;
  occurredAt: string;
  bankRef: string | null;
  bank: string | null;
  kind: "income" | "expense";
  category: string;
  confidence: number;
};

export async function POST(request: NextRequest) {
  const { key: GEMINI_API_KEY, model: GEMINI_MODEL } = await resolveGemini();
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY chưa được cấu hình trên server" },
      { status: 500 }
    );
  }

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageBase64, mimeType = "image/jpeg" } = body;
  if (!imageBase64) {
    return NextResponse.json({ error: "Thiếu imageBase64" }, { status: 400 });
  }

  // Strip data URL prefix nếu client gửi kèm
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const geminiBody = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType, data: cleanBase64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  try {
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Gemini API error: ${res.status}`, detail: errText.slice(0, 500) },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json(
        { error: "Gemini không trả về nội dung" },
        { status: 502 }
      );
    }

    let parsed: OcrResult | { error: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Không parse được JSON từ Gemini", raw: text.slice(0, 500) },
        { status: 502 }
      );
    }

    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // Chuẩn hoá ngày + ngân hàng
    if (!parsed.occurredAt || !/^\d{4}-\d{2}-\d{2}/.test(parsed.occurredAt)) {
      parsed.occurredAt = new Date().toISOString().slice(0, 10);
    } else {
      parsed.occurredAt = parsed.occurredAt.slice(0, 10);
    }
    parsed.amount = Math.round(Number(parsed.amount) || 0);
    const bankMap: Record<string, string> = {
      techcombank: "TCB",
      tcb: "TCB",
      vietcombank: "VCB",
      vcb: "VCB",
      tpbank: "TPB",
      tpb: "TPB",
      mbbank: "MB",
      mb: "MB",
    };
    if (parsed.bank) {
      parsed.bank = bankMap[String(parsed.bank).toLowerCase().replace(/\s+/g, "")] || parsed.bank;
    }
    if (parsed.kind !== "income" && parsed.kind !== "expense") parsed.kind = "expense";

    return NextResponse.json(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Lỗi gọi Gemini", detail: msg }, { status: 500 });
  }
}
