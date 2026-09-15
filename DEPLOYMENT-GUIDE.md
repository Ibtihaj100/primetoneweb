# Prime Tone Painting — deployment guide

This version keeps the website lightweight and uses your existing GitHub + Cloudflare + Supabase + Resend accounts.

## 1. Supabase database

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Paste and run `supabase_schema.sql`.
4. Go to **Authentication → Users** and create your private admin user with email/password.
5. Do not create public customer accounts.

The SQL enables RLS. Public visitors can insert inquiries/reviews and can read only published projects. Authenticated users can manage the dashboard data. Supabase recommends RLS for exposed tables and says service-role/secret keys must stay server-side. See the official docs linked below.

## 2. Supabase browser configuration

Open:

`assets/supabase-config.js`

Replace:

- `https://YOUR-PROJECT.supabase.co`
- `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

with the values from **Supabase → Project Settings → API**.

Only use the publishable/anon key here. Never put the service-role key in this file or GitHub.

## 3. Resend

Verify the domain you will send from in Resend. For example, after domain verification you can use a sender such as `Prime Tone Painting <notifications@primetonepainting.com.au>` if you want that address.

Resend requires SPF and DKIM DNS records for domain verification.

## 4. Deploy the email function

Install the Supabase CLI if you do not already have it, then from the project folder:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy notify-submission --no-verify-jwt
```

Set the server-side secrets:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
supabase secrets set NOTIFY_EMAIL=YOUR_EMAIL@example.com
supabase secrets set FROM_EMAIL="Prime Tone Painting <notifications@primetonepainting.com.au>"
```

The function also uses the Supabase-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` runtime values. Do not place either secret in the frontend.

The function sends notifications for:

- new quote/contact inquiry
- new customer review

## 5. Test Supabase before publishing

Test in this order:

1. Open `quote.html` on the deployed site.
2. Submit a test quote.
3. Confirm a row appears in `inquiries`.
4. Confirm the email arrives at `NOTIFY_EMAIL`.
5. Submit a review.
6. Confirm it appears as Pending in the dashboard.
7. Approve it from `/admin.html`.
8. Confirm it appears on `reviews.html`.

## 6. Admin dashboard

Open:

`https://primetonepainting.com.au/admin.html`

Sign in using the Supabase Auth user you created.

The dashboard provides:

- inquiry/quote list
- inquiry status changes
- customer review approval/hiding/deletion
- project creation
- multiple project image uploads
- project deletion

The first image uploaded for a project becomes its cover image.

## 7. Project photos

Project images are stored in the Supabase Storage bucket:

`project-images`

The website reads published projects from Supabase and displays the cover image automatically.

Use real Prime Tone project photography for projects represented as completed work. Do not label AI-generated images as real completed customer projects.

## 8. GitHub + Cloudflare

Your existing Cloudflare Pages Git integration can remain unchanged. Commit the files to your existing production branch (normally `main`) and Cloudflare will deploy the new version automatically.

For a static HTML project, no build command is required. If Cloudflare asks for one, use `exit 0` and set the output directory to the repository root.

## 9. Before launch

Replace all placeholder business details in the HTML files, especially:

- phone number
- email address
- verified service areas
- real business claims
- real reviews
- real project photos

Also update the sitemap if the final URL structure changes.

## Security notes

- Frontend: publishable/anon Supabase key only.
- Backend: Resend API key + Supabase service-role key only inside Edge Function secrets.
- Keep `supabase_schema.sql` and source code in GitHub, but never commit API secrets.
- Consider adding Cloudflare Turnstile/rate limiting later if spam becomes a problem.
