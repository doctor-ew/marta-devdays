export interface TransitVehicle {
  id: string;
  type: "bus" | "train";
  latitude: number;
  longitude: number;
  route: string;
}
