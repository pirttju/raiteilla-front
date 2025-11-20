// src/types/api.d.ts

export type CountryCode = 'fi' | 'se' | 'no';

export interface Station {
  id: number;
  feed_id: CountryCode;
  station: string; // Short code like "HKI"
  name: string;
  type: string;
  commercial_code: string;
  coordinates: [number, number];
  country_code: string;
  timezone: string;
}

export interface Train {
  departure_date: string;
  train_number: number;
  train_type: string;
  line_no: string | null;
  origin: string;
  origin_name: string;
  destination: string;
  destination_name: string;
  company: string;
  cancelled: boolean;
}

export interface TrainStop {
  station: string;
  name: string;
  arrival: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  cancelled_arrival: boolean | null;
  departure: string | null;
  estimated_departure: string | null;
  actual_departure: string | null;
  cancelled_departure: boolean | null;
  platform: string | null;
  commercial_stop: boolean;
  coordinates: [number, number];
}

export interface TrainComposition {
  departure_date: string;
  train_number: number;
  total_length: number;
  maximum_speed: number;
  groups: {
    group_id: number | null;
    vehicles: {
      vehicle_type: string;
      vehicle_number: string;
      location: number;
    }[];
  }[];
}

export interface MapVehicleFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    ts: number;
    sp: number; // Speed
    ve: string; // ID
    ro: string; // Route/Train number
    sd: string; // Start date
    rt: number; // Route type
    fe: string; // Feed (country)
  };
}