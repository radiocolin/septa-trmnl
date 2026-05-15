export interface SeptaRoute {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  route_color: string;
  route_text_color: string;
}

export interface SeptaStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  direction_id: number;
  stop_sequence: number;
}

export interface SeptaTrip {
  trip_id: string | number;
  route_id: string;
  direction_id: number;
  trip_headsign: string;
  service_id: number;
  block_id: number;
  shape_id: string;
}

export interface SeptaScheduleEntry {
  trip_id: string | number;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  stop_headsign: string;
  route_id: string;
  direction_id: number;
  service_id: number;
  release_name?: string;
  trip_headsign: string;
}

export interface SeptaLiveTrip {
  trip_id: string;
  route_id: string;
  lat: string;
  lon: string;
  label: string;
  vehicle_id: string;
  block_id: number;
  direction: number;
  destination: string;
  delay: number;
  next_stop_id: string;
  next_stop_sequence: number;
  status?: string;
}

export interface Departure {
  eta_secs: number;
  scheduled: string;
  headsign: string;
  is_live: boolean;
  delay_mins: number;
  stops_away: number | null;
}

export interface TrmnlPayload {
  merge_variables: {
    route: string;
    stop_name: string;
    departures: Array<{
      time: string;
      headsign: string;
      status: string;
      is_live: boolean;
      delay: number;
    }>;
    updated_at: string;
  };
}
