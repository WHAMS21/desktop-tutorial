# WHAMSY owner guide

## Your product manager

Open `admin.html` to add products, edit descriptions and KSh prices, hide a price, upload or change a photo, feature a product, publish or unpublish it, or remove it.

- Before Supabase is connected, this is a local demo. It saves to that browser only; it does not change the public catalogue.
- After following `SUPABASE_SETUP.md`, sign in at `admin.html`. Changes then go to the shared WHAMSY catalogue.
- The example products in the online setup begin as unpublished drafts. Replace their sample details and images before publishing them.

## Customer orders

Customers add products to the bag and continue to WhatsApp. Their draft goes to **0759 807 444** after they choose to send it. WHAMSY confirms product availability, final total and delivery, then shares payment instructions. The website does not collect M-Pesa/card payment or mark an order paid.

## Launch checklist

1. Confirm your actual product photos, names, descriptions, materials, dimensions, care details, KSh prices and availability.
2. Connect Supabase and create your private owner account by following `SUPABASE_SETUP.md`.
3. Edit or remove the sample catalogue and publish only products you can fulfil.
4. Confirm delivery areas/fees, returns and refund terms, support email, business details and response hours. Update `policies.html` and `contact.html` as needed.
5. Connect GitHub and publish with the included Pages workflow. Enable **GitHub Actions** under the repository's Pages settings.
6. Open the published website on a phone and computer, test the menu, product editing, prices, bag and WhatsApp draft, then share the site address.

Keep only the Supabase publishable key in `config.js`. Never place a secret/service-role key, password, M-Pesa PIN or payment passkey in website files.
