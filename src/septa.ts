import { format, addSeconds, parse, differenceInSeconds } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { 
  SeptaScheduleEntry, 
  SeptaLiveTrip, 
  Departure, 
  SeptaRoute,
  SeptaStop
} from './types';

const API_V2 = "https://www3.septa.org/api/v2";
const API_FLAT = "https://flat-api.septa.org";
const TIMEZONE = "America/New_York";

function parseTimeToSeconds(tStr: string): number {
  const parts = tStr.split(":");
  const h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  const s = parseInt(parts[2]);
  return h * 3600 + m * 60 + s;
}

export async function getRouteInfo(routeId: string): Promise<SeptaRoute | null> {
  try {
    const response = await fetch(`${API_V2}/routes/`);
    if (!response.ok) return null;
    const routes = await response.json() as SeptaRoute[];
    const normalizedRouteId = routeId.toString().trim();
    return routes.find(r => r.route_id.toString().trim() === normalizedRouteId) || null;
  } catch (error) {
    console.error("Error fetching route info:", error);
    return null;
  }
}

export async function getStopInfo(routeId: string, stopId: string): Promise<SeptaStop | null> {
  try {
    const response = await fetch(`${API_FLAT}/stops/${routeId.toString().trim()}/stops.json`);
    if (!response.ok) return null;
    const stops = await response.json() as SeptaStop[];
    const normalizedStopId = stopId.toString().trim();
    return stops.find(s => s.stop_id.toString().trim() === normalizedStopId) || null;
  } catch (error) {
    console.error("Error fetching stop info:", error);
    return null;
  }
}

export async function getDepartures(route: string, stopId: string): Promise<Departure[]> {
  const now = toZonedTime(new Date(), TIMEZONE);
  const nowSecs = parseTimeToSeconds(format(now, "HH:mm:ss"));

  // 1. Fetch Schedule
  let fullSchedule: SeptaScheduleEntry[] = [];
  try {
    const schedUrl = `${API_FLAT}/schedules/stops/${route}/${stopId}/schedule.json`;
    const rSched = await fetch(schedUrl);
    if (rSched.ok) {
      fullSchedule = await rSched.json() as SeptaScheduleEntry[];
    }
  } catch (error) {
    console.error("Error fetching schedule:", error);
  }

  if (fullSchedule.length === 0) return [];

  // 2. Fetch Live Trips
  const liveData: Record<string, SeptaLiveTrip> = {};
  try {
    const rTrips = await fetch(`${API_V2}/trips/?route_id=${route}`);
    if (rTrips.ok) {
      const trips = await rTrips.json() as SeptaLiveTrip[];
      for (const t of trips) {
        liveData[t.trip_id] = t;
      }
    }
  } catch (error) {
    console.error("Error fetching live trips:", error);
  }

  // 3. Infer Today's service_id
  const serviceIdCounts: Record<string, number> = {};
  for (const s of fullSchedule) {
    if (liveData[s.trip_id]) {
      const svcId = s.service_id;
      serviceIdCounts[svcId] = (serviceIdCounts[svcId] || 0) + 1;
    }
  }

  let todayServiceId: string | null = null;
  let maxCount = 0;
  for (const [svcId, count] of Object.entries(serviceIdCounts)) {
    if (count > maxCount) {
      maxCount = count;
      todayServiceId = svcId;
    }
  }

  if (!todayServiceId) {
    const counts: Record<string, number> = {};
    for (const s of fullSchedule) {
      const sid = s.service_id;
      counts[sid] = (counts[sid] || 0) + 1;
    }
    let bestSid: string | null = null;
    let maxSidCount = 0;
    for (const [sid, count] of Object.entries(counts)) {
      if (count > maxSidCount) {
        maxSidCount = count;
        bestSid = sid;
      }
    }
    todayServiceId = bestSid;
  }

  // 4. Deduplicate and Filter
  const uniqueTrips: Record<string, SeptaScheduleEntry> = {};
  for (const s of fullSchedule) {
    if (s.service_id !== todayServiceId) continue;

    const tid = s.trip_id;
    if (!uniqueTrips[tid] || (s.release_name || "") > (uniqueTrips[tid].release_name || "")) {
      uniqueTrips[tid] = s;
    }
  }

  const results: Departure[] = [];
  for (const s of Object.values(uniqueTrips)) {
    const schedSecs = parseTimeToSeconds(s.arrival_time);
    let delay = 0;
    let isLive = false;
    let stopsAway: number | null = null;

    if (liveData[s.trip_id]) {
      const live = liveData[s.trip_id];
      if (live.status !== "NO GPS" && live.delay !== null && Math.abs(live.delay) < 120) {
        if (live.next_stop_sequence !== undefined && live.next_stop_sequence !== null) {
          if (Number(live.next_stop_sequence) > Number(s.stop_sequence)) {
            continue; // Already passed
          }
          stopsAway = Number(s.stop_sequence) - Number(live.next_stop_sequence);
        }
        delay = Math.floor(Number(live.delay) * 60);
        isLive = true;
      }
    }

    const etaSecs = schedSecs + delay - nowSecs;

    if (etaSecs < -120) continue;

    results.push({
      eta_secs: etaSecs,
      scheduled: s.arrival_time,
      headsign: s.trip_headsign,
      is_live: isLive,
      delay_mins: Math.floor(delay / 60),
      stops_away: stopsAway,
    });
  }

  return results.sort((a, b) => a.eta_secs - b.eta_secs).slice(0, 10);
}
