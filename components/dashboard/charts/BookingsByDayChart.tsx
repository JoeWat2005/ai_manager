"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

type BookingsByDayChartProps = {
  days: string[];
  confirmed: number[];
  noShows: number[];
};

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function BookingsByDayChart({
  days,
  confirmed,
  noShows,
}: BookingsByDayChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
      stacked: true,
    },
    colors: ["#0ea5e9", "#f97316"],
    dataLabels: { enabled: false },
    grid: {
      strokeDashArray: 4,
      borderColor: "#d1d5db",
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        columnWidth: "44%",
      },
    },
    xaxis: {
      categories: days,
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  return (
    <Chart
      options={options}
      series={[
        { name: "Confirmed", data: confirmed },
        { name: "No-shows", data: noShows },
      ]}
      type="bar"
      height={320}
    />
  );
}
