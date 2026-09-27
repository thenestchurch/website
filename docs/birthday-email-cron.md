# Birthday email setup

The application exposes a protected endpoint for an external scheduler:

```text
GET https://YOUR_DEPLOYED_DOMAIN/api/jobs/birthday-emails
Authorization: Bearer YOUR_CRON_SECRET
```

The endpoint reads birthday settings and members directly from Postgres, sends through Resend, writes notification logs, and returns JSON. It will not send when birthday notifications are disabled. It also prevents overlapping runs, repeated completed runs on the same Lagos date, and duplicate member emails during retries.

## 1. Configure Resend

1. Add a domain or sending subdomain in the Resend dashboard. A subdomain such as `updates.thenestchurch.org` is a good choice for isolating email reputation.
2. Add the SPF and DKIM records Resend provides to the domain's DNS.
3. Wait until Resend marks the domain as verified.
4. Create a sending API key.

The `EMAIL_FROM` domain must exactly match the domain or subdomain verified in Resend.

## 2. Configure production environment variables

Add these values in the hosting provider, then redeploy:

```dotenv
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_...
EMAIL_FROM="The Nest Church <birthdays@updates.thenestchurch.org>"
CRON_SECRET=GENERATE_A_LONG_RANDOM_SECRET
```

Generate a 32-byte secret in PowerShell:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Do not put the API key or cron secret in source control or in the cron URL query string.

## 3. Enable birthday notifications

In the custom admin, open **Admin > Birthdays > Settings** at
`/admin/members/birthdays/settings`:

- enable birthday notifications;
- check the member subject and body;
- optionally add admin summary email addresses.

The external scheduler controls the actual execution time.

## 4. Configure cron-job.org

Create a daily job with:

- URL: `https://YOUR_DEPLOYED_DOMAIN/api/jobs/birthday-emails`
- Method: `GET`
- Time zone: `Africa/Lagos`
- Time: for example `08:00`
- Custom header name: `Authorization`
- Custom header value: `Bearer YOUR_CRON_SECRET`
- Failure notification: enabled

Run the cron service's test execution after deployment. A successful response resembles:

```json
{
  "date": "2026-07-10",
  "dryRun": false,
  "failed": 0,
  "sent": 1,
  "skipped": 0,
  "status": "completed",
  "totalBirthdays": 1
}
```

`disabled`, `already-completed`, and `already-running` are safe successful responses. A member delivery failure returns HTTP 502 so the cron service can flag and retry it.

## Local checks

Dry-run against today's data without sending:

```powershell
corepack pnpm birthday:dry-run
```

Dry-run a known date:

```powershell
node scripts\send-birthday-emails.mjs --dry-run --force --verbose --date=2026-06-18
```
