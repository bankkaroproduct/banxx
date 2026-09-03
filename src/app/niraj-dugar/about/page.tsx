import type { Metadata } from "next";
import NirajAbout from "@/views/NirajAbout";

export const metadata: Metadata = {
  title: "About Niraj Dugar — Credit Card Expert",
  description:
    "Learn about Niraj Dugar, India's trusted credit card advisor helping you make smarter financial decisions.",
  robots: "index, follow",
};

export default function NirajAboutPage() {
  return <NirajAbout />;
}
