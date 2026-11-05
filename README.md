# Ng Wei Xiang — Web Apps store

Static site (GitHub Pages) + Supabase project **NGWX Web Apps** (`cnopuhvwtjoqfytxeynn`, Singapore) + Stripe Checkout.

## Pages
- `index.html` — landing + catalogue (monthly / yearly / one-time toggle)
- `app.html?app=<slug>` — app detail + plans → Stripe Checkout
- `account.html` — sign in / sign up, My apps (deployment status, setup form, "Open my app"), payments, billing portal
- `admin.html` — owner only (wxiangng@hotmail.com, wxiangngaera@gmail.com, tanjc1994@hotmail.com): deployments, payments, apps, plans, customers
- `config.js` — Supabase URL / key and contact details

## Supabase
Tables: `profiles`, `templates`, `plans`, `orders`, `deployments` (RLS on; owner check = `is_owner()` by email).
Edge Functions: `create-checkout`, `stripe-webhook`, `billing-portal`.

### Secrets to add (Supabase → Edge Functions → Secrets)
- `STRIPE_SECRET_KEY` — from Stripe → Developers → API keys
- `STRIPE_WEBHOOK_SECRET` — from the webhook endpoint below

### Stripe webhook endpoint
URL: `https://cnopuhvwtjoqfytxeynn.supabase.co/functions/v1/stripe-webhook`
Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`

### Auth
Supabase → Authentication → URL Configuration: set **Site URL** and add **Redirect URLs** to the site's address (e.g. `https://wxiangngaera-pixel.github.io/ngwx-apps/*`).

## Flow
Customer pays → webhook marks order `paid` (one-time) / `active` (subscription) and creates a `deployments` row (`awaiting_details`) → customer fills setup form (`queued`) → you deploy their copy and set status `live` + App URL in Admin → customer sees "Open my app".
Subscription cancelled / payment refunded → deployment `suspended` automatically; renewal paid → back to `live`.
