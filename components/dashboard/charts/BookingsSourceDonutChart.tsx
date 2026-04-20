"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

type SourceItem = {
  label: string;
  value: number;
};

type BookingsSourceDonutChartProps = {
  items: SourceItem[];
  totalLabel?: string;
};

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function BookingsSourceDonutChart({
  items,
  totalLabel = "Bookings",
}: BookingsSourceDonutChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    labels: items.map((item) => item.label),
    colors: ["#2563eb", "#14b8a6", "#f97316", "#8b5cf6"],
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      formatter: (seriesName, opts) => {
        const value = opts?.w?.globals?.series?.[opts.seriesIndex ?? 0] ?? 0;
        return `${seriesName}: ${value}`;
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: totalLabel,
              formatter: () =>
                `${items.reduce((total, item) => total + item.value, 0)}`,
            },
          },
        },
      },
    },
  };

  return (
    <Chart
      options={options}
      series={items.map((item) => item.value)}
      type="donut"
      height={320}
    />
  );
}
