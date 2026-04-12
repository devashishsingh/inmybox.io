---
title: "SPF Records Explained: The Complete Guide"
excerpt: "SPF tells the world which servers can send email for your domain. Learn how to create, validate, and optimize your SPF record."
category: "Guides"
author: "Inmybox Team"
date: "2026-03-25"
coverImage: "/blog/spf-guide.svg"
tags: ["SPF", "DNS", "email authentication"]
---

## What is an SPF Record?

**SPF** (Sender Policy Framework) is a DNS TXT record that lists every IP address and server authorized to send email on behalf of your domain.

When a receiving mail server gets an email claiming to be from your domain, it checks your SPF record. If the sending server's IP isn't listed — the email fails SPF authentication.

## Why SPF Matters

Without SPF:
- Anyone can send email pretending to be your domain
- Email providers can't distinguish your legitimate emails from spoofed ones
- Your deliverability suffers as providers treat your domain as suspicious

## SPF Record Syntax

A basic SPF record looks like this:

```
v=spf1 include:_spf.google.com include:sendgrid.net -all
```

Let's break it down:

| Component | Meaning |
|-----------|---------|
| `v=spf1` | This is an SPF record (version 1) |
| `include:_spf.google.com` | Authorize Google Workspace servers |
| `include:sendgrid.net` | Authorize SendGrid servers |
| `-all` | Reject all other senders |

## The All Mechanism

The most important part of your SPF record is the `all` mechanism:

- **`-all`** (hard fail) — Reject unauthorized senders ✅ Recommended
- **`~all`** (soft fail) — Mark as suspicious but deliver
- **`?all`** (neutral) — No opinion
- **`+all`** (pass all) — Allow anyone ❌ Never use this

## The 10-Lookup Limit

SPF has a hard limit of **10 DNS lookups**. Every `include:`, `a:`, `mx:`, and `redirect=` counts as a lookup.

If you exceed 10 lookups, your entire SPF record becomes invalid — and all your emails fail SPF.

### How to Stay Under the Limit

1. Use `ip4:` and `ip6:` for known IPs (these don't count as lookups)
2. Remove services you no longer use
3. Consider SPF flattening tools
4. Consolidate includes where possible

## Common Mistakes

1. **Multiple SPF records** — You can only have ONE SPF TXT record per domain
2. **Using `+all`** — This authorizes the entire internet to send as you
3. **Forgetting subdomains** — Each subdomain needs its own SPF record
4. **Exceeding 10 lookups** — Invalidates your entire SPF configuration

## Test Your SPF Record

Run a [free domain scan](/) to instantly check your SPF record validity, lookup count, and fail mechanism.

---

*Need help fixing your SPF record? [Talk to our team](mailto:hello@inmybox.io) — we'll guide you through it.*
