export type VehicleType = 'bus' | 'train';

export interface Vehicle {
  id: string;
  type: VehicleType;
  route: string;
  lat: number;
  lng: number;
}

export interface Match {
  match_id: string;
  team_a: string;
  team_b: string;
  kickoff_utc: string;
  stage: string;
  group: string | null;
}

export type Zone =
  | 'downtown'
  | 'midtown'
  | 'airport'
  | 'decatur'
  | 'dunwoody';

export type DelayState = 'normal' | 'blue_line_delay';

export const ZONE_LABELS: Record<Zone, string> = {
  downtown: 'Downtown (Five Points / Centennial Park)',
  midtown: 'Midtown (Arts Center / Peachtree)',
  airport: 'Airport (College Park / MARTA)',
  decatur: 'Decatur (Blue Line)',
  dunwoody: 'Dunwoody (Red Line)',
};

export interface MartaApiResponse {
  vehicles: Vehicle[];
  cached: boolean;
  source: 'live' | 'mock';
}

export interface RecommendRequest {
  zone: Zone;
  match_id: string;
  delay_state: DelayState;
}
