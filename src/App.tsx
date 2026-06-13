import { useState, useEffect } from "react";
import {
  Sprout,
  TrendingUp,
  Cpu,
  Landmark,
  Trophy,
  Bot,
  Settings,
  Droplets,
  DollarSign,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Sparkles,
  CalendarDays,
  LayoutGrid,
  MapPin,
  Play
} from "lucide-react";
import { AgentConfig, FarmState } from "./types";
import { REGIONS, CROPS, runCompleteSimulation } from "./simulationEngine";
import { MarketIntelligence } from "./components/MarketIntelligence";
import { CropPlanner } from "./components/CropPlanner";
import { PrecisionScheduling } from "./components/PrecisionScheduling";
import { FPOHub } from "./components/FPOHub";
import { CumulativeAnalytics } from "./components/CumulativeAnalytics";
import { GeminiAdvisorClient } from "./components/GeminiAdvisorClient";

export default function App() {
  // Navigation & Config States
  const [activeTab, setActiveTab] = useState<"market" | "planner" | "sandbox" | "fpo" | "analytics" | "chat">("sandbox");
  const [selectedRegionId, setSelectedRegionId] = useState<string>("vidarbha");
  const [activeSeason, setActiveSeason] = useState<"Kharif" | "Rabi" | "Zaid">("Kharif");
  const [weatherRiskProfile, setWeatherRiskProfile] = useState<"normal" | "drought" | "excessive_rain">("normal");

  // Agent customizable parameters
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    miaPriceSensitivity: 0.6,
    asaRiskTolerance: "Balanced",
    osaIrrigationTrigger: 35, // moisture mm threshold (35mm)
    fcaContractBypassRate: 15, // matches direct bypass 15% wholesale buyer markup
    eoaOptimizationFocus: "Balanced"
  });

  // Simulation play state
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Precalculated full season outcomes
  const [simResults, setSimResults] = useState<any>(null);

  // Recalculate simulation state when region/season/weather/config modifies
  useEffect(() => {
    const results = runCompleteSimulation(selectedRegionId, activeSeason, agentConfig, weatherRiskProfile);
    setSimResults(results);
    // Reset playheads if configuration changes to prevent index out of bounds
    setCurrentDay(0);
    setIsPlaying(false);
  }, [selectedRegionId, activeSeason, weatherRiskProfile, agentConfig.osaIrrigationTrigger, agentConfig.eoaOptimizationFocus, agentConfig.fcaContractBypassRate]);

  // Simulation timer loop
  useEffect(() => {
    let intervalId: any = null;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentDay((prev) => {
          const maxDay = activeSeason === "Zaid" ? 90 : 120;
          if (prev >= maxDay) {
            setIsPlaying(false);
            clearInterval(intervalId);
            return maxDay;
          }
          return prev + 1;
        });
      }, 160); // 160ms per simulated day
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPlaying, activeSeason]);

  // Fetch slice of states up to currentDay
  const getSimDaySlice = () => {
    if (!simResults) return null;
    return simResults.dayRecords.find((r: any) => r.day === currentDay) || simResults.dayRecords[0];
  };

  const getSimLogsSlice = () => {
    if (!simResults) return [];
    // Only return blackboard activity logs published up to the current day
    return simResults.blackboardLogs.filter((log: any) => log.day <= currentDay);
  };

  const getDynamicFarmStates = (): FarmState[] => {
    if (!simResults) return [];
    const dayRecord = getSimDaySlice();
    if (!dayRecord) return simResults.agentFarmStates;

    return simResults.agentFarmStates.map((farm: FarmState) => {
      const moisture = dayRecord.farmMoistures[farm.id] !== undefined ? dayRecord.farmMoistures[farm.id] : farm.soilMoisture;
      const yieldFactor = dayRecord.farmYieldFactors[farm.id] !== undefined ? dayRecord.farmYieldFactors[farm.id] : farm.cropYieldFactor;
      const waterUsed = dayRecord.farmWaterConsumed[farm.id] !== undefined ? dayRecord.farmWaterConsumed[farm.id] : farm.waterConsumed;
      return {
        ...farm,
        soilMoisture: moisture,
        cropYieldFactor: yieldFactor,
        waterConsumed: waterUsed
      };
    });
  };

  const currentRegion = REGIONS.find(r => r.id === selectedRegionId) || REGIONS[0];
  const activeFarms = getDynamicFarmStates();
  const activeLogs = getSimLogsSlice();
  const maxDays = activeSeason === "Zaid" ? 90 : 120;

  // Jump simulation direct to day 120
  const jumpToHarvest = () => {
    setIsPlaying(false);
    setCurrentDay(maxDays);
  };

  const resetPlayhead = () => {
    setIsPlaying(false);
    setCurrentDay(0);
  };

  const stepSingleDay = () => {
    if (currentDay < maxDays) {
      setCurrentDay(prev => prev + 1);
    }
  };

  const tabLabels = [
    { id: "market", label: "Mandi Intel", icon: TrendingUp },
    { id: "planner", label: "ASA Crop Planner", icon: Sprout },
    { id: "sandbox", label: "120-Day Sandbox", icon: Cpu },
    { id: "fpo", label: "FPO Logistic Hub", icon: Landmark },
    { id: "analytics", label: "Coop Analytics", icon: Trophy },
    { id: "chat", label: "AI Advisor Chat", icon: Bot }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans antialiased text-[#1A1A1A] flex flex-col justify-between p-4 md:p-8 border-4 md:border-8 border-white" id="app-container">
      {/* Prime Header Block */}
      <header className="flex flex-col md:flex-row md:items-baseline justify-between border-b-2 border-[#1A1A1A] pb-6 mb-8 sticky top-0 bg-[#FAF9F6] z-50">
        <div>
          <h1 className="text-4xl md:text-6xl font-serif italic tracking-tighter leading-none text-[#1A1A1A]">
            Agricultural Optimizer <span className="text-xl font-sans not-italic font-bold align-top ml-1 text-[#1A1A1A]/70">v4.2</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] font-bold mt-2 text-[#6B6B6B]">Hierarchical Multi-Agent Optimization Sandbox for Indian Smallholders</p>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-4 mt-4 md:mt-0 text-left md:text-right">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#6B6B6B]">Season Cycle</p>
            <div className="flex border border-[#1A1A1A] p-0.5 mt-1.5 bg-white/50">
              {(["Kharif", "Rabi", "Zaid"] as const).map((season) => (
                <button
                  key={season}
                  onClick={() => {
                    setActiveSeason(season);
                    resetPlayhead();
                  }}
                  className={`px-3 py-1 text-xs font-bold transition-all ${
                    activeSeason === season
                      ? "bg-[#1A1A1A] text-[#FAF9F6]"
                      : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                  }`}
                >
                  {season === "Kharif" ? "Kharif" : season === "Rabi" ? "Rabi" : "Zaid"}
                </button>
              ))}
            </div>
          </div>

          <div className="h-8 w-px bg-black/10 hidden sm:block" />

          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#6B6B6B]">Active Region</span>
            <div className="flex items-center gap-1.5 text-sm font-serif italic text-[#2D5A27] mt-1.5">
              <MapPin className="h-4.5 w-4.5" />
              <span>{currentRegion.name.split(",")[0]} Sowing Enabled</span>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Dashboard layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Navigation Sidebar Drawer (Left 3-cols) */}
        <div className="lg:col-span-3 space-y-8 sticky top-28 select-none">
          <div className="bg-[#FAF9F6] border-t-2 border-b-2 border-[#1A1A1A] py-6 space-y-2">
            <span className="text-[10px] text-[#6B6B6B] block uppercase tracking-[0.3em] font-bold mb-4 px-1">HMAS Tactical Feed</span>
            
            {tabLabels.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between py-3 px-1.5 text-left transition-all border-b border-black/5 last:border-0 ${
                    isActive
                      ? "text-[#2D5A27] font-bold border-l-2 border-[#2D5A27] pl-3"
                      : "text-gray-600 hover:text-[#1A1A1A] hover:pl-3"
                  }`}
                >
                  <span className="flex items-center gap-2.5 text-xs uppercase tracking-wider">
                    <TabIcon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </span>
                  
                  {/* Subtle active indicators */}
                  {isActive && (
                    <span className="h-2 w-2 bg-[#2D5A27] rounded-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Simulation Progress Widget */}
          <div className="border border-[#1A1A1A]/10 p-5 space-y-4 bg-white/50 backdrop-blur-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#6B6B6B] uppercase font-bold tracking-wider">Season Day Phase</span>
              <span className="text-xs font-serif italic text-[#1A1A1A]">T+{currentDay} of {maxDays} Days</span>
            </div>
            
            {/* ProgressBar */}
            <div className="h-1 bg-[#1A1A1A]/10 w-full overflow-hidden">
              <div
                className="h-full bg-[#1A1A1A] transition-all duration-300"
                style={{ width: `${(currentDay / maxDays) * 100}%` }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={jumpToHarvest}
                disabled={currentDay >= maxDays}
                className="flex-1 bg-[#1A1A1A] text-white text-[10px] uppercase font-bold tracking-widest py-3 hover:bg-[#2D5A27] disabled:opacity-40 select-none cursor-pointer border border-[#1A1A1A] transition-colors"
              >
                Harvest Instantly
              </button>
              <button
                onClick={resetPlayhead}
                disabled={currentDay === 0}
                className="px-3 border border-[#1A1A1A] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition-colors"
                title="Reset Timeline"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Interactive Tutorial: Simulated FPO Farms */}
          <div className="bg-[#FAF9F6] border border-[#1A1A1A]/20 p-5 text-left">
            <span className="text-[10px] text-[#1A1A1A] block uppercase font-bold tracking-[0.2em] mb-3 pb-1 border-b border-[#1A1A1A]">Simulated FPO Members</span>
            <div className="space-y-2 text-[11px] text-[#1A1A1A]/80 font-serif">
              <div className="flex justify-between items-baseline border-b border-black/5 pb-1.5">
                <span>Suresh Patil</span>
                <span className="text-xs font-sans text-gray-500">1.8 ha • Borewell</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-black/5 pb-1.5">
                <span>Ramesh Hegde</span>
                <span className="text-xs font-sans text-gray-500">2.2 ha • Rainfed</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-black/5 pb-1.5">
                <span>Sunita Deshmukh</span>
                <span className="text-xs font-sans text-gray-500">3.5 ha • Canal</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-black/5 pb-1.5">
                <span>Harpreet Singh</span>
                <span className="text-xs font-sans text-gray-500">1.2 ha • Rainfed</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span>Anil Kadam</span>
                <span className="text-xs font-sans text-gray-500">2.5 ha • Borewell</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Display Board Viewport (Right 9-cols) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Active comparative warning panel if simulation has ended */}
          {currentDay >= maxDays && (
            <div className="bg-[#2D5A27] text-[#FAF9F6] p-6 border-l-4 border-black/30 flex flex-col md:flex-row items-baseline justify-between gap-4 text-left relative" id="harvest-warning-panel">
              <div className="space-y-1.5 font-serif">
                <h4 className="font-bold text-lg text-white flex items-center gap-1">
                  Season Sowing Cycle Completed
                </h4>
                <p className="text-xs text-white/90 leading-relaxed">
                  Cooperative multi-agent planning successfully executed. By pooling crops and routing directly to direct off-takers, the cooperative bypass returned a <strong>₹{(simResults?.metrics?.agent?.totalProfit - simResults?.metrics?.traditional?.totalProfit).toLocaleString()} surplus profit</strong> versus uncoordinated baseline farmers!
                </p>
              </div>
              <button
                onClick={() => setActiveTab("analytics")}
                className="px-4 py-2.5 bg-[#1A1A1A] border border-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#FAF9F6] hover:text-[#1A1A1A] transition-all cursor-pointer select-none shrink-0"
              >
                Inspect Metrics
              </button>
            </div>
          )}

          {activeTab === "market" && (
            <MarketIntelligence activeSeason={activeSeason} />
          )}

          {activeTab === "planner" && (
            <CropPlanner
              selectedRegionId={selectedRegionId}
              setSelectedRegionId={setSelectedRegionId}
              activeSeason={activeSeason}
              agentConfig={agentConfig}
              setAgentConfig={setAgentConfig}
            />
          )}

          {activeTab === "sandbox" && (
            <PrecisionScheduling
              currentDay={currentDay}
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onReset={resetPlayhead}
              onStep={stepSingleDay}
              dayRecord={getSimDaySlice()}
              activeFarms={activeFarms}
              logs={activeLogs}
              weatherRiskProfile={weatherRiskProfile}
              setWeatherRiskProfile={setWeatherRiskProfile}
              agentConfig={agentConfig}
              setAgentConfig={setAgentConfig}
            />
          )}

          {activeTab === "fpo" && (
            <FPOHub
              activeSeason={activeSeason}
              activeFarms={activeFarms}
              currentDay={currentDay}
            />
          )}

          {activeTab === "analytics" && simResults && (
            <CumulativeAnalytics
              metrics={simResults.metrics}
              currentDay={currentDay}
            />
          )}

          {activeTab === "chat" && (
            <GeminiAdvisorClient
              currentRegion={currentRegion}
              activeFarms={simResults?.agentFarmStates || []}
            />
          )}
        </div>
      </main>

      {/* Design credit footer bar */}
      <footer className="mt-12 pt-6 border-t border-black/20 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase font-bold text-[#6B6B6B] tracking-[0.2em] gap-4">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 text-center md:text-left">
          <span>Status: Autonomous Optimization</span>
          <span>Connectivity: Secure Server-Side Gemini</span>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 text-center md:text-right">
          <span>Node: MH-VIDARBHA-W-01</span>
          <span className="text-[#1A1A1A]">© 2026 AGRI-SYNC ANALYTICS</span>
        </div>
      </footer>
    </div>
  );
}
