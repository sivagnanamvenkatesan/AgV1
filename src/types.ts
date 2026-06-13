export type SoilNitrogen = "Low" | "Medium" | "High";
export type WaterSource = "Rainfed" | "Canal" | "Borewell";

export interface Crop {
  id: string;
  name: string;
  season: "Kharif" | "Rabi" | "Zaid";
  waterReqDaily: number;       // mm/day required at peak growth
  soilNRequirement: SoilNitrogen;
  baseYield: number;           // tons per hectare
  productionCost: number;      // INR per hectare
  basePrice: number;           // INR per ton
  glutRisk: "HIGH" | "MEDIUM" | "LOW";
  droughtTolerance: number;    // 0 to 1 (higher is more resilient)
  growthDays: number;
  description: string;
}

export interface Region {
  id: string;
  name: string;
  description: string;
  soilSoilType: string;
  soilN: SoilNitrogen;
  soilP: SoilNitrogen;
  soilK: SoilNitrogen;
  groundwaterDepth: number;    // meters
  waterAvalaibilityScore: number; // 1-10
  typicalRainfall: number;     // mm for season
}

export interface FarmState {
  id: string;
  ownerName: string;
  size: number;                // hectares
  soilN: SoilNitrogen;
  waterSource: WaterSource;
  allocatedCropId: string;
  soilMoisture: number;        // current bucket in mm (0-100)
  cropYieldFactor: number;     // starts at 1.0, degrades with stress
  waterConsumed: number;        // total irrigation applied in m3
  nitrogenDeficit: boolean;
  isHarvested: boolean;
  totalRevenue: number;
  totalCost: number;
}

export interface BlackboardLog {
  day: number;
  agent: "MIA" | "ASA" | "OSA" | "FCA" | "EOA" | "System";
  type: "info" | "warning" | "success" | "critical";
  message: string;
}

export interface SimulationDayRecord {
  day: number;
  rain: number;
  temperature: number;
  weatherType: string;
  farmMoistures: { [farmId: string]: number };
  farmYieldFactors: { [farmId: string]: number };
  farmWaterConsumed: { [farmId: string]: number };
}

export interface AgentConfig {
  miaPriceSensitivity: number; // 0-1
  asaRiskTolerance: "Conservative" | "Balanced" | "Aggressive";
  osaIrrigationTrigger: number; // soil moisture % (e.g. 35)
  fcaContractBypassRate: number; // FPO coordinate tier %
  eoaOptimizationFocus: "Profit" | "Balanced" | "Resource";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}
