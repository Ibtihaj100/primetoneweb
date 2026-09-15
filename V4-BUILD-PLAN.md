# Prime Tone Painting V4 — Build & QA Plan

Target stack: GitHub + Cloudflare Pages + Supabase Free + Resend Free.

## User requirements
- Simple, clean, professional painting-company website.
- Use the supplied Prime Tone Painting logo wherever a company logo/sign is required.
- Customer quote requests, contact inquiries and reviews are saved in Supabase.
- Each quote/contact/review submission triggers an email notification through Resend.
- Private admin dashboard to view inquiries, moderate reviews, and upload/manage current and completed projects.
- Project photos are stored in Supabase Storage.
- No fake reviews or fake completed projects are presented as real customer work.

## QA rule
Before launch, test every navigation link and every interactive function twice:
1. Desktop pass.
2. Mobile pass.

Record the result in `QA-TEST-MATRIX.md`.
