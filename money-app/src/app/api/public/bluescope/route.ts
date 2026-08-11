import { NextResponse } from "next/server";
import { eventTotal, itemTotal, loadBluescope, packageTotal } from "@/lib/bluescope";

/**
 * Public API — chỉ field an toàn cho khách.
 * Không trả aTan, nợ cá nhân, job agency khác, % nội bộ, chi hộ.
 */
export async function GET() {
  const { job, rates, events, packages, contents, budget } = await loadBluescope();

  if (!job.publicVisible) {
    return NextResponse.json({ error: "Public view đang tắt" }, { status: 403 });
  }

  return NextResponse.json({
    title: job.name,
    agency: job.agency,
    status: job.status,
    budget: budget.budget,
    spent: budget.spent,
    remaining: budget.remainingBudget,
    usedPct: budget.usedPct,
    rates: rates.map((r) => ({
      id: r.id,
      role: r.role,
      qty: r.qty,
      halfDay: r.halfDay,
      fullDay: r.fullDay,
    })),
    events: events.map((e) => ({
      id: e.id,
      name: e.name,
      deliverDate: e.deliverDate,
      eventType: e.eventType,
      duration: e.duration,
      photographers: e.photographers,
      videographers: e.videographers,
      recapClips: e.recapClips,
      shootCost: e.shootCost,
      editCost: e.editCost,
      total: eventTotal(e),
      note: e.note,
    })),
    // Gói báo giá KHÔNG trả ra public — không lộ đơn giá từng hạng mục
    contents: contents.map((c) => ({
      id: c.id,
      channel: c.channel,
      name: c.name,
      contentType: c.contentType,
      publishDate: c.publishDate,
      finalCost: c.finalCost,
      scope: c.scope,
    })),
    updatedAt: job.updatedAt,
  });
}
