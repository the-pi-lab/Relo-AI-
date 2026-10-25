import type { Metadata } from "next";
import { DataDeletionContent } from "@/components/relo/data-deletion";

export const metadata: Metadata = {
  title: "User Data Deletion Instructions & Request",
  description:
    "Official Meta Platform Terms §4.f data deletion instructions and automated request tool for RELO AI and Instagram.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function UserDataDeletionPage() {
  return <DataDeletionContent />;
}
