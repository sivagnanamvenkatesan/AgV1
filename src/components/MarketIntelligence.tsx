import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { TrendingUp, AlertTriangle, ShieldCheck, DollarSign, ArrowRight, Sparkles } from "lucide-react";
import { Crop } from "../types";
import { CROPS } from "../simulationEngine";

// Static historic + forecasted prices sequence generator helper
const generateMockTrendData = (cropId: string, basePrice: number, crash: boolean) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul (Plant)", "Aug", "Sep", "Oct (Harv)", "Nov", "Dec"];
  const multiplier = cropId === "cotton" && crash ? [1.0, 1.05, 1.02, 1.08, 1.12, 1.15, 1.14, 0.95, 0.82, 0.76, 0.73, 0.75] : [1.0, 1.01, 1.03, 1.02, 1.05, 1.07, 1.10, 1.12, 1.15, 1.18, 1.20, 1.22];

  return months.map((m, i) => {
    const standardPrice = basePrice * multiplier[Math.min(multiplier.length - 1, i)];
    const lowerBound = standardPrice * 0.90;
    const upperBound = standardPrice * 1.08;
    return {
      month: m,
      "Standard Price": Math.round(standardPrice),
      "Optimized Target": Math.round(standardPrice * 1.15), // FPO bulk price target
      "Lower Buffer": Math.round(lowerBound),
      "Upper Buffer": Math.round(upperBound)
    };
  });
};

