import { getDepartures, getRouteInfo, getStopInfo } from './septa';
import { Departure, TrmnlPayload } from './types';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TRMNL_WEBHOOK_URL = process.env.TRMNL_WEBHOOK_URL;
const SEPTA_ROUTE = process.env.SEPTA_ROUTE || "17";
const SEPTA_STOP = process.env.SEPTA_STOP || "10264";
const TIMEZONE = "America/New_York";

function formatDepartureTime(etaSecs: number, scheduled: string): string {
  const mins = Math.floor(etaSecs / 60);
  if (mins <= 0) return "Now";
  if (mins < 60) return `${mins}m`;

  const parts = scheduled.split(":");
  let h = parseInt(parts[0]);
  const m = parts[1];
  let suffix = "a";
  if (h >= 24) h -= 24;
  if (h >= 12) {
    suffix = "p";
    if (h > 12) h -= 12;
  }
  if (h === 0) h = 12;
  return `${h}:${m}${suffix}`;
}

async function main() {
  if (!TRMNL_WEBHOOK_URL) {
    console.error("TRMNL_WEBHOOK_URL environment variable is required.");
    process.exit(1);
  }

  console.log(`Fetching departures for Route ${SEPTA_ROUTE}, Stop ${SEPTA_STOP}...`);

  const [departures, routeInfo, stopInfo] = await Promise.all([
    getDepartures(SEPTA_ROUTE, SEPTA_STOP),
    getRouteInfo(SEPTA_ROUTE),
    getStopInfo(SEPTA_ROUTE, SEPTA_STOP)
  ]);

  const now = toZonedTime(new Date(), TIMEZONE);
  
  const payload: TrmnlPayload = {
    merge_variables: {
      route: routeInfo?.route_short_name || SEPTA_ROUTE,
      stop_name: stopInfo?.stop_name || "Unknown Stop",
      updated_at: format(now, "h:mma").toLowerCase(),
      departures: departures.map(d => {
        let status = "";
        if (d.is_live) {
          if (d.stops_away !== null) {
            if (d.stops_away <= 0) status = "Approaching";
            else if (d.stops_away === 1) status = "1 stop away";
            else status = `${d.stops_away} stops away`;
          } else {
            status = d.delay_mins > 2 ? `${d.delay_mins}m late` : "On time";
          }
        }

        return {
          time: formatDepartureTime(d.eta_secs, d.scheduled),
          headsign: d.headsign,
          status: status,
          is_live: d.is_live,
          delay: d.delay_mins
        };
      })
    }
  };

  console.log("Sending payload to TRMNL...");
  try {
    const response = await fetch(TRMNL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log("Success! TRMNL updated.");
    } else {
      console.error(`Error: TRMNL API returned ${response.status}`);
      const text = await response.text();
      console.error(text);
    }
  } catch (error) {
    console.error("Failed to send to TRMNL:", error);
  }
}

main();
