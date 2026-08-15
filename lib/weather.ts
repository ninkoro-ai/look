import type { Weather } from "@/lib/types";
import { todayKey } from "@/lib/format";

const CONDITIONS = [
  { condition: "sunny", label: "晴" },
  { condition: "cloudy", label: "多云" },
  { condition: "rain", label: "小雨" },
] as const;

function monthSeason(): "summer" | "autumn" | "winter" | "spring" {
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

/**
 * 本地 Mock 天气：按月份给出一组稳定的数据，方便后续替换为真实天气 API。
 */
export function getMockWeather(): Weather {
  const season = monthSeason();
  const date = todayKey();
  const seed =
    parseInt(date.replace(/-/g, ""), 10) % CONDITIONS.length;
  const cond = CONDITIONS[seed];

  let high = 24;
  let low = 17;
  if (season === "summer") {
    high = 30 + (seed % 3);
    low = 24 + (seed % 2);
  } else if (season === "winter") {
    high = 8 + (seed % 5);
    low = 2 + (seed % 3);
  } else if (season === "spring") {
    high = 20 + (seed % 4);
    low = 13 + (seed % 2);
  } else {
    high = 17 + (seed % 4);
    low = 11 + (seed % 2);
  }

  const feelsLike = high - 1;
  const tip =
    cond.condition === "rain"
      ? "记得带伞，选一双防滑的鞋"
      : season === "summer"
        ? "紫外线偏强，配饰加一顶帽子更安心"
        : season === "winter"
          ? "早晚温差大，外套选厚实一点"
          : "体感舒适，可以大胆试新搭配";

  return {
    city: "上海",
    date,
    condition: cond.condition,
    conditionLabel: cond.label,
    high,
    low,
    feelsLike,
    humidity: 50 + (seed % 30),
    tip,
  };
}

export function weatherTags(weather: Weather): string[] {
  const tags: string[] = [];
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 8) tags.push("summer");
  if (m >= 3 && m <= 5) tags.push("spring");
  if (m >= 9 && m <= 11) tags.push("autumn");
  if (m <= 2 || m === 12) tags.push("winter");
  if (weather.high >= 26) tags.push("hot");
  if (weather.low <= 10) tags.push("cold");
  if (weather.condition === "rain") tags.push("rain");
  return tags;
}
