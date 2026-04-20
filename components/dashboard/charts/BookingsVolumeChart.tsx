"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

type BookingsVolumeChartProps = {
  labels: string[];
  newBookings: number[];
  completedBookings: number[];
  newSeriesName?: string;
  completedSeriesName?: string;
};

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function BookingsVolumeChart({
  labels,
  newBookings,
  completedBookings,
  newSeriesName = "New bookings",
  completedSeriesName = "Completed",
}: BookingsVolumeChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#2563eb", "#14b8a6"],
    stroke: {
      curve: "smooth",
      width: 3,
    },
    dataLabels: { enabled: false },
    fill: {
      gradient: {
        opacityFrom: 0.42,
        opacityTo: 0.04,
      },
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "#d1d5db",
    },
    xaxis: {
      categories: labels,
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (value) => `${Math.round(value)}`,
      },
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
        { name: newSeriesName, data: newBookings },
        { name: completedSeriesName, data: completedBookings },
      ]}
      type="area"
      height={320}
    />
  );
}
