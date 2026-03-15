import React, { useState } from "react";
import { copy } from "../../../lib/copy";

/**
 * ActivityPanel - 统一的活动面板，通过 Tab 切换全局热力图和按 Source 分类热力图
 *
 * @param {Object} props
 * @param {React.ReactNode} props.globalHeatmap - 全局活动热力图（ActivityHeatmap 组件实例）
 * @param {React.ReactNode} props.sourceCards - 按 Source 分类的热力图卡片列表
 * @param {string} props.subtitle - AsciiBox 标题旁的描述文字
 * @param {boolean} props.hasSourceData - 是否有 source 数据可供展示
 */
export function ActivityPanel({ globalHeatmap, sourceCards, subtitle, hasSourceData = false }) {
  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { key: "all", label: copy("activity_panel.tab.all") },
    { key: "by_source", label: copy("activity_panel.tab.by_source") },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* Tab Bar */}
      {hasSourceData ? (
        <div className="flex items-center gap-1 px-1 pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide transition-all duration-200",
                  isActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
          {subtitle ? (
            <span className="ml-2 text-[11px] text-slate-400 font-normal">{subtitle}</span>
          ) : null}
        </div>
      ) : null}

      {/* Tab Content */}
      <div className="min-w-0">
        {activeTab === "all" ? (
          globalHeatmap
        ) : sourceCards ? (
          <div className="flex flex-col divide-y divide-slate-100">
            {sourceCards}
          </div>
        ) : null}
      </div>
    </div>
  );
}
