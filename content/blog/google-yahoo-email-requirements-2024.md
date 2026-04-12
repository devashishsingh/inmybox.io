---
title: "Google & Yahoo Email Requirements: What You Need to Know"
excerpt: "Google and Yahoo now reject unauthenticated email from bulk senders. Here's exactly what changed and how to comply."
category: "Product Updates"
author: "Inmybox Team"
date: "2026-03-10"
coverImage: "/blog/google-yahoo-requirements.svg"
tags: ["Google", "Yahoo", "compliance", "bulk senders", "DMARC"]
---

## The Biggest Email Policy Change in a Decade

In October 2023, Google and Yahoo jointly announced new requirements for bulk email senders. Starting February 2024, any domain sending more than 5,000 emails per day to Gmail or Yahoo must comply — or face rejection.

This isn't a suggestion. It's enforced.

## The Requirements

### For All Senders

1. **Set up SPF or DKIM** — At minimum, one must pass
2. **Valid forward and reverse DNS** for sending IPs
3. **Keep spam complaint rates below 0.3%** (ideally under 0.1%)
4. **Don't impersonate Gmail "From:" headers**

### For Bulk Senders (5,000+/day)

All of the above, PLUS:

1. **SPF AND DKIM** — Both must be configured
2. **DMARC** — Must have a DMARC record (even `p=none`)
3. **DMARC alignment** — "From" domain must align with SPF or DKIM domain
4. **One-click unsubscribe** — Via `List-Unsubscribe` header
5. **Unsubscribe within 2 days** — Honor requests promptly

## What Happens If You Don't Comply?

- Emails to Gmail may be **temporarily rejected** with 4xx errors
- Emails may be **permanently rejected** with 5xx errors
- Your sending IP reputation will **degrade**
- Eventually, many of your emails will **go to spam** even for compliant messages

## The Microsoft Factor

Microsoft followed suit in April 2025, announcing that starting **May 5, 2025**, Outlook.com will:

1. Route non-compliant high-volume email to **Junk**
2. Eventually **reject** non-compliant messages entirely

## How to Check Compliance

Run a [free domain scan](/) on Inmybox. Our scanner checks all four pillars:

- **DMARC**: Record exists, policy strength, subdomain policy, reporting
- **SPF**: Record exists, fail mechanism, lookup count
- **DKIM**: Public key found across 12 common selectors
- **Configuration**: Alignment mode, policy coverage

## Action Plan

1. **Today**: Scan your domain and identify gaps
2. **This week**: Add any missing SPF/DKIM/DMARC records
3. **This month**: Set DMARC to at least `p=quarantine`
4. **Ongoing**: Monitor compliance with Inmybox

The enforcement is already live. Every day you wait is a day your emails might not be reaching your customers.

---

*Don't wait for email rejections. [Scan your domain now](/) and fix issues before they cost you leads.*
