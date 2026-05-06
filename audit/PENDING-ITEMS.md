# Pending Items

Track these before going to production.

---

## 1. SendGrid Setup
- [ ] Add MX record: `rua.inmybox.io` → `mx.sendgrid.net` (priority 10)
- [ ] Configure SendGrid Inbound Parse → POST `https://app.inmybox.io/api/email-inbound`
- [ ] **Send Raw must be OFF** (use parsed form data)
- [ ] Add env var: `SENDGRID_WEBHOOK_VERIFICATION_KEY` (ECDSA public key from SendGrid dashboard → Settings → Mail Settings → Inbound Parse → Webhook)
- [ ] Add env var: `SENDGRID_API_KEY` (if not already set)

## 2. Google OAuth (Gmail / Workspace inbox connection)
- [ ] Create OAuth 2.0 credentials at https://console.cloud.google.com
- [ ] Scopes needed: `gmail.readonly`, `https://mail.google.com/`
- [ ] Authorized redirect URI: `https://app.inmybox.io/api/mailbox/callback/google`
- [ ] Add env vars:
  - `GOOGLE_OAUTH_CLIENT_ID`
  - `GOOGLE_OAUTH_CLIENT_SECRET`

## 3. Microsoft OAuth (Outlook / M365 inbox connection)
- [ ] Register app at https://portal.azure.com → Azure Active Directory → App Registrations
- [ ] Redirect URI: `https://app.inmybox.io/api/mailbox/callback/microsoft`
- [ ] API permissions: `IMAP.AccessAsUser.All`, `offline_access`, `User.Read`
- [ ] Add env vars:
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_CLIENT_SECRET`
  - `MICROSOFT_TENANT_ID` (use `common` for multi-tenant)

## 4. CRON_SECRET
- [ ] Generate a random secret (e.g. `openssl rand -hex 32`) and add to env vars
- [ ] Set it in your cron scheduler (Vercel Cron or external) as Bearer token header

---

## Env Vars Summary (all required for production)

| Variable | Status | Notes |
|----------|--------|-------|
| `ENCRYPTION_KEY` | ✅ Generated | 64 hex chars — see below |
| `SENDGRID_API_KEY` | ⏳ Pending | |
| `SENDGRID_WEBHOOK_VERIFICATION_KEY` | ⏳ Pending | From SendGrid dashboard |
| `GOOGLE_OAUTH_CLIENT_ID` | ⏳ Pending | |
| `GOOGLE_OAUTH_CLIENT_SECRET` | ⏳ Pending | |
| `MICROSOFT_CLIENT_ID` | ⏳ Pending | |
| `MICROSOFT_CLIENT_SECRET` | ⏳ Pending | |
| `MICROSOFT_TENANT_ID` | ⏳ Pending | Use `common` for multi-tenant |
| `CRON_SECRET` | ⏳ Pending | |
