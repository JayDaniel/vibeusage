import { Button } from "@base-ui/react/button";
import React from "react";
import { AsciiBox } from "../../foundation/AsciiBox.jsx";
import { MatrixButton } from "../../foundation/MatrixButton.jsx";
import { MatrixShell } from "../../foundation/MatrixShell.jsx";
import { CostAnalysisModal } from "../components/CostAnalysisModal.jsx";
import { IdentityCard } from "../components/IdentityCard.jsx";
import { NeuralDivergenceMap } from "../components/NeuralDivergenceMap.jsx";
import { RollingUsagePanel } from "../components/RollingUsagePanel.jsx";
import { TopModelsPanel } from "../components/TopModelsPanel.jsx";
import { TrendMonitor } from "../components/TrendMonitor.jsx";
import { UsagePanel } from "../components/UsagePanel.jsx";

export function DashboardView(props) {
  const {
    copy,
    headerStatus,
    headerRight,
    footerLeftContent,
    screenshotMode,
    publicViewInvalid,
    publicViewInvalidTitle,
    publicViewInvalidBody,
    showExpiredGate,
    showAuthGate,
    sessionExpiredCopied,
    sessionExpiredCopiedLabel,
    sessionExpiredCopyLabel,
    handleCopySessionExpired,
    signInUrl,
    signUpUrl,
    screenshotTitleLine1,
    screenshotTitleLine2,
    identityDisplayName,
    identityStartDate,
    activeDays,
    identitySubscriptions,
    identityScrambleDurationMs,
    projectUsageBlock,
    topModels,
    signedIn,
    publicMode,
    shouldShowInstall,
    installPrompt,
    handleCopyInstall,
    installCopied,
    installCopiedLabel,
    installCopyLabel,
    installInitCmdDisplay,
    linkCodeLoading,
    linkCodeError,
    publicViewTitle,
    handleTogglePublicView,
    publicViewBusy,
    publicViewEnabled,
    publicViewToggleLabel,
    publicViewStatusLabel,
    publicViewCopyButtonLabel,
    handleCopyPublicView,
    trendRowsForDisplay,
    trendFromForDisplay,
    trendToForDisplay,
    period,
    trendTimeZoneLabel,
    activityHeatmapBlock,
    isCapturing,
    handleShareToX,
    screenshotTwitterLabel,
    screenshotTwitterButton,
    screenshotTwitterHint,
    periodsForDisplay,
    setSelectedPeriod,
    metricsRows,
    summaryLabel,
    summaryValue,
    summaryCostValue,
    rollingUsage,
    costInfoEnabled,
    openCostModal,
    allowBreakdownToggle,
    coreIndexCollapsed,
    setCoreIndexCollapsed,
    coreIndexCollapseLabel,
    coreIndexExpandLabel,
    coreIndexCollapseAria,
    coreIndexExpandAria,
    refreshAll,
    usageLoadingState,
    usageError,
    rangeLabel,
    timeZoneRangeLabel,
    usageSourceLabel,
    fleetData,
    hasDetailsActual,
    dailyEmptyPrefix,
    installSyncCmd,
    dailyEmptySuffix,
    detailsColumns,
    ariaSortFor,
    toggleSort,
    sortIconFor,
    pagedDetails,
    detailsDateKey,
    renderDetailDate,
    renderDetailCell,
    DETAILS_PAGED_PERIODS,
    detailsPageCount,
    detailsPage,
    setDetailsPage,
    costModalOpen,
    closeCostModal,
  } = props;

  return (
    <>
      <MatrixShell
        hideHeader
        headerStatus={headerStatus}
        headerRight={headerRight}
        footerLeft={footerLeftContent ? <span>{footerLeftContent}</span> : null}
        footerRight={<span className="font-semibold">{copy("dashboard.footer.right")}</span>}
        contentClassName=""
        rootClassName={screenshotMode ? "screenshot-mode" : ""}
      >
        {publicViewInvalid ? (
          <div className="mb-6">
            <AsciiBox title={publicViewInvalidTitle}>
              <p className="text-[12px] text-[#64748B] mt-0">{publicViewInvalidBody}</p>
            </AsciiBox>
          </div>
        ) : null}
        {showExpiredGate ? (
          <div className="mb-6">
            <AsciiBox
              title={copy("dashboard.session_expired.title")}
              subtitle={copy("dashboard.session_expired.subtitle")}
            >
              <p className="text-[12px] mt-0 flex flex-wrap items-center gap-2">
                <span className="text-[#64748B]">{copy("dashboard.session_expired.body")}</span>
                <MatrixButton
                  className="px-2 py-1 text-[11px]"
                  onClick={handleCopySessionExpired}
                >
                  {sessionExpiredCopied ? sessionExpiredCopiedLabel : sessionExpiredCopyLabel}
                </MatrixButton>
                <span className="text-[#64748B]">{copy("dashboard.session_expired.body_tail")}</span>
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <MatrixButton as="a" primary href={signInUrl}>
                  {copy("shared.button.sign_in")}
                </MatrixButton>
                <MatrixButton as="a" href={signUpUrl}>
                  {copy("shared.button.sign_up")}
                </MatrixButton>
              </div>
            </AsciiBox>
          </div>
        ) : showAuthGate ? (
          <div className="flex items-center justify-center">
            <AsciiBox
              title={copy("dashboard.auth_required.title")}
              subtitle={copy("dashboard.auth_required.subtitle")}
              className="w-full max-w-2xl"
            >
              <p className="text-[12px] text-[#64748B] mt-0">{copy("dashboard.auth_required.body")}</p>

              <div className="flex flex-wrap gap-3 mt-4">
                <MatrixButton as="a" primary href={signInUrl}>
                  {copy("shared.button.sign_in")}
                </MatrixButton>
                <MatrixButton as="a" href={signUpUrl}>
                  {copy("shared.button.sign_up")}
                </MatrixButton>
              </div>
            </AsciiBox>
          </div>
        ) : (
          <div className="flex flex-col gap-2 md:gap-2.5">
            {/* -- Row 1: Account + Stats (left) | Usage Overview (right) -- */}
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-12 lg:gap-2.5">
              <div className="lg:col-span-6 animate-fade-in-up min-w-0 flex flex-col gap-2">
                {screenshotMode ? (
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-3xl md:text-4xl font-extrabold text-[#1E293B] tracking-[-0.03em] leading-none">
                        {screenshotTitleLine1}
                      </span>
                      <span className="text-2xl md:text-3xl font-extrabold text-[#64748B] tracking-[-0.03em] leading-none">
                        {screenshotTitleLine2}
                      </span>
                    </div>
                  </div>
                ) : null}
                <IdentityCard
                  title={copy("dashboard.identity.title")}
                  subtitle={copy("dashboard.identity.subtitle")}
                  name={identityDisplayName}
                  avatarUrl={null}
                  isPublic
                  rankLabel={identityStartDate ?? copy("identity_card.rank_placeholder")}
                  streakDays={activeDays}
                  subscriptions={identitySubscriptions}
                  animateTitle={false}
                  scrambleDurationMs={identityScrambleDurationMs}
                />
                <RollingUsagePanel rolling={rollingUsage} costValue={summaryCostValue} className="animate-pulse-glow flex-1" />
              </div>
              <div className="lg:col-span-6 animate-fade-in-up-d1 min-w-0">
                <UsagePanel
                  title={copy("usage.panel.title")}
                  period={period}
                  periods={periodsForDisplay}
                  onPeriodChange={setSelectedPeriod}
                  metrics={metricsRows}
                  showSummary={period === "total"}
                  useSummaryLayout
                  summaryLabel={summaryLabel}
                  summaryValue={summaryValue}
                  summaryCostValue={summaryCostValue}
                  onCostInfo={costInfoEnabled ? openCostModal : null}
                  breakdownCollapsed={allowBreakdownToggle ? coreIndexCollapsed : true}
                  onToggleBreakdown={
                    allowBreakdownToggle ? () => setCoreIndexCollapsed((value) => !value) : null
                  }
                  collapseLabel={allowBreakdownToggle ? coreIndexCollapseLabel : undefined}
                  expandLabel={allowBreakdownToggle ? coreIndexExpandLabel : undefined}
                  collapseAriaLabel={allowBreakdownToggle ? coreIndexCollapseAria : undefined}
                  expandAriaLabel={allowBreakdownToggle ? coreIndexExpandAria : undefined}
                  onRefresh={screenshotMode ? null : refreshAll}
                  loading={usageLoadingState}
                  error={usageError}
                  rangeLabel={screenshotMode ? null : rangeLabel}
                  rangeTimeZoneLabel={timeZoneRangeLabel}
                  statusLabel={screenshotMode ? null : usageSourceLabel}
                  summaryScrambleDurationMs={identityScrambleDurationMs}
                  summaryAnimate={false}
                  className="h-full"
                />
              </div>
            </div>

            {/* -- Row 2: Trend Chart | Model Breakdown -- */}
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-12 lg:gap-2.5">
              <div className="lg:col-span-8 animate-fade-in-up-d2 min-w-0">
                {!screenshotMode ? (
                  <TrendMonitor
                    rows={trendRowsForDisplay}
                    from={trendFromForDisplay}
                    to={trendToForDisplay}
                    period={period}
                    timeZoneLabel={trendTimeZoneLabel}
                    showTimeZoneLabel={false}
                    className="h-full min-h-[200px]"
                  />
                ) : null}
              </div>
              <div className="lg:col-span-4 animate-fade-in-up-d2 min-w-0">
                <NeuralDivergenceMap fleetData={fleetData} className="min-w-0 h-full" footer={null} />
              </div>
            </div>

            {/* -- Row 3: Activity Heatmap | Top Models -- */}
            {!screenshotMode ? (
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-12 lg:gap-2.5">
                <div className="lg:col-span-8 animate-fade-in-up-d3 min-w-0">
                  {activityHeatmapBlock}
                </div>
                <div className="lg:col-span-4 animate-fade-in-up-d3 min-w-0">
                  <TopModelsPanel rows={topModels} />
                </div>
              </div>
            ) : (
              <>
                {activityHeatmapBlock}
              </>
            )}




            {/* -- Row 5: Auth / Install / Public Profile -- */}
            {!screenshotMode && !signedIn && !publicMode ? (
              <div className="animate-fade-in-up-d6">
                <AsciiBox
                  title={copy("dashboard.auth_optional.title")}
                  subtitle={copy("dashboard.auth_optional.subtitle")}
                >
                  <p className="text-[12px] text-[#64748B] mt-0">
                    {copy("dashboard.auth_optional.body")}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <MatrixButton as="a" primary href={signInUrl}>
                      {copy("shared.button.sign_in")}
                    </MatrixButton>
                    <MatrixButton as="a" href={signUpUrl}>
                      {copy("shared.button.sign_up")}
                    </MatrixButton>
                  </div>
                </AsciiBox>
              </div>
            ) : null}

            {shouldShowInstall ? (
              <div className="animate-fade-in-up-d6">
                <AsciiBox
                  title={copy("dashboard.install.title")}
                  subtitle={copy("dashboard.install.subtitle")}
                  className="relative"
                >
                  <div className="text-[13px] font-medium text-[#64748B]">
                    {installPrompt}
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <MatrixButton
                      onClick={handleCopyInstall}
                      aria-label={installCopied ? installCopiedLabel : installCopyLabel}
                      title={installCopied ? installCopiedLabel : installCopyLabel}
                      className="w-full justify-between gap-3 normal-case px-3"
                    >
                      <span className="font-mono text-[12px] tracking-[0.02em] normal-case text-left text-[#1E293B]">
                        {installInitCmdDisplay}
                      </span>
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md">
                        {installCopied ? (
                          <svg
                            viewBox="0 0 16 16"
                            className="w-4 h-4 text-emerald-600"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M6.4 11.2 3.2 8l1.1-1.1 2.1 2.1 5-5L12.5 5z" />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 16 16"
                            className="w-4 h-4 text-[#64748B]"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M11 1H4a1 1 0 0 0-1 1v9h1V2h7V1z" />
                            <path d="M5 4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4zm1 0v9h6V4H6z" />
                          </svg>
                        )}
                      </span>
                    </MatrixButton>
                    {linkCodeLoading ? (
                      <span className="text-[12px] text-[#94A3B8]">
                        {copy("dashboard.install.link_code.loading")}
                      </span>
                    ) : linkCodeError ? (
                      <span className="text-[12px] text-red-500">
                        {copy("dashboard.install.link_code.failed")}
                      </span>
                    ) : null}
                  </div>
                </AsciiBox>
              </div>
            ) : null}


            {screenshotMode ? (
              <div
                className="mt-4 flex flex-col items-center gap-2"
                data-screenshot-exclude="true"
                style={isCapturing ? { display: "none" } : undefined}
              >
                <MatrixButton
                  type="button"
                  onClick={handleShareToX}
                  aria-label={screenshotTwitterLabel}
                  title={screenshotTwitterLabel}
                  className="h-12 md:h-14 px-6 text-base"
                  primary
                  disabled={isCapturing}
                >
                  {screenshotTwitterButton}
                </MatrixButton>
                <span className="text-[11px] text-[#94A3B8]">
                  {screenshotTwitterHint}
                </span>
              </div>
            ) : null}

            {/* -- Row 6: Daily Details Table -- */}
            {!screenshotMode ? (
              <div className="animate-fade-in-up-d8">
                <AsciiBox
                  title={copy("dashboard.daily.title")}
                  subtitle={copy("dashboard.daily.subtitle")}
                >
                  {!hasDetailsActual ? (
                    <div className="text-[12px] text-[#94A3B8] mb-2">
                      {dailyEmptyPrefix}
                      <code className="px-1.5 py-0.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded text-[#1E293B] text-[11px]">
                        {installSyncCmd}
                      </code>
                      {dailyEmptySuffix}
                    </div>
                  ) : null}
                  <div
                    className="overflow-x-auto border border-white/80 shadow-md rounded-2xl bg-white/50 backdrop-blur-md ui-scrollbar"
                    role="region"
                    aria-label={copy("daily.table.aria_label")}
                    tabIndex={0}
                  >
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 bg-white/60 backdrop-blur-md z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <tr>
                          {detailsColumns.map((c) => (
                            <th
                              key={c.key}
                              aria-sort={ariaSortFor(c.key)}
                              className="text-left p-0"
                            >
                              <Button
                                type="button"
                                onClick={() => toggleSort(c.key)}
                                title={c.title}
                                className="w-full px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 flex items-center justify-start transition-colors rounded-md"
                              >
                                <span className="inline-flex items-center gap-2">
                                  <span>{c.label}</span>
                                  <span className="text-[#CBD5E1]">{sortIconFor(c.key)}</span>
                                </span>
                              </Button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedDetails.map((r) => (
                          <tr
                            key={String(
                              r?.[detailsDateKey] || r?.day || r?.hour || r?.month || "",
                            )}
                            className={`border-b border-white/50 hover:bg-white/80 transition-all duration-300 ${
                              r.missing
                                ? "text-slate-400"
                                : r.future
                                  ? "text-slate-300"
                                  : ""
                            }`}
                          >
                            <td className="px-3 py-2.5 text-[12px] text-slate-500 font-mono">
                              {renderDetailDate(r)}
                            </td>
                            <td className="px-3 py-2.5 text-[12px] font-mono font-semibold">
                              {renderDetailCell(r, "total_tokens")}
                            </td>
                            <td className="px-3 py-2.5 text-[12px] font-mono">
                              {renderDetailCell(r, "input_tokens")}
                            </td>
                            <td className="px-3 py-2.5 text-[12px] font-mono">
                              {renderDetailCell(r, "output_tokens")}
                            </td>
                            <td className="px-3 py-2.5 text-[12px] font-mono">
                              {renderDetailCell(r, "cached_input_tokens")}
                            </td>
                            <td className="px-3 py-2.5 text-[12px] font-mono">
                              {renderDetailCell(r, "reasoning_output_tokens")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {DETAILS_PAGED_PERIODS.has(period) && detailsPageCount > 1 ? (
                    <div className="flex items-center justify-between mt-3 text-[11px] font-semibold">
                      <MatrixButton
                        type="button"
                        onClick={() => setDetailsPage((prev) => Math.max(0, prev - 1))}
                        disabled={detailsPage === 0}
                      >
                        {copy("details.pagination.prev")}
                      </MatrixButton>
                      <span className="text-[#94A3B8]">
                        {copy("details.pagination.page", {
                          page: detailsPage + 1,
                          total: detailsPageCount,
                        })}
                      </span>
                      <MatrixButton
                        type="button"
                        onClick={() =>
                          setDetailsPage((prev) => Math.min(detailsPageCount - 1, prev + 1))
                        }
                        disabled={detailsPage + 1 >= detailsPageCount}
                      >
                        {copy("details.pagination.next")}
                      </MatrixButton>
                    </div>
                  ) : null}
                </AsciiBox>
              </div>
            ) : null}
          </div>
        )}
      </MatrixShell>
      <CostAnalysisModal isOpen={costModalOpen} onClose={closeCostModal} fleetData={fleetData} />
    </>
  );
}
