---
title: "DKIM Setup Guide: Sign Your Emails Properly"
excerpt: "DKIM adds a cryptographic signature to your emails, proving they haven't been tampered with. Here's how to set it up correctly."
category: "Guides"
author: "Inmybox Team"
date: "2026-03-18"
coverImage: "/blog/dkim-setup.svg"
tags: ["DKIM", "email authentication", "DNS", "security"]
---

## What is DKIM?

**DKIM** (DomainKeys Identified Mail) adds a digital signature to every email you send. The receiving server uses a public key published in your DNS to verify that:

1. The email actually came from your domain
2. The email wasn't modified in transit

Think of it as a wax seal on a letter — it proves authenticity and integrity.

## How DKIM Works

1. Your email server generates a **private/public key pair**
2. The **public key** is published as a DNS TXT record
3. Every outgoing email is **signed** with the private key
4. The receiving server **verifies** the signature using the public key

## Setting Up DKIM

### Step 1: Generate Keys

Most email providers generate DKIM keys for you. Check your provider's documentation:

- **Google Workspace**: Admin Console → Apps → Google Workspace → Gmail → Authenticate Email
- **Microsoft 365**: Defender Portal → Email Authentication → DKIM
- **SendGrid**: Settings → Sender Authentication → Domain Authentication

### Step 2: Add the DNS Record

Your provider will give you a CNAME or TXT record to add. It typically looks like:

```
selector1._domainkey.yourdomain.com  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GC..."
```

### Step 3: Enable Signing

Once the DNS record propagates (usually 15-60 minutes), enable DKIM signing in your email provider's settings.

### Step 4: Verify

Use our [free domain scanner](/) to verify your DKIM setup. We check 12 common selectors automatically.

## Common DKIM Selectors

Different providers use different selector names:

| Provider | Selector |
|----------|----------|
| Google Workspace | `google` |
| Microsoft 365 | `selector1`, `selector2` |
| SendGrid | `s1`, `s2` |
| Mailchimp | `k1` |
| Amazon SES | `default` |

## DKIM Key Rotation

DKIM keys should be rotated periodically (every 6-12 months) to maintain security. The process:

1. Generate a new key pair with a new selector
2. Publish the new public key in DNS
3. Start signing with the new key
4. Keep the old key active for 7 days (in-flight emails)
5. Remove the old DNS record

## Common Mistakes

1. **Not enabling DKIM at all** — Many domains have SPF but skip DKIM
2. **Using weak keys** — Use at least 2048-bit RSA keys
3. **Wrong DNS record format** — Ensure the public key has no line breaks
4. **Forgetting third-party senders** — Each service that sends on your behalf needs its own DKIM setup

## Why DKIM + DMARC = Essential

DKIM alone doesn't tell receiving servers what to do with unsigned email. DMARC closes this gap by providing a policy. Together, they form a complete authentication system.

---

*Check if your DKIM is properly configured with our [free scanner](/) — we test 12 selectors in under a second.*
