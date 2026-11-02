# Connect the WHAMSY product manager

The shop has two modes. Before setup, `admin.html` is a local preview manager: it saves sample product edits only in the current browser. After the online database is connected, WHAMSY products are shared with visitors and product editing requires an owner sign-in.

## 1. Create the online catalogue

1. Create a Supabase account and a new project.
2. In the Supabase project, open **SQL Editor** and run the full contents of `supabase/schema.sql` once.
3. The script creates the product catalogue, an owner access list, protected database rules, and a public product-image bucket. The eight example ideas are inserted as drafts and are hidden from customers.

## 2. Add the WHAMSY owner

1. In Supabase, open **Authentication → Users** and create an owner account with the email and password you want to use for `admin.html`.
2. In **SQL Editor**, run the query below after replacing `YOUR_OWNER_EMAIL` with that exact account email:

```sql
insert into public.admin_users (user_id)
select id from auth.users
where lower(email) = lower('YOUR_OWNER_EMAIL')
on conflict (user_id) do nothing;
```

Only an account listed in `admin_users` can add, edit, publish or remove products. To give another person owner access, create their Auth account and add their user ID to this table using the same query pattern.

## 3. Connect this website

1. In Supabase, copy the **Project URL** and the **publishable key** (some dashboards label this the public/anon key).
2. Open `config.js` and fill in `supabaseUrl` and `supabasePublishableKey`.
3. Keep the WhatsApp value as `0759807444`; the site formats it for the WhatsApp link automatically.
4. Never put a secret key, service-role key, database password, M-Pesa credential or payment passkey in `config.js`. The publishable key is intended to be visible in a browser and is safe here only because the database rules in `schema.sql` restrict access.

## 4. Add real products

1. Open `admin.html` and sign in with the owner account.
2. Edit the example drafts with WHAMSY's real product names, KSh prices, photos and details, or add new products.
3. Tick **Display price to customers** to show the entered price. Clear it to show “Ask on WhatsApp”.
4. Keep **Publish this product** off until its details and price are ready. Turn it on when the product should appear in the shop.
5. Upload product photos from the manager, or enter a public image URL. Published uploads are stored in the `whamsy-products` bucket.

## 5. Publish from GitHub

1. Put the contents of this project in a GitHub repository on the `main` branch. Do not upload `node_modules`, passwords or secret keys.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the publishing source.
3. The included `.github/workflows/deploy.yml` publishes the customer pages and the owner page after each push to `main`.
4. Wait for the `Publish WHAMSY site` workflow to finish, then use the Pages address GitHub shows. Product changes saved through `admin.html` update Supabase directly; code/design changes publish when pushed.

GitHub Pages hosts the static website. Supabase hosts the shared catalogue and owner sign-in. You need both connected for online product edits.

## WhatsApp and payment

The checkout button opens a draft message to **0759 807 444**. The customer chooses whether to send it. WHAMSY confirms stock, final amount and delivery, then provides payment instructions. This is a WhatsApp order request; it does not charge a card or make an automatic M-Pesa payment. Automatic M-Pesa collection and payment confirmation would need a separate server-side payment integration.
