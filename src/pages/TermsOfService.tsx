import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function TermsOfService() {
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

        <h1 className="text-3xl font-display font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: March 8, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Ignite HabitPro ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. We reserve the right to update these Terms at any time, and your continued use constitutes acceptance of those changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ignite HabitPro is a habit tracking and personal productivity platform that allows users to create and manage habits, set goals, track streaks, participate in challenges, join community groups, and engage with accountability partners. The Service is available via web browser and mobile applications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Account Registration</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 13 years old to create an account.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws.</li>
              <li>Harass, abuse, or threaten other users through community features or messaging.</li>
              <li>Post offensive, misleading, or harmful content in community groups.</li>
              <li>Attempt to gain unauthorized access to other users' accounts or data.</li>
              <li>Use automated tools, bots, or scripts to interact with the Service.</li>
              <li>Manipulate leaderboards, streaks, or challenge progress through fraudulent means.</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Points, Badges & Virtual Items</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service includes a points system, badges, XP levels, and virtual shop items. These are for personal engagement purposes only and hold no monetary value. We reserve the right to modify, reset, or remove virtual items and points at any time without prior notice. Virtual items cannot be transferred, traded, or exchanged for real currency.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Community Guidelines</h2>
            <p className="text-muted-foreground leading-relaxed">
              Community groups and messaging features are provided to foster positive interaction. We reserve the right to remove content or suspend accounts that violate these Terms or community standards. Users are expected to be respectful and supportive of one another.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, design, logos, and software associated with Ignite HabitPro are owned by us and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works from any part of the Service without our prior written consent. Content you create (habits, journal entries, goals) remains yours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to keep the Service available at all times but do not guarantee uninterrupted access. We may temporarily suspend the Service for maintenance, updates, or circumstances beyond our control. We are not liable for any loss of data or disruption caused by downtime.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate your account at our discretion if you violate these Terms. You may delete your account at any time. Upon termination, your right to use the Service ceases immediately, and we may delete your data in accordance with our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided "as is" and "as available" without warranties of any kind. To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to loss of data, loss of profits, or interruption of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of the Service shall be resolved through good-faith negotiation before pursuing formal legal action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at{" "}
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
