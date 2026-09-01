# Play Store release checklist

This project is not ready for production release until every required item below is complete.

## Required account setup

1. Create the app in Google Play Console using package ID `app.lovable.ignitehabitspro`.
2. Enrol in Play App Signing and create one upload keystore. Keep its original file offline.
3. Add these GitHub Actions secrets before running **Build Play Store bundle**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
4. Run the workflow and upload its `.aab` artifact to an Internal testing track. Do not upload the debug APK workflow output to Play Console.

## Product blockers

- [ ] Integrate real Google Play Billing for Premium subscriptions.
- [ ] Verify every Play purchase on the server before granting Premium.
- [ ] Restore purchases and handle renewals, cancellations, refunds, grace periods, and account holds.
- [ ] Create subscription products and offers in Play Console.
- [ ] Remove the temporary “purchases unavailable” screen only after the verified billing flow works.
- [ ] Commit and test the native Android implementation for focus/app blocking. The current repository has instructions but no committed plugin implementation.
- [ ] Remove `.env` from Git history and configure builds through GitHub secrets. The checked-in values are frontend configuration, but environment files should not be tracked.
- [ ] Review every Android permission. Do not request `USE_EXACT_ALARM`, usage access, or package visibility unless the shipped feature needs it and its Play declaration is approved.
- [ ] Add content reporting, blocking, moderation, and an abuse-response process for community messages.

## Testing and store submission

- [ ] Add tests for auth, premium entitlements, account deletion, timer accuracy, and Supabase row-level security.
- [ ] Test an Internal testing bundle on a physical Android device.
- [ ] Test sign-up, password reset, Google sign-in, deletion, notifications, offline/error handling, and every restricted feature.
- [ ] Set versionCode higher for every subsequent bundle.
- [ ] Complete App access, Data safety, content rating, target audience, privacy-policy URL, screenshots, icon, and store listing.
- [ ] Provide Play review with test credentials and steps to reach all login-gated features.
