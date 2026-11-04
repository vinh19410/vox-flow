import { FORECAST_P1 } from "./topics-p1";
import { FORECAST_P23 } from "./topics-p23";
import type { ForecastTopic } from "./types";

export interface ForecastQuarter {
  label: string;
  range: string;
  updated: string;
}

export const QUARTER: ForecastQuarter = {
  label: "Quý 2/2025",
  range: "Tháng 5 – Tháng 8",
  updated: "28/04/2025",
};

export const FORECAST: ForecastTopic[] = [...FORECAST_P1, ...FORECAST_P23];
