import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from 'npm:resend@6';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
  const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') ?? '';
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? '';

  if (!SUPABASE_URL || !SERVICE_ROLE || !RESEND_API_KEY || !NOTIFY_EMAIL || !FROM_EMAIL) {
    return json({ error: 'Server email configuration is incomplete.' }, 500);
  }

  try {
    const { type, id } = await req.json();
    if (!['inquiry', 'comment'].includes(type) || typeof id !== 'string') {
      return json({ error: 'Invalid notification request.' }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const resend = new Resend(RESEND_API_KEY);

    if (type === 'inquiry') {
      const { data, error } = await admin.from('inquiries').select('*').eq('id', id).single();
      if (error || !data) return json({ error: 'Inquiry not found.' }, 404);
      if (data.notification_sent) return json({ ok: true, alreadySent: true });

      const subject = `New website enquiry from ${data.name}`;
      const html = `
        <h2>New Prime Tone Painting enquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Property:</strong> ${escapeHtml(data.property_type ?? '')}</p>
        <p><strong>Project:</strong> ${escapeHtml(data.project_type ?? '')}</p>
        <p><strong>Suburb:</strong> ${escapeHtml(data.suburb ?? '')}</p>
        <p><strong>Preferred date:</strong> ${escapeHtml(data.preferred_date ?? '')}</p>
        <p><strong>Message:</strong><br>${escapeHtml(data.message ?? '')}</p>
        <p>Open your Prime Tone admin dashboard to manage this enquiry.</p>`;

      const result = await resend.emails.send({ from: FROM_EMAIL, to: [NOTIFY_EMAIL], replyTo: data.email, subject, html });
      if (result.error) return json({ error: result.error.message }, 502);
      await admin.from('inquiries').update({ notification_sent: true }).eq('id', id);
      return json({ ok: true });
    }

    const { data, error } = await admin.from('comments').select('*').eq('id', id).single();
    if (error || !data) return json({ error: 'Comment not found.' }, 404);
    if (data.notification_sent) return json({ ok: true, alreadySent: true });

    const subject = `New customer review from ${data.customer_name}`;
    const html = `
      <h2>New Prime Tone Painting review</h2>
      <p><strong>Customer:</strong> ${escapeHtml(data.customer_name)}</p>
      <p><strong>Rating:</strong> ${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}</p>
      <p><strong>Project type:</strong> ${escapeHtml(data.project_type ?? '')}</p>
      <p><strong>Comment:</strong><br>${escapeHtml(data.comment)}</p>
      <p>This review is pending approval. Open the admin dashboard to approve or reject it.</p>`;

    const result = await resend.emails.send({ from: FROM_EMAIL, to: [NOTIFY_EMAIL], replyTo: data.email || undefined, subject, html });
    if (result.error) return json({ error: result.error.message }, 502);
    await admin.from('comments').update({ notification_sent: true }).eq('id', id);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'Unexpected server error.' }, 500);
  }
});

function escapeHtml(value: string) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
