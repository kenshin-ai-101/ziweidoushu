import { NextRequest } from 'next/server';
import { readSession } from '@/lib/auth/session';
import {
  addChart,
  claimCharts,
  clearCharts,
  listCharts,
  removeChart,
  toHistoryEntry,
} from '@/lib/history/chart-store';
import type { BirthFormState } from '@/components/BirthForm';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await readSession(req);
  if (!session) {
    return Response.json({ charts: [], loggedIn: false });
  }

  const charts = (await listCharts(session.userId)).map(toHistoryEntry);
  return Response.json({ charts, loggedIn: true });
}

export async function POST(req: NextRequest) {
  const session = await readSession(req);
  if (!session) {
    return Response.json({ error: '请先登录' }, { status: 401 });
  }

  const claim = req.nextUrl.searchParams.get('claim');
  const body = await req.json().catch(() => null);

  if (claim) {
    const charts = Array.isArray(body?.charts) ? body.charts : [];
    const forms = charts
      .map((item: { form?: BirthFormState }) => item?.form)
      .filter(Boolean) as BirthFormState[];
    await claimCharts(session.userId, forms);
    const next = (await listCharts(session.userId)).map(toHistoryEntry);
    return Response.json({ ok: true, charts: next, loggedIn: true });
  }

  const form = body?.form as BirthFormState | undefined;
  if (!form?.year) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const entry = await addChart(session.userId, form);
  return Response.json({ ok: true, id: entry.id, chart: toHistoryEntry(entry), loggedIn: true });
}

export async function DELETE(req: NextRequest) {
  const session = await readSession(req);
  if (!session) {
    return Response.json({ error: '请先登录' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    await removeChart(session.userId, id);
    return Response.json({ ok: true, loggedIn: true });
  }

  await clearCharts(session.userId);
  return Response.json({ ok: true, loggedIn: true });
}
