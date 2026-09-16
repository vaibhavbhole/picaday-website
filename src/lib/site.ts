export const SITE = {
  name: "PicADay.Vote",
  domain: "picaday.vote",
  url: "https://picaday.vote",
  operator: "Vaibhav Ninad Bhole",
  supportEmail: "vabsbhole2@gmail.com",
  processor: "BillDesk Neo",
  trialDays: 7,
  priceInr: "₹199",
  planName: "Inner Circle",
  updated: "16 September 2026",
} as const;

export const LEGAL_NAV = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
] as const;
