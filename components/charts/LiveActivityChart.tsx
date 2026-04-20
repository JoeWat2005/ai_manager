"use client";

import { useEffect, useState } from "react";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const BASE_SERIES = [18, 24, 29, 22, 34, 31, 39, 44, 37, 42, 48, 53, 46, 58, 62];

export function LiveActivityChart() {
  const [series, setSeries] = useState<number[]>(BASE_SERIES);

  useEffect(() => {
    const id = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1] ?? 50;
        const next = Math.max(5, Math.min(99, last + (Math.random() * 18 - 7)));
        const updated = [...prev.slice(1), Math.round(next)];
        return updated;
      });
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      animations: {
        enabled: true,
        dynamicAnimation: { speed: 900 },
      },
      sparkline: { enabled: true },
      background: "transparent",
      fontFamily: "inherit",
    },
    stroke: { curve: "smooth", width: 2.5 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.0,
        stops: [0, 100],
      },
    },
    colors: ["hsl(var(--primary))"],
    tooltip: { enabled: false },
    xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { show: false },
    grid: { show: false },
  };

  return (
    <Chart
      options={options}
      series={[{ name: "Activity", data: series }]}
      type="area"
      height={72}
      width="100%"
    />
  );
}
