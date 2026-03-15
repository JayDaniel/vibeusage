import React from "react";
import { DecodingText } from "../../foundation/DecodingText.jsx";
import { MatrixButton } from "../../foundation/MatrixButton.jsx";
import { GithubStar } from "../components/GithubStar.jsx";
import { ClientLogoRow } from "../components/ClientLogoRow.jsx";

function FlatCard({ children, className = "", header }) {
  return (
    <section className={`relative overflow-hidden bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] ${className}`}>
      {header ? (
        <header className="relative border-b border-[#E2E8F0] px-5 py-3.5">
          <span className="text-[13px] font-semibold text-[#1E293B]">{header}</span>
        </header>
      ) : null}
      <div className="relative p-5">{children}</div>
    </section>
  );
}




export function LandingView({
  copy,
  signUpUrl,
}) {

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-['Fira_Code',monospace] text-[#1E293B] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 z-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
      
      {/* Header */}
      <div className="fixed top-4 sm:top-6 right-4 sm:right-6 z-[70] flex items-center gap-3">
        <GithubStar isFixed={false} size="header" />
        <MatrixButton as="a" href={signUpUrl} size="header" className="ui-chip--solid">
          <span className="font-semibold text-[13px] text-white">
            {copy("landing.nav.login_signup")}
          </span>
        </MatrixButton>
      </div>

      {/* Main content */}
      <main className="w-full max-w-4xl relative z-10 flex flex-col items-center space-y-8 sm:space-y-12 py-8 sm:py-12">
        
        {/* Hero section */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-extrabold text-[#1E293B] tracking-tighter leading-none select-none">
            <DecodingText text={copy("landing.hero.title_primary")} /> <br />
            <span className="text-[#2563EB]">
              <DecodingText text={copy("landing.hero.title_secondary")} />
            </span>
          </h1>

          <div className="flex flex-col items-center space-y-4">
            <ClientLogoRow />
            <p className="text-sm text-[#64748B] max-w-lg text-center leading-relaxed">
              {copy("landing.hero.subtagline")}
            </p>
          </div>
        </div>




        {/* Features Card */}
        <FlatCard className="w-full max-w-2xl" header="Features">
          <div className="space-y-5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
              {copy("landing.seo.title")}
            </h2>
            <p className="text-[14px] text-[#64748B] leading-relaxed">
              {copy("landing.seo.summary")}
            </p>
            <ul className="space-y-3">
              {[copy("landing.seo.point1"), copy("landing.seo.point2"), copy("landing.seo.point3")].map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-[#475569]">
                  <span className="shrink-0 flex items-center justify-center w-6 h-6 bg-[#DBEAFE] rounded-md text-[#2563EB] text-[11px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="pt-3 border-t border-[#E2E8F0]">
              <p className="text-[12px] text-[#94A3B8] font-medium">
                {copy("landing.seo.roadmap")}
              </p>
            </div>
          </div>
        </FlatCard>

        {/* CTA */}
        <div className="w-full max-w-sm">
          <a
            href={signUpUrl}
            className="group relative block w-full text-center overflow-hidden rounded-xl"
          >
            <div className="relative bg-[#2563EB] text-white font-bold text-[15px] py-4 px-6 rounded-xl hover:bg-[#1D4ED8] transition-colors duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
              <span className="relative z-10">{copy("landing.cta.login_signup")}</span>
            </div>
          </a>
        </div>
        
        {/* Footer status line */}
        <div className="flex items-center gap-4 text-[12px] text-[#94A3B8] font-medium">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            v{copy("version") || "0.2.21"}
          </span>
          <span className="text-[#CBD5E1]">|</span>
          <span>{copy("landing.footer.system_ready")}</span>
        </div>
      </main>
    </div>
  );
}
