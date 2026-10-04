import { useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { useSeo } from "@/lib/seo";
import "./legal.css";

type DocKey = "privacy" | "terms";

interface Doc {
  title: string;
  updated: string;
  intro: string;
  sections: { h: string; p: string[]; list?: string[] }[];
}

const UPDATED = "3 October 2026";

/**
 * Privacy + Terms (plan.md §1, §5, §6). Written to describe exactly what the
 * shipped system does — Graph API only, retention cron, no email harvesting.
 * Marked as needing owner/legal review before the public launch.
 */
const DOCS: Record<DocKey, Doc> = {
  privacy: {
    title: "Privacy Policy",
    updated: UPDATED,
    intro:
      "RELO turns comments on your Instagram Reels into direct messages, using Meta's official Graph API. This policy explains exactly what we store and for how long.",
    sections: [
      {
        h: "Who this applies to",
        p: [
          "This policy covers the RELO creator account you create with your email, and the Instagram data connected to it. It does not cover the personal data of the people who comment on your Reels — that stays between you and them, and we never sell or share it.",
        ],
      },
      {
        h: "What we collect",
        list: [
          "Account data: your email address, Instagram username and Instagram-scoped user ID, granted via Meta's OAuth flow.",
          "Automation content: the trigger keywords, reply variations and DM card you write. This is your content and we only send it back out.",
          "Engagement data: the usernames and Instagram-scoped IDs of people who comment on Reels you automate, plus whether we sent them a DM.",
          "Aggregated clicks: counts of button clicks, recorded without any personal identifier.",
          "Billing records: plan, payment status and a UTR reference for manual UPI payments. Card details are handled by Lemon Squeezy and never touch our servers.",
        ],
        p: [
          "We do not ask commenters for their email address, phone number or any other contact detail, and we have no way to collect it.",
        ],
      },
      {
        h: "How long we keep it",
        list: [
          "Comment text is cleared 72 hours after it is matched — keywords only need to fire once.",
          "Completed or failed job records are deleted after 30 days.",
          "Webhook payloads are reduced to metadata and dropped after 7 days.",
          "Commenter identities (username and scoped ID) are kept, so your leads list stays intact.",
        ],
        p: [
          "This purge runs automatically every hour. If you disconnect or delete your account, your data is removed from our database within 30 days, except records we are legally required to retain, such as tax invoices.",
        ],
      },
      {
        h: "Who we share it with",
        p: [
          "We share data with exactly three categories of processor, each needed to run the product: Meta (Instagram messaging), our Cloudflare hosting and database provider, and our payment providers. We do not sell your data, and we do not share your audience with anyone.",
        ],
      },
      {
        h: "Your rights",
        p: [
          "You can export your captured leads as a CSV at any time, and you can disconnect your Instagram account and delete your account from Settings. If you want your data erased, or have any privacy question, email us at the address in the footer and we will respond within 30 days.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: UPDATED,
    intro:
      "These terms govern your use of RELO. By creating an account you agree to them. RELO is operated by The π Lab.",
    sections: [
      {
        h: "What RELO does",
        p: [
          "RELO is automation software that listens for comments on Instagram Reels you connect, matches them against keywords you define, and sends direct messages on your behalf through Meta's official Graph API. You choose the keywords, the replies and the buttons. We do not post content on your behalf and we do not scrape Instagram.",
        ],
      },
      {
        h: "Your account",
        p: [
          "One Instagram account is bound to one RELO account for the lifetime of that binding. On the Free plan this includes a single automated Reel which, once used, cannot be released by deleting the automation — only connecting a genuinely different Instagram account provides a new slot.",
        ],
      },
      {
        h: "Acceptable use",
        list: [
          "You must own or manage the Instagram account you connect, and you must have permission to send messages on it.",
          "You may not use RELO for spam, harassment, unsolicited bulk messaging, or to contact people who have not interacted with you.",
          "You may not attempt to resell, reverse-engineer or abuse the service, or circumvent plan limits.",
        ],
        p: [
          "Automated messaging is governed by Meta's platform policies as well as ours. If Meta restricts or removes your account, RELO cannot override that. We may suspend an account that puts the service or other users at risk.",
        ],
      },
      {
        h: "Plans, billing and refunds",
        p: [
          "Free is free forever. Pro and Studio are billed monthly or annually in advance, in INR or USD, excluding local taxes. Global payments are processed by Lemon Squeezy as merchant of record. Indian payments are made manually by UPI and activated after the owner verifies the transaction reference. Subscriptions renew automatically until cancelled, and can be cancelled at any time from Settings; cancellation takes effect at the end of the paid period.",
        ],
      },
      {
        h: "AI replies",
        p: [
          "On paid plans, an AI assistant answers product questions inside your DMs using only the product information you supply. AI output is not guaranteed to be accurate, and it always defers to you rather than guessing. You can switch AI replies off at any time, in which case your spintax replies are sent instead.",
        ],
      },
      {
        h: "Availability and liability",
        p: [
          "The service is provided as-is, without warranties. To the maximum extent permitted by law, our total liability is limited to the amount you paid us in the twelve months before the claim. We are not liable for lost profits, lost data, or any suspension of your Instagram account.",
        ],
      },
      {
        h: "Changes",
        p: [
          "If we change these terms materially we will tell you by email or an in-app notice before the change takes effect. Continued use after that notice means you accept the updated terms.",
        ],
      },
    ],
  },
};

export default function Legal({ doc }: { doc: DocKey }) {
  const d = DOCS[doc];

  useEffect(() => {
    const prev = document.title;
    document.title = `${d.title} — RELO`;
    return () => {
      document.title = prev;
    };
  }, [d.title]);

  useSeo({
    title: `${d.title} — RELO`,
    description: d.intro,
    path: `/${doc}`,
  });

  return (
    <div className="lg">
      <header className="lg-top">
        <Link to="/" className="lg-logo" aria-label="RELO home">
          <span className="lg-logo__mark" aria-hidden>
            R.
          </span>
          <span className="lg-logo__name">RELO</span>
        </Link>
      </header>

      <main className="lg-main">
        <Link to="/" className="lg-back">
          <ArrowLeft size={14} aria-hidden /> Back to home
        </Link>

        <span className="lg-eyebrow">Legal</span>
        <h1 className="lg-h1">{d.title}</h1>
        <p className="lg-lede">{d.intro}</p>
        <p className="lg-updated">Last updated {d.updated}</p>

        {d.sections.map((s) => (
          <section className="lg-sec" key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {s.list && (
              <ul>
                {s.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="lg-note">
          Questions? Email <a href="mailto:hello@thepilab.in">hello@thepilab.in</a>.
        </p>
      </main>

      <footer className="lg-foot">
        <span>© 2026 RELO — built by The π Lab</span>
        <nav aria-label="Legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href="mailto:hello@thepilab.in">
            <Mail size={12} aria-hidden /> Contact
          </a>
        </nav>
      </footer>
    </div>
  );
}
