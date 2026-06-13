import React from "react";
import { Shield, Sparkles, Sprout, AlertCircle, Droplets, Database, Layers, LayoutGrid } from "lucide-react";
import { Region, Crop, AgentConfig } from "../types";
import { REGIONS, CROPS } from "../simulationEngine";

interface CropPlannerProps {
  selectedRegionId: string;
  setSelectedRegionId: (id: string) => void;
  activeSeason: "Kharif" | "Rabi" | "Zaid";
  agentConfig: AgentConfig;
  setAgentConfig: React.Dispatch<React.SetStateAction<AgentConfig>>;
}

export const CropPlanner: React.FC<CropPlannerProps> = ({
  selectedRegionId,
  setSelectedRegionId,
  activeSeason,
  agentConfig,
  setAgentConfig
}) => {
  const currentRegion = REGIONS.find(r => r.id === selectedRegionId) || REGIONS[0];
  const seasonCrops = CROPS.filter(c => c.season === activeSeason);

  // Match suitability score helper
  const calculateSuitabilityScore = (crop: Crop, region: Region) => {
    let score = 85; 
    if (crop.soilNRequirement === "High") {
      if (region.soilN === "Low") score -= 25;
      if (region.soilN === "Medium") score -= 10;
    }
    if (region.id === "vidarbha" && crop.id === "cotton") {
      // Cotton fits black cotton soil nicely structurally, but high water limit
      score += 5;
    }
    if (region.id === "punjab") {
      if (crop.soilNRequirement === "High" || crop.soilNRequirement === "Medium") score += 10; // high alluvial nutrients
    }
    if (region.id === "deccan") {
      // red gravel dry soil moisture draining
      if (crop.id === "soybean") score -= 15;
      if (crop.id === "maize") score += 15; // maize has incredible red soil adaptation
    }
    return Math.max(30, Math.min(100, score));
  };

  // Optimization strategy toggle
  const optStrategies: Array<{ id: "Profit" | "Balanced" | "Resource"; label: string; desc: string }> = [
    { id: "Profit", label: "Profit-Max Logic", desc: "Prioritizes highest predicted mandi price portfolios. Carries water/pest risk." },
    { id: "Balanced", label: "Consensus Strategy", desc: "Balances economic security with soil moisture tolerance thresholds." },
    { id: "Resource", label: "Resource Deficit Shield", desc: "Restricts high-water Bt Cotton Sowing. Focuses on safe legumes and robust grains." }
  ];

  return (
    <div className="bg-[#FAF9F6] border border-[#1A1A1A]/20 p-6 md:p-8" id="crop-planner-section">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-8 pb-4 border-b-2 border-[#1A1A1A]">
        <div>
          <h2 className="text-3xl font-serif italic tracking-tighter text-[#1A1A1A] flex items-center gap-2">
            Climate & Resource-Aware Planner
          </h2>
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#6B6B6B] mt-1.5">
            ASA matches atmospheric metrics and digitized soil nutrient sensors
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex border border-[#1A1A1A] p-0.5 bg-white/50">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRegionId(r.id)}
              className={`px-3 py-1 text-xs font-bold transition-all ${
                selectedRegionId === r.id
                  ? "bg-[#1A1A1A] text-[#FAF9F6]"
                  : "text-[#1A1A1A]/60 hover:bg-black/5"
              }`}
            >
              {r.name.split(",")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Region & Soil Health Card (Left 5-cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#1A1A1A] text-[#FAF9F6] p-6 border-l-4 border-[#2D5A27] select-none relative overflow-hidden">
            <div className="flex items-center gap-1.5 bg-white/10 font-bold text-[10px] uppercase tracking-wider px-2.0 py-1 rounded-none w-fit">
              <Layers className="h-3 w-3" /> Area Environment Profile
            </div>
            <h3 className="text-2xl font-serif italic mt-4">{currentRegion.name}</h3>
            <p className="text-xs text-gray-300 mt-2 font-serif leading-relaxed">{currentRegion.description}</p>

            <div className="my-5 border-t border-white/10" />

            {/* Digitized Soil Health Card Card */}
            <span className="text-[10px] font-bold text-white/50 block uppercase tracking-wider mb-2">Soil Sensor Health Card</span>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 border border-white/10 bg-white/5">
                <span className="text-[9px] text-[#FAF9F6]/60 uppercase block font-semibold">Nitrogen</span>
                <span className={`text-xs font-bold block mt-1 ${
                  currentRegion.soilN === "High" ? "text-emerald-400" : currentRegion.soilN === "Medium" ? "text-orange-300" : "text-amber-500"
                }`}>{currentRegion.soilN}</span>
              </div>
              <div className="p-2 border border-white/10 bg-white/5">
                <span className="text-[9px] text-[#FAF9F6]/60 uppercase block font-semibold">Phosphor</span>
                <span className={`text-xs font-bold block mt-1 ${
                  currentRegion.soilP === "High" ? "text-emerald-400" : currentRegion.soilP === "Medium" ? "text-orange-300" : "text-amber-500"
                }`}>{currentRegion.soilP}</span>
              </div>
              <div className="p-2 border border-white/10 bg-white/5">
                <span className="text-[9px] text-[#FAF9F6]/60 uppercase block font-semibold">Potassium</span>
                <span className="text-xs font-bold text-emerald-400 block mt-1">{currentRegion.soilK}</span>
              </div>
              <div className="p-2 border border-white/10 bg-white/5">
                <span className="text-[9px] text-[#FAF9F6]/60 uppercase block font-semibold">Type</span>
                <span className="text-[10px] font-bold text-white truncate block mt-1" title={currentRegion.soilSoilType}>
                  {currentRegion.soilSoilType.split(" ")[0]}
                </span>
              </div>
            </div>

            {/* Water levels */}
            <div className="mt-4 flex items-center justify-between text-xs bg-white/5 p-3 border border-white/10">
              <span className="flex items-center gap-1"><Droplets className="h-3.5 w-3.5 text-sky-400" /> Ground Water Depth</span>
              <span className="font-mono text-xs font-bold">{currentRegion.groundwaterDepth}M {(currentRegion.id === "vidarbha" || currentRegion.id === "punjab") ? "(Depleted)" : "(Stable)"}</span>
            </div>
          </div>

          {/* Allocation Controller focus (EOA Engine) */}
          <div className="border border-black/10 p-5 bg-white/40">
            <span className="text-[10px] text-[#6B6B6B] block uppercase font-bold tracking-widest mb-3 pb-1 border-b border-black/5">EOA Strategic Driver</span>
            <div className="space-y-2">
              {optStrategies.map((strat) => {
                const isActive = agentConfig.eoaOptimizationFocus === strat.id;
                return (
                  <button
                    key={strat.id}
                    onClick={() => setAgentConfig({ ...agentConfig, eoaOptimizationFocus: strat.id })}
                    className={`w-full text-left p-3 border transition-all ${
                      isActive
                        ? "bg-white border-[#1A1A1A] border-l-4 border-l-[#2D5A27]"
                        : "bg-transparent border-black/5 hover:border-black/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 ${isActive ? "bg-[#2D5A27]" : "bg-gray-300"}`} />
                      <span className="text-xs font-bold uppercase tracking-wide text-gray-950">{strat.label}</span>
                    </div>
                    <p className="text-[10.5px] text-gray-600 mt-1 ml-4 leading-relaxed">{strat.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Suitability Mapping Candidate Matrix (Right 7-cols) */}
        <div className="lg:col-span-7 space-y-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ASA Agronomic Compatibility Scoring</p>
          
          <div className="space-y-4">
            {seasonCrops.map((c) => {
              const suitabilityScore = calculateSuitabilityScore(c, currentRegion);
              const isHighImpact = suitabilityScore >= 80;
              const isWarning = suitabilityScore < 60;

              return (
                <div key={c.id} className="p-4 border border-black/10 bg-white hover:border-[#1A1A1A] transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-serif italic font-bold text-[#1A1A1A]/95 flex items-center gap-1.5">
                        {c.name}
                        {isHighImpact && <Sparkles className="h-4 w-4 text-amber-500 fill-amber-100" />}
                      </h4>
                      <p className="text-xs text-gray-700 font-serif mt-1 max-w-[85%] leading-relaxed">{c.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-[#6B6B6B] block">Index Suitability</span>
                      <span className={`text-2xl font-serif block ${
                        isHighImpact ? "text-[#2D5A27]" : isWarning ? "text-amber-700" : "text-yellow-700"
                      }`}>{suitabilityScore}%</span>
                    </div>
                  </div>

                  {/* Bullet analysis parameters */}
                  <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-black/5">
                    <span className="text-[10px] font-mono bg-black/5 text-[#1A1A1A] px-2.0 py-1">
                      Daily Water: {c.waterReqDaily}mm
                    </span>
                    <span className={`text-[10px] font-mono px-2.0 py-1 ${
                      currentRegion.soilN === "Low" && c.soilNRequirement === "High"
                        ? "bg-amber-50 text-amber-850 border border-amber-200"
                        : "bg-black/5 text-[#1A1A1A]"
                    }`}>
                      Nitrogen: {c.soilNRequirement} req
                    </span>
                    <span className="text-[10px] font-mono bg-black/5 text-[#1A1A1A] px-2.0 py-1">
                      Drought Res: {Math.round(c.droughtTolerance * 100)}%
                    </span>
                  </div>

                  {/* Adaptive recommendation feedback by ASA */}
                  {currentRegion.soilN === "Low" && c.soilNRequirement === "High" && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-900 bg-amber-50/55 p-2.5 border border-amber-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
                      <span>Nitrogen sensor levels low. Requires supplementary nutrient application schedules.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-[#2D5A27] text-white p-5 border-l-4 border-black/30 flex items-start gap-3">
            <Shield className="h-5 w-5 shrink-0 mt-0.5 text-white/80" />
            <div>
              <span className="font-serif italic text-lg font-bold block text-white">EOA Automatic Crop Diversification Rule</span>
              <p className="mt-1 text-xs text-white/95 leading-relaxed">
                To combat climate volatility, EOA forbids monocultural layouts. 
                Under <strong>{optStrategies.find(s => s.id === agentConfig.eoaOptimizationFocus)?.label}</strong>, 
                members are allocated separate compatible crops to spread downside exposure risk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
