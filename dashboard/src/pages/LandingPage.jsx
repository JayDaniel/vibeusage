import React from "react";
import { copy } from "../lib/copy";
import { LandingView } from "../ui/views-components/views/LandingView.jsx";

export function LandingPage({ signUpUrl }) {
  return (
    <LandingView
      copy={copy}
      signUpUrl={signUpUrl}
    />
  );
}

