import { render, screen } from "@testing-library/react";
import { copy } from "../../../../lib/copy";
import { formatCompactNumber } from "../../../../lib/format";
import { RollingUsagePanel } from "../RollingUsagePanel.jsx";

it("renders rolling usage values", () => {
  const rolling = {
    last_7d: {
      totals: { billable_total_tokens: "12000" },
      active_days: 3,
      avg_per_active_day: "4000",
    },
    last_30d: {
      totals: { billable_total_tokens: "30000" },
      active_days: 10,
      avg_per_active_day: "3000",
    },
  };

  render(<RollingUsagePanel rolling={rolling} />);

  const compact = (value) =>
    formatCompactNumber(value, {
      thousandSuffix: "K",
      millionSuffix: "M",
      billionSuffix: "B",
    });

  expect(screen.getByText(copy("dashboard.rolling.title"))).toBeInTheDocument();
  expect(screen.getByText(copy("dashboard.rolling.last_7d"))).toBeInTheDocument();
  expect(screen.getByText(copy("dashboard.rolling.last_30d"))).toBeInTheDocument();
  expect(screen.getByText(copy("dashboard.rolling.avg_active_day"))).toBeInTheDocument();

  expect(screen.getByText(compact("12000"))).toBeInTheDocument();
  expect(screen.getByText(compact("30000"))).toBeInTheDocument();
  expect(screen.getByText(compact("3000"))).toBeInTheDocument();
});

it("adapts to narrow layouts", () => {
  const { container } = render(<RollingUsagePanel rolling={{}} />);
  const grid = container.querySelector(".grid");
  expect(grid).toHaveClass("grid-cols-2");
  expect(grid).toHaveClass("lg:grid-cols-3");
});
