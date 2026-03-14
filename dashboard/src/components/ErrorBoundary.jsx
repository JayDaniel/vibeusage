import { Button } from "@base-ui/react/button";
import React from "react";
import { copy } from "../lib/copy";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta?.env?.DEV) {
      console.error("ErrorBoundary caught an error:", error, info);
    } else {
      console.error("ErrorBoundary caught an error:", error);
    }
  }

  handleReload() {
    if (typeof window === "undefined") return;
    window.location.reload();
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const errorMessage = String(error?.message || error || "");
    const errorLabel = errorMessage
      ? copy("shared.error.prefix", { error: errorMessage })
      : copy("error.boundary.no_details");

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white border border-[#E2E8F0] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-8 text-center space-y-4">
          <div className="text-[12px] font-medium text-[#94A3B8]">
            {copy("error.boundary.title")}
          </div>
          <div className="text-2xl font-extrabold text-[#1E293B]">{copy("error.boundary.subtitle")}</div>
          <div className="text-[12px] text-[#94A3B8]">{copy("error.boundary.hint")}</div>
          <div className="text-[12px] text-red-500 break-words">{errorLabel}</div>
          <Button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#2563EB] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors"
          >
            {copy("error.boundary.action.reload")}
          </Button>
        </div>
      </div>
    );
  }
}
