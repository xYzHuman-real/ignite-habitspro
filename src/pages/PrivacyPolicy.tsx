import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-display font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 8, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Ignite HabitPro ("we", "our", or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web platform (collectively, the "Service").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Account Information:</strong> Name, email address, and password when you create an account.</li>
              <li><strong className="text-foreground">Profile Data:</strong> Display name, avatar, bio, and username you choose to provide.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Habits, goals, journal entries, to-dos, timer sessions, streaks, and challenge participation.</li>
              <li><strong className="text-foreground">Device Information:</strong> Device type, operating system, and browser type for improving the Service.</li>
              <li><strong className="text-foreground">Authentication Data:</strong> If you sign in with Google, we receive your name and email from Google.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>To provide, maintain, and improve the Service.</li>
              <li>To personalize your experience (streaks, XP levels, badges, leaderboards).</li>
              <li>To enable community features such as groups, partners, and messaging.</li>
              <li>To send notifications and reminders you've opted into.</li>
              <li>To generate weekly reports and analytics for your personal use.</li>
              <li>To respond to your requests and provide customer support.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do <strong className="text-foreground">not</strong> sell your personal data. We may share limited information in the following cases:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li><strong className="text-foreground">Community Features:</strong> Your display name, avatar, and selected stats may be visible to other users on leaderboards and in community groups you join.</li>
              <li><strong className="text-foreground">Accountability Partners:</strong> Users you connect with as partners can see shared streak data.</li>
              <li><strong className="text-foreground">Service Providers:</strong> We use trusted third-party services for hosting and authentication that process data on our behalf.</li>
              <li><strong className="text-foreground">Legal Requirements:</strong> If required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including encryption in transit (TLS/SSL), secure authentication, and row-level security policies to protect your data. However, no method of electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data as long as your account is active. You may request deletion of your account and associated data at any time by contacting us. Upon deletion, your data will be removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Access and receive a copy of your personal data.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>Delete your account and personal data.</li>
              <li>Withdraw consent for optional data processing.</li>
              <li>Object to data processing in certain circumstances.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is not intended for users under the age of 13. We do not knowingly collect personal data from children under 13. If you believe we have collected such data, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or your data, please contact us at{" "}
              <a href="mailto:support@ignitehabitpro.app" className="text-primary hover:underline">
                support@ignitehabitpro.app
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
