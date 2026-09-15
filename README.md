# Prime Tone Painting V4

Production-oriented static website for `primetonepainting.com.au` using GitHub + Cloudflare Pages + Supabase + Resend.

## Deploy order
1. Supabase SQL: run `supabase_schema.sql`.
2. Supabase Auth: create your single admin user, then disable public sign-ups.
3. Website config: set the Supabase URL and publishable/anon key in `assets/supabase-config.js`.
4. Resend: verify `primetonepainting.com.au` and configure the notification Edge Function secrets.
5. Push the finished files to your existing GitHub repository.
6. Cloudflare Pages will deploy the connected repository.
7. Run `QA-TEST-MATRIX.md` twice: desktop and mobile.

## Secrets
Never commit the Supabase service-role key or Resend API key. Resend credentials belong in the server-side Supabase Edge Function secrets.

## Logo
The supplied Prime Tone Painting logo is included as `assets/primetone-logo-original.jpeg` for use wherever the company logo/sign is required. Do not replace it with a different brand mark without approval.
