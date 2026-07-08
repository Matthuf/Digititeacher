"use client";

import dynamic from "next/dynamic";

export type { TourPin } from "./tours-overview-map-inner";

export const ToursOverviewMap = dynamic(
  () => import("./tours-overview-map-inner").then((mod) => mod.ToursOverviewMap),
  { ssr: false },
);
