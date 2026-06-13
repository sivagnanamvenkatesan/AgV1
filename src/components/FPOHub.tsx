import React, { useState } from "react";
import { Landmark, ArrowRight, Truck, Check, Share2, HelpCircle } from "lucide-react";
import { FarmState, Crop } from "../types";
import { CROPS } from "../simulationEngine";

interface FPOHubProps {
  activeSeason: "Kharif" | "Rabi" | "Zaid";
  activeFarms: FarmState[];
  currentDay: number;
}

export const FPOHub: React.FC<FPOHubProps> = ({ activeSeason, activeFarms, currentDay }) => {
  const [negotiatedPremiums, setNegotiatedPremiums] = useState<{ [id: string]: number }>({});
  const [loadingNegotiation, setLoadingNegotiation] = useState<string | null>(null);

  const seasonCrops = CROPS.filter(c => c.season === activeSeason);

  // Calculate accumulated FPO volumes in tons (mocked or actual simulation based)
  const getFpoVolumes = (): { [cropId: string]: number } => {
    const vols: { [cropId: string]: number } = {};
    for (const c of seasonCrops) {
      vols[c.id] = 0;
    }
    for (const f of activeFarms) {
      if (f.allocatedCropId in vols) {
        // Base expected yield formula
        const crop = CROPS.find(c => c.id === f.allocatedCropId)!;
        const computedYield = crop.baseYield * f.cropYieldFactor * f.size;
        vols[f.allocatedCropId] += computedYield;
      }
    }
    return vols;
  };

  const fpoVolumes = getFpoVolumes();

  const buyerBids = [
    {
      id: "bid-1",
      buyerName: "Tata Global Processing",
      targetCropId: "soybean",
      requiredVolume: 8.0,
      baseOffer: 44000,
      description: "Direct export grading, quality parameters: moisture content < 12%."
    },
    {
      id: "bid-2",
      buyerName: "Reliance Retail Agri",
      targetCropId: "cotton",
      requiredVolume: 3.5,
      baseOffer: 69000,
      description: "Fibre length assessment > 28mm warp specification."
    },
    {
      id: "bid-3",
      buyerName: "Punjab Feed & Grains Mill",
      targetCropId: "maize",
      requiredVolume: 10.0,
      baseOffer: 21000,
      description: "Bulk compound feedstock grading. Standard moisture acceptable."
    },
    {
      id: "bid-4",
      buyerName: "Indore Organic Pulse Coop",
      targetCropId: "chickpea",
      requiredVolume: 5.0,
      baseOffer: 53000,
      description: "Dry whole grain grading focus. Desi yellow variety target."
    }
  ].filter(bid => seasonCrops.find(c => c.id === bid.targetCropId));

  const triggerNegotiate = (bidId: string) => {
    setLoadingNegotiation(bidId);
    setTimeout(() => {
      // Negotiate custom FPO bulk price premium bonus
      const randomPremium = Math.round(Math.random() * 2000 + 1500);
      setNegotiatedPremiums(prev => ({ ...prev, [bidId]: randomPremium }));
      setLoadingNegotiation(null);
    }, 900);
  };

  return (
    <div className="bg-[#FAF9F6] border border-[#1A1A1A]/20 p-6 md:p-8" id="fpo-market-hub-section">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-8 pb-4 border-b-2 border-[#1A1A1A]">
        <div>
          <h2 className="text-3xl font-serif italic tracking-tighter text-[#1A1A1A] flex items-center gap-2">
            Cooperative Marketing Hub
          </h2>
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#6B6B6B] mt-1.5">
            FCA aggregates outputs from scattered local fields & coordinates bulk contracts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left 4-cols: Aggregation yields & cvrp routing visualizer */}
        <div className="lg:col-span-5 space-y-6">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">FPO Live Aggregation Storage</span>
          
          <div className="grid grid-cols-3 gap-3">
            {seasonCrops.map((c) => {
              const weight = fpoVolumes[c.id] || 0;
              return (
                <div key={c.id} className="p-3 bg-white border border-black/10 text-left">
                  <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider">{c.name.split(" ")[0]}</span>
                  <span className="text-lg font-serif italic text-[#1A1A1A] mt-1 block">
                    {currentDay === 0 ? "0.0" : weight.toFixed(1)} <span className="text-xs font-sans text-gray-400 not-italic">Tons</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Capacitated Vehicle Routing Problem Logistics visualizer */}
          <div className="bg-[#1A1A1A] text-[#FAF9F6] p-5 border-l-4 border-[#2D5A27] relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Logistics Routing Engine (CVRP)</span>
              <span className="text-[9px] border border-white/20 bg-white/5 px-2 py-0.5 text-white font-mono uppercase tracking-widest">
                Optimized
              </span>
            </div>

            {/* Simulated Animated SVG network diagram */}
            <div className="h-36 bg-black/35 border border-white/10 relative flex items-center justify-center p-2">
              <svg viewBox="0 0 400 150" className="w-full h-full">
                {/* Connections with dashed stroke animating */}
                <path d="M 50 25 L 200 75" stroke="#374151" strokeWidth="1.5" strokeDasharray="5,5" />
                <path d="M 80 120 L 200 75" stroke="#374151" strokeWidth="1.5" strokeDasharray="5,5" />
                <path d="M 320 30 L 200 75" stroke="#374151" strokeWidth="1.5" strokeDasharray="5,5" />
                <path d="M 350 110 L 200 75" stroke="#374151" strokeWidth="1.5" strokeDasharray="5,5" />
                <path d="M 110 70 L 200 75" stroke="#374151" strokeWidth="1.5" strokeDasharray="5,5" />

                {/* Animated active collection route */}
                {currentDay > 0 && (
                  <>
                    <path
                      d="M 50 25 L 200 75 M 80 120 L 200 75 M 320 30 L 200 75"
                      stroke="#10b981"
                      strokeWidth="2.0"
                      strokeDasharray="10 15"
                      strokeDashoffset="2"
                      fill="none"
                      className="animate-[dash_8s_linear_infinite]"
                      style={{ strokeDasharray: "8 12", animation: "dash 4s linear infinite" }}
                    />
                  </>
                )}

                {/* FPO Collection hub Depot (Center) */}
                <circle cx="200" cy="75" r="14" fill="#2D5A27" className="animate-pulse" />
                <text x="200" y="79" fill="#fff" fontSize="10" fontWeight="900" textAnchor="middle">DEP</text>

                {/* 5 Farm dots */}
                <circle cx="50" cy="25" r="5" fill="#3b82f6" />
                <text x="50" y="15" fill="#9ca3af" fontSize="8" textAnchor="middle">Farm 1</text>

                <circle cx="80" cy="120" r="5" fill="#3b82f6" />
                <text x="80" y="132" fill="#9ca3af" fontSize="8" textAnchor="middle">Farm 2</text>

                <circle cx="320" cy="30" r="5" fill="#3b82f6" />
                <text x="320" y="20" fill="#9ca3af" fontSize="8" textAnchor="middle">Farm 3</text>

                <circle cx="350" cy="110" r="5" fill="#3b82f6" />
                <text x="350" y="122" fill="#9ca3af" fontSize="8" textAnchor="middle">Farm 4</text>

                <circle cx="110" cy="70" r="5" fill="#3b82f6" />
                <text x="110" y="60" fill="#9ca3af" fontSize="8" textAnchor="middle">Farm 5</text>
              </svg>
            </div>
            
            <p className="text-[10px] text-gray-400 mt-3 leading-relaxed text-left font-serif italic">
              FCA calculates vehicle routing loops dynamically, mapping pooling nodes to lower dynamic transit charges by 32%.
            </p>
          </div>
        </div>

        {/* Right 7-cols: Buyer Contracts bid negotiation list */}
        <div className="lg:col-span-7 space-y-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Direct Agri-Food Corporate Offtakers</span>
          
          <div className="space-y-4">
            {buyerBids.length === 0 ? (
              <div className="text-center p-8 bg-white border border-black/10 text-gray-500 font-serif text-sm">
                No institutional buyers mapped for the active season. MTR details empty.
              </div>
            ) : (
              buyerBids.map((bid) => {
                const targetCrop = CROPS.find(c => c.id === bid.targetCropId)!;
                const poolVolume = fpoVolumes[bid.targetCropId] || 0;
                const hasVolume = poolVolume > 0 && currentDay > 0;
                const premium = negotiatedPremiums[bid.id] || 0;

                return (
                  <div key={bid.id} className="p-5 bg-white border border-black/10 flex flex-col justify-between hover:border-[#1A1A1A] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-black/5 pb-2">
                      <div>
                        <span className="text-base font-serif italic font-bold text-[#1A1A1A] block">{bid.buyerName}</span>
                        <span className="text-xs text-gray-700 font-serif mt-1 block">{bid.description}</span>
                      </div>
                      <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
                        <span className="text-[8px] uppercase tracking-wider text-[#6B6B6B] block">Base Offer Quote</span>
                        <span className="text-sm font-mono font-bold text-[#2D5A27]">₹{bid.baseOffer.toLocaleString()} /t</span>
                      </div>
                    </div>

                    <div className="my-3 flex items-baseline justify-between text-xs p-2 bg-black/5">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Demand Fulfilled Index</span>
                      <span className={`font-mono font-bold ${hasVolume ? "text-[#2D5A27]" : "text-gray-400"}`}>
                        {currentDay === 0 ? "0.0" : poolVolume.toFixed(1)} / {bid.requiredVolume} Tons
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-black/5">
                      {premium > 0 ? (
                        <div className="text-[10px] font-mono font-bold text-[#2D5A27] bg-green-50 border border-[#2D5A27]/20 px-2 py-0.5 uppercase tracking-widest">
                          Matched Premium: +₹{premium}/t
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">Direct wholesale pool</span>
                      )}

                      <button
                        onClick={() => triggerNegotiate(bid.id)}
                        disabled={loadingNegotiation !== null || premium > 0 || currentDay === 0}
                        className={`px-4 py-2.5 text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer border ${
                          premium > 0
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : currentDay === 0
                            ? "bg-gray-50 text-gray-300 border-gray-150 cursor-not-allowed"
                            : "bg-[#1A1A1A] text-white border-[#1A1A1A] hover:bg-[#2D5A27]"
                        }`}
                      >
                        {loadingNegotiation === bid.id
                          ? "NEGOTIATING..."
                          : premium > 0
                          ? "CONTRACT LOCK"
                          : "NEGOTIATE"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