interface MarketIntelligenceProps {
  activeSeason: "Kharif" | "Rabi" | "Zaid";
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ activeSeason }) => {
  const crops = CROPS.filter(c => c.season === activeSeason);
  const [selectedCrop, setSelectedCrop] = useState<Crop>(crops[0] || CROPS[0]);
  const [traditionalGlutCrash, setTraditionalGlutCrash] = useState(true);

  // If crop changed and not in the list of active season, reset selected crop
  React.useEffect(() => {
    const seasonCrops = CROPS.filter(c => c.season === activeSeason);
    if (seasonCrops.length > 0 && !seasonCrops.find(c => c.id === selectedCrop.id)) {
      setSelectedCrop(seasonCrops[0]);
    }
  }, [activeSeason]);

  const trendData = generateMockTrendData(selectedCrop.id, selectedCrop.basePrice, traditionalGlutCrash);

  return (
    <div className="bg-[#FAF9F6] border border-[#1A1A1A]/20 p-6 md:p-8" id="market-intel-section">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-8 pb-4 border-b-2 border-[#1A1A1A]">
        <div>
          <h2 className="text-3xl font-serif italic tracking-tighter text-[#1A1A1A] flex items-center gap-2">
            Demand & Market Intelligence
          </h2>
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#6B6B6B] mt-1.5">
            MIA Agent spot-mandi records, crop sown trackers & export analytics
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 bg-white/40 border border-[#1A1A1A]/10 p-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">MIA Prevention:</span>
          <button
            onClick={() => setTraditionalGlutCrash(!traditionalGlutCrash)}
            className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all ${
              traditionalGlutCrash
                ? "bg-amber-100 text-amber-900 border border-amber-300"
                : "bg-[#2D5A27] text-white"
            }`}
          >
            {traditionalGlutCrash ? "⚡ Trad Crop Glut Active" : "✅ Balanced Price"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Crop selection / Spot info cards */}
        <div className="space-y-6 lg:col-span-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Commodity Profile</p>
          <div className="space-y-3">
            {crops.map((c) => {
              const isSelected = selectedCrop.id === c.id;
              const hasHighGlut = c.glutRisk === "HIGH" && traditionalGlutCrash;
              
              return (
                <button
                  key={c.id}
                  id={`btn-intel-${c.id}`}
                  onClick={() => setSelectedCrop(c)}
                  className={`w-full text-left p-4 border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-white border-[#1A1A1A] border-l-4 border-l-[#2D5A27]"
                      : "bg-[#FAF9F6] border-black/10 hover:border-black/30"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-serif italic text-lg font-bold text-[#1A1A1A]">{c.name}</span>
                    <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 border ${
                      hasHighGlut
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : c.glutRisk === "MEDIUM"
                        ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                        : "bg-green-50 text-green-800 border-green-200"
                    }`}>
                      {hasHighGlut ? "OVERSUPPLY GLITCH" : `Risk: ${c.glutRisk}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full mt-4">
                    <span className="text-gray-400 text-[10px] uppercase tracking-wide">Expectation Price</span>
                    <span className="font-mono text-sm font-bold text-[#2D5A27]">
                      ₹{Math.round(c.basePrice * (c.id === "cotton" && traditionalGlutCrash ? 0.76 : 1.0)).toLocaleString()}/t
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className={`p-4 border ${
            selectedCrop.glutRisk === "HIGH" && traditionalGlutCrash
              ? "bg-amber-50/60 border-amber-300"
              : "bg-white border-black/10"
          }`}>
            <div className="flex items-start gap-3">
              {selectedCrop.glutRisk === "HIGH" && traditionalGlutCrash ? (
                <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-[#2D5A27] mt-0.5 shrink-0" />
              )}
              <div>
                <h4 className={`text-xs uppercase font-bold leading-none ${
                  selectedCrop.glutRisk === "HIGH" && traditionalGlutCrash ? "text-amber-900" : "text-[#2D5A27]"
                }`}>
                  {selectedCrop.glutRisk === "HIGH" && traditionalGlutCrash
                    ? "MIA Supply Crash Notice"
                    : "MIA Strategic Profit Indicator"}
                </h4>
                <p className="text-xs text-gray-700 font-serif mt-2 leading-relaxed">
                  {selectedCrop.glutRisk === "HIGH" && traditionalGlutCrash
                    ? `Warning: Uncoordinated Bt Cotton sowing causes localized gluts. Mandi spot rates will discount 24% at harvest. Diversify acreage instantly to avoid loss!`
                    : `Dynamic suitability matches target indices perfectly. FPO dynamic contracts with wholesale buyers secured.`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Recharts Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-baseline justify-between border-b border-black/5 pb-2">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Seasonal Mandi Pricing Curve</span>
              <span className="text-xs font-serif italic text-gray-600 mt-1 block">
                Historical Spot Trackers vs Dynamic Target
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Harvest Quote</span>
              <span className="text-[#2D5A27] text-2xl font-serif">
                ₹{Math.round(selectedCrop.basePrice * (selectedCrop.id === "cotton" && traditionalGlutCrash ? 0.76 : 1.0)).toLocaleString()} <span className="text-xs text-gray-500 font-normal">/ton</span>
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 border border-black/10 p-4 bg-white/30">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0decb" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#1A1A1A", fontFamily: "monospace" }} />
                <YAxis tick={{ fontSize: 9, fill: "#1A1A1A", fontFamily: "monospace" }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#FAF9F6", borderColor: "#1A1A1A", borderRadius: "0px", fontSize: "11px", fontFamily: "Lora" }} 
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, ""]} 
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "10px", bottom: -5 }} />
                <Line type="monotone" dataKey="Standard Price" stroke={selectedCrop.id === "cotton" && traditionalGlutCrash ? "#d14900" : "#2D5A27"} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Optimized Target" stroke="#2D5A27" strokeDasharray="5 5" strokeWidth={1.5} name="FPO Hub Target" />
                <Line type="monotone" dataKey="Lower Buffer" stroke="#9ca3af" strokeWidth={1} dot={false} name="Safety Floor Spot" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border border-black/10 bg-white/40">
              <span className="text-[9px] text-[#6B6B6B] block uppercase font-bold tracking-wider">Production Cost</span>
              <span className="text-xs font-mono font-bold text-gray-900 mt-1 block">₹{(selectedCrop.productionCost).toLocaleString()} /ha</span>
            </div>
            <div className="p-3 border border-black/10 bg-white/40">
              <span className="text-[9px] text-[#6B6B6B] block uppercase font-bold tracking-wider">Resiliency</span>
              <span className="text-xs font-mono font-bold text-gray-900 mt-1 block">{(selectedCrop.droughtTolerance * 10).toFixed(1)} / 10.0</span>
            </div>
            <div className="p-3 border border-black/10 bg-white/40">
              <span className="text-[9px] text-[#6B6B6B] block uppercase font-bold tracking-wider">Maturity Lifecycle</span>
              <span className="text-xs font-serif font-bold text-gray-900 mt-1 block">{selectedCrop.growthDays} Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
