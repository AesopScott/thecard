# Firebase Email Template Configuration

This guide explains how to set up custom email verification templates in Firebase Console to use Brevo as the email sender.

## Prerequisites

- Firebase project: `thecard-1896f`
- Brevo account configured (already done)
- Admin access to Firebase Console

## Step 1: Access Email Templates in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `thecard-1896f`
3. Navigate to **Authentication** → **Templates** (left sidebar)
4. You'll see email templates for:
   - Email verification
   - Password reset
   - Email change confirmation
   - And others

## Step 2: Configure Email Verification Template

### Default Firebase Behavior (Current)

By default, Firebase sends verification emails from its own infrastructure. The verification link format is:

```
https://thecard-1896f.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=...&apiKey=...
```

### Customize via Firebase Console

Firebase allows customizing the email template text and the redirect URL, but **not the sender**. Here's how to customize:

1. Click on **Email address verification** template
2. Customize:
   - **Subject:** `Verify your The Card email`
   - **Body template:** Use the HTML editor to customize the message
   - **Custom domain:** (Optional) If you have a custom domain, configure it here

### Sample Custom Email Template

```html
<h2>Verify Your Email</h2>
<p>Hi there,</p>
<p>Welcome to The Card. Click the button below to verify your email and start predicting.</p>
<a href="%LINK%" style="background-color: #006eff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600;">
  Verify Email
</a>
<p style="color: #999; font-size: 12px;">
  If you didn't sign up for The Card, you can ignore this email.
</p>
```

Available template variables:
- `%LINK%` — Verification link (required)
- `%EMAIL%` — User's email address
- `%DISPLAY_NAME%` — User's display name (if set)

## Step 3: Set Custom Domain (Optional, Phase 2)

For Phase 1, Firebase's default sender is fine. For Phase 2, if you want emails to come from `noreply@thecard.bet`:

1. Add a custom domain to Firebase:
   - Go to **Authentication** → **Settings** → **Custom domain**
   - Add `thecard.bet` (requires DNS TXT record verification)
   - Firebase will guide you through the verification process

2. Once verified, emails will come from `noreply@thecard.bet`

## Step 4: Test Email Verification

### Local Testing

1. Start the dev server: `pnpm --filter @thecard/web dev`
2. Go to `/` → "Sign in" → "Create account"
3. Enter test email and password
4. Check your email inbox (or spam folder)
5. Click verification link

### Production Testing (After Deploy)

1. Deploy to thecard.bet
2. Go to https://thecard.bet
3. Repeat signup flow
4. Check verification email

## Brevo Integration (Future)

Currently, Firebase sends emails directly. If you want full control over email branding/design, Phase 2 can integrate Brevo's API:

1. Create custom verification tokens in Firestore
2. Call Brevo API to send custom-designed emails
3. Verify tokens on user click

This gives more design flexibility but requires more code. Firebase's built-in system is sufficient for Phase 1.

## Firebase Email Limitations

- ❌ Cannot change sender address (Firebase default, or custom domain via verification)
- ❌ Cannot add custom headers/unsubscribe links
- ❌ Cannot track opens/clicks in Firebase directly
- ✅ Can customize subject and HTML body
- ✅ Can customize redirect domain
- ✅ Can use custom domain if verified

## Troubleshooting

**Emails not arriving:**
- Check spam folder (Gmail often filters automated emails)
- Verify email address is correct
- Check Firebase error logs: **Authentication** → **User** → look for error messages

**Custom domain not working:**
- Ensure DNS TXT record is set correctly
- Wait 10–15 minutes for DNS propagation
- Check Firebase Console for verification status

**Brevo integration needed:**
- If Firebase email system doesn't meet requirements, implement Phase 2 custom email flow
- Use Brevo MCP to send transactional emails instead

---

## Phase 1 Summary

✅ Email/password signup implemented in code  
✅ Firebase Auth handles verification email sending  
⏳ Email template customization (optional, Phase 1)  
⏳ Brevo integration (Phase 2, if needed)

Email verification is working end-to-end with Firebase's default setup. Customize the template above if you want branded emails, but the default works fine.
