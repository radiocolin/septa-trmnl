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
  stop_lat: string;
  stop_lon: string;
  direction_id: string;
  stop_sequence: string;
}

export interface SeptaTrip {
  trip_id: string;
  route_id: string;
  direction_id: string;
  trip_headsign: string;
  service_id: string;
  block_id: string;
  shape_id: string;
}

export interface SeptaScheduleEntry {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: string;
  stop_headsign: string;
  route_id: string;
  direction_id: string;
  service_id: string;
  release_name?: string;
  trip_headsign: string;
}

export interface SeptaLiveTrip {
  trip_id: string;
  route_id: string;
  lat: string;
  lng: string;
  label: string;
  vehicle_id: string;
  block_id: string;
  direction: string;
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
