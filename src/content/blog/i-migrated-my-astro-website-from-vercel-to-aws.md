---
title: I Migrated My Astro Site from Vercel to AWS. The CDN Routing Was the Weird Part.
description: I moved my personal Astro website from Vercel to AWS because I wanted to understand what Vercel was abstracting away.
pubDate: 2026-08-18
---

The migration itself was straightforward. The interesting part came afterward, when the same CloudFront distribution served my root domain from Los Angeles while `www` was served from Mumbai. The fix turned out to have nothing to do with S3, CloudFront configuration, or Route 53.

It was DNS.

## Why move a static Astro site to AWS?

Vercel is very good at making deployment boring:

```
git push -> Vercel -> Production
```

That's useful. It also means you don't have to think much about the infrastructure underneath.

I wanted the opposite.

I wanted to know what actually happens between:

```bash
git push
```

and:

```
https://smitmistry.com
```

For a static Astro site, there isn't much application infrastructure to manage. The site is already just a collection of files:

```
dist/
├── _astro/
├── index.html
├── posts/
├── og/
└── ...
```

So the AWS architecture could stay relatively simple:

```
GitHub
   │
   │ push
   ▼
GitHub Actions
   │
   │ OIDC
   ▼
AWS IAM
   │
   │ temporary credentials
   ▼
S3
   │
   │ private origin
   ▼
CloudFront
   │
   ▼
Route 53
   │
   ├── smitmistry.com
   └── www.smitmistry.com
```

There is no EC2 instance. No server to patch. No database. No Docker container.

For this particular website, I didn't need any of them.

---

## Why S3 is the origin instead of a public website bucket

The obvious setup for a static website is to make S3 public and serve files directly from it.

I didn't want that.

The browser only talks to CloudFront:

```
Browser
   │
   ▼
CloudFront
   │
   ▼
Private S3 bucket
```

S3 stores the files, but isn't the public endpoint.

That gives me one place to deal with HTTPS, caching, domains, and edge delivery. S3 is just the origin.

This also means I can change the CDN configuration without changing how the files are stored.

---

## CloudFront handles the public website

CloudFront is the part that actually serves the website to visitors.

I added both:

```
smitmistry.com
www.smitmistry.com
```

as alternate domain names on the distribution.

The TLS certificate comes from ACM. One CloudFront-specific detail caught me the first time: the ACM certificate used by CloudFront needs to be in us-east-1, even though my other AWS resources are in ap-south-1.

That initially looks backwards.

It makes more sense once you stop thinking of CloudFront as a Mumbai AWS service. CloudFront is a global service, and the certificate is associated with the global distribution.

---

## Route 53 handles DNS, but Namecheap still owns the domain

I initially kept DNS at Namecheap.

Eventually I moved the DNS zone to Route 53 because I wanted the AWS side of the architecture to be explicit and to use a native Route 53 Alias record for the apex domain.

The distinction is important:

```
Namecheap
    │
    └── domain registration

Route 53
    │
    └── authoritative DNS

CloudFront
    │
    └── HTTP/CDN

S3
    │
    └── website files
```

Moving DNS to Route 53 doesn't mean transferring the domain registration away from Namecheap.

The domain stays registered at Namecheap. The authoritative nameservers point at Route 53.

---

## GitHub Actions deploys to AWS without storing AWS keys

The deployment pipeline was the part I cared about most.

I didn't want this:

```
GitHub
   │
   ├── AWS_ACCESS_KEY_ID
   └── AWS_SECRET_ACCESS_KEY
```

Long-lived credentials in CI are an unnecessary liability.

Instead, I configured GitHub's OIDC provider in IAM.

The resulting flow is:

```
GitHub Actions
      │
      │ OIDC token
      ▼
AWS IAM
      │
      │ AssumeRoleWithWebIdentity
      ▼
Temporary credentials
      │
      ├── S3
      └── CloudFront
```

The IAM trust policy is restricted to my repository and branch, rather than trusting every GitHub Actions workflow that can reach the OIDC provider.

The deployment itself is then just:

```
git push
   ↓
GitHub Actions
   ↓
pnpm install
   ↓
pnpm build
   ↓
aws s3 sync dist/ s3://...
   ↓
CloudFront invalidation
```

The useful part here isn't that the YAML is complicated. It isn't.

The useful part is understanding **who is allowed to do what, and how that identity is established.**

---

## Then the website was inexplicably slow

After the migration was working, I noticed something strange.

The CloudFront distribution hostname was fast:

```
https://d1z5t0yefv14fd.cloudfront.net
```

But:

```
https://smitmistry.com
```

was much slower.

At one point I was seeing roughly:

```
CloudFront hostname: ~0.3s
Custom domain:       ~1.6s
```

That's enough of a difference that "it's probably just the Internet" wasn't a satisfying answer.

So I stopped guessing and measured the request.

```bash
curl -4 -s -o /dev/null \
  -w 'DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTLS: %{time_appconnect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n' \
  https://smitmistry.com
```

This breaks the request into:

- DNS lookup
- TCP connection
- TLS handshake
- time to first byte
- total request time

I also checked the CloudFront headers:

```bash
curl -sI https://smitmistry.com \
  | grep -Ei 'x-amz-cf-pop|x-cache'
```

That's when the problem became interesting.

---

## The same CloudFront distribution was using different POPs

The root domain was hitting:

```
x-amz-cf-pop: LAX54-P11
```

That's Los Angeles.

Meanwhile www was hitting:

```
x-amz-cf-pop: BOM78-P11
```

That's Mumbai.

So the request paths looked roughly like:

```
smitmistry.com
      │
      ▼
CloudFront
      │
      ▼
LAX54-P11
      │
      ▼
S3
```

while:

