import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PicADay.Vote",
  description: "One shared agenda. Twenty-four hours. Community-chosen champions.",
  icons: {
    icon: [{ url: "/brand/picaday-vote-logo.png", type: "image/png" }],
    apple: [{ url: "/brand/picaday-vote-logo.png" }],
    shortcut: ["/brand/picaday-vote-logo.png"],
  },
  openGraph: {
    siteName: "PicADay.Vote",
    images: [{ url: "/brand/picaday-vote-logo.png", alt: "PicADay.Vote" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
