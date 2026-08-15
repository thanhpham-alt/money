import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/daily-expenses/ocr
 * Body: { imageBase64: string, mimeType?: string }
 * Response: { amount, description, occurredAt, bankRef, bank, kind, category, confidence }
 *
 * KHÔNG lưu ảnh. Gọi Gemini 2.0 Flash Vision, parse response, trả JSON.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const PROMPT = `Bạn là trợ lý trích xuất thông tin giao dịch từ ảnh chụp bill/biên lai/screenshot chuyển khoản ngân hàng Việt Nam.

Trả về DUY NHẤT một JSON object hợp lệ (không markdown, không text thừa) với các field:
{
  "amount": number,          // số tiền VND, chỉ số (VD: 150000)
  "description": string,     // mô tả ngắn: nội dung chuyển khoản, tên người/nơi
  "occurredAt": string,      // ISO 8601 date "YYYY-MM-DD" nếu có, ngược lại today
  "bankRef": string | null,  // mã tham chiếu / mã giao dịch nếu có
  "bank": string | null,     // TCB | TPB | OCB | SCB | MB | VCB | BIDV | ACB | null
  "kind": "income" | "expense", // "income" nếu nhận tiền vào, "expense" nếu chuyển tiền ra
  "category": string,        // "an-uong" | "di-lai" | "mua-sam" | "luong" | "thu-nhap" | "khac"
  "confidence": number       // 0..1 độ tin cậy
}

Nếu ảnh không phải bill/giao dịch, trả về {"error": "not_a_receipt"}.`;

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

    // Chuẩn hoá ngày
    if (!parsed.occurredAt || !/^\d{4}-\d{2}-\d{2}/.test(parsed.occurredAt)) {
      parsed.occurredAt = new Date().toISOString().slice(0, 10);
    }

    return NextResponse.json(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Lỗi gọi Gemini", detail: msg }, { status: 500 });
  }
}