```
www.smitmistry.com
      │
      ▼
CloudFront
      │
      ▼
BOM78-P11
      │
      ▼
S3
```

I was sitting in India.

Sending my request to Los Angeles was not exactly what I had in mind when I put a CDN in front of the site.

The first assumption was that something was wrong with the apex DNS configuration.

So I moved the DNS zone from Namecheap to Route 53.

It didn't fix it.

The root domain was still getting sent to LAX.

That was useful, though. It eliminated one whole category of possible problems.

---

## DNS resolvers turned out to be the variable

I then queried the domain through different recursive resolvers.

With Google's DNS:

```bash
dig @8.8.8.8 smitmistry.com A +short
```

I got:

```
13.227.249.61
13.227.249.2
13.227.249.40
13.227.249.42
```

The same addresses were returned for www.

With Cloudflare DNS:

```bash
dig @1.1.1.1 smitmistry.com A +short
```

I got:

```
99.84.41.81
99.84.41.76
99.84.41.70
99.84.41.28
```

while `www` still returned the `13.227.249.x` addresses.

The difference wasn't my S3 bucket.

It wasn't my CloudFront cache.

It wasn't my TLS certificate.

It was the DNS resolution path used to reach CloudFront.

There was another interesting clue in Google's response:

```
edns0-client-subnet 49.36.78.0/24
```

The recursive resolver had client subnet information available when resolving the request.

That helped explain why different recursive DNS resolvers could result in different CloudFront edge selections.

---

## Changing DNS fixed the latency

I had been using Cloudflare's:

```
1.1.1.1
1.0.0.1
```

on my desktop.

I changed the system resolver to Google's:

```
8.8.8.8
8.8.4.4
```

and tested again.

The root domain went from roughly 1.5 to 1.8 seconds down to:

```
DNS:     0.001s
Connect: 0.012s
TLS:     0.040s
TTFB:    0.119s
Total:   0.120s
```

And CloudFront was now reporting:

```
x-amz-cf-pop: BOM78-P11
```

Both hostnames were reaching the Mumbai edge.

The final measurements were roughly:

```
smitmistry.com
    CloudFront POP: BOM78-P11
    TTFB:            119 ms
    Total:           120 ms

www.smitmistry.com
    CloudFront POP: BOM78-P11
    TTFB:            192 ms
    Total:           192 ms
```

The numbers vary from request to request, but the difference from the original 1.5+ second requests was obvious.

---

## What didn't fix it

A few things I initially suspected turned out not to be the cause.

### Moving DNS to Route 53

It was still slow after the migration.

Route 53 was doing its job correctly. It wasn't the component choosing the final CloudFront edge.

### Changing cache headers

The response had:

```
Cache-Control: public,max-age=0,must-revalidate
```

That deserves attention for a static Astro site, especially for content-hashed assets.

But it wasn't the explanation for a request taking more than a second longer than another request to the same distribution.

I would have been treating the symptom rather than finding the cause.

### S3

S3 wasn't the problem either.

The object was already being served through CloudFront, and the ETag matched between requests.

---

## Why I still prefer this setup over a managed frontend platform

I don't think the lesson here is "AWS is better than Vercel."

That would be a pretty silly conclusion from one personal website.

Vercel is very good at removing infrastructure work.

That's exactly why people use it.

The trade-off is control.

With the AWS setup, I now know exactly where the pieces live:

```
DNS       → Route 53
TLS       → ACM
CDN       → CloudFront
Origin    → private S3
Identity  → IAM + GitHub OIDC
CI/CD     → GitHub Actions
Build     → Astro
```

If something breaks, I have somewhere to look.

That's the part I wanted.

---

## What I would use AWS for, and what I wouldn't

For this website, AWS makes sense because it's static.

There is no reason to introduce EC2 just to host generated HTML.

For a different application, I might make a completely different choice.

If I had a Next.js application with lots of server-side rendering, background jobs, databases, queues, and other moving parts, I'd have to compare the operational cost against the value of having all that control.

That's the trade-off.

Managed platforms aren't expensive simply because they're charging for a button. You're paying someone else to operate parts of the infrastructure.

With AWS, I get more control.

I also get more opportunities to break things.

Both are real benefits.

---

## What this migration taught me

The most useful thing I got from this migration wasn't an AWS architecture diagram.

It was a debugging habit.

When a request is slow, don't start changing random configuration.

Measure:

```
DNS
 ↓
TCP
 ↓
TLS
 ↓
TTFB
 ↓
HTTP response
 ↓
CDN edge
 ↓
origin
```

In my case, the website looked like a CloudFront performance problem.

It wasn't.

The CloudFront distribution was fine. The S3 origin was fine. Route 53 was fine.

The interesting difference was happening **before the request even reached the edge I expected**.

That's the kind of thing managed platforms make easy to ignore.

And, honestly, that's exactly why I wanted to do this migration in the first place.

---

## The final setup

```
                         GitHub
                            │
                         git push
                            │
                            ▼
                    GitHub Actions
                            │
                         OIDC
                            │
                            ▼
                       AWS IAM
                            │
                      temporary creds
                            │
                            ▼
                       Astro build
                            │
                            ▼
                   ┌─────────────────┐
                   │   Private S3    │
                   │  website files  │
                   └────────┬────────┘
                            │
                          origin
                            │
                            ▼
                   ┌─────────────────┐
                   │   CloudFront    │
                   │    BOM78-P11    │
                   └────────┬────────┘
                            │
                            ▼
                       Route 53
                       /       \
                      /         \
                     ▼           ▼
             smitmistry.com    www
```

The site is now deployed entirely from GitHub, the S3 origin isn't public, AWS access from CI uses short-lived credentials, and requests from my network reach the Mumbai CloudFront edge.

More importantly, I now understand the stack instead of just knowing which button to press.
