import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full">
          <div className="mb-8 flex justify-center">
            <BrandLogo size="lg" />
          </div>
          {children}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
