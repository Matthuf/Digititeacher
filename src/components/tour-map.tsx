"use client";

import dynamic from "next/dynamic";

export type { StationPin } from "./tour-map-inner";

export const TourMap = dynamic(
  () => import("./tour-map-inner").then((mod) => mod.TourMap),
  { ssr: false },
);
