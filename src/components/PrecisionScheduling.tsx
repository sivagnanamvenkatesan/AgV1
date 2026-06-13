import React, { useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, CloudRain, Thermometer, ShieldAlert, Cpu, CheckCircle2 } from "lucide-react";
import { BlackboardLog, SimulationDayRecord, FarmState, AgentConfig, WaterSource } from "../types";

interface PrecisionSchedulingProps {
  currentDay: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onStep: () => void;
  dayRecord: SimulationDayRecord | null;
  activeFarms: FarmState[];
  logs: BlackboardLog[];
  weatherRiskProfile: "normal" | "drought" | "excessive_rain";
  setWeatherRiskProfile: (p: "normal" | "drought" | "excessive_rain") => void;
  agentConfig: AgentConfig;
  setAgentConfig: React.Dispatch<React.SetStateAction<AgentConfig>>;
}

export const PrecisionScheduling: React.FC<PrecisionSchedulingProps> = ({
  currentDay,
  isPlaying,
  onPlayPause,
  onReset,
  onStep,
  dayRecord,
  activeFarms,
  logs,
  weatherRiskProfile,
  setWeatherRiskProfile,
  agentConfig,
  setAgentConfig
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the blackboard logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const activeWeather = dayRecord || {
    day: 0,
    rain: 0,
    temperature: 30,
    weatherType: "Awaiting Season Initialization"
  };

  const weatherRiskOptions: Array<{ id: "normal" | "drought" | "excessive_rain"; label: string; desc: string }> = [
    { id: "normal", label: "Typical Monsoon Cycle", desc: "Standard rain distribution with moderate wet/dry intervals." },
    { id: "drought", label: "El Niño Dry Spell Shocks", desc: "Severe drought pattern. Limits rainfall to 15% of standard targets." },
    { id: "excessive_rain", label: "Monsoon Torrential Clouds", desc: "Heavy runoff with a severe 75mm cloudburst at day 45." }
  ];

  return (
    <div className="bg-[#FAF9F6] border border-[#1A1A1A]/20 p-6 md:p-8" id="sandbox-simulator-section">
      <div className="flex flex-col xl:flex-row xl:items-baseline justify-between mb-8 pb-4 border-b-2 border-[#1A1A1A]" id="sandbox-header">
        <div>
          <h2 className="text-3xl font-serif italic tracking-tighter text-[#1A1A1A] flex items-center gap-2">
            Adaptive Simulation Sandbox
          </h2>
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#6B6B6B] mt-1.5">
            Play, pause, and inject climate events to stress the agents
          </p>
        </div>

        {/* Dynamic Sandbox Controls */}
        <div className="mt-4 xl:mt-0 flex flex-wrap items-center gap-4">
          <div className="flex border border-[#1A1A1A] p-0.5 bg-white/50">
            <button
              onClick={onPlayPause}
              className={`px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer ${
                isPlaying
                  ? "bg-amber-600 text-white"
                  : "bg-[#2D5A27] text-white hover:bg-emerald-800"
              }`}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? "Pause" : "Play Run"}
            </button>
            <button
              onClick={onStep}
              disabled={isPlaying || currentDay >= 120}
              className="px-3 py-2 text-xs uppercase tracking-wider font-bold text-[#1A1A1A] hover:bg-black/5 disabled:opacity-30"
              title="Simulate 1 single day"
            >
              Step Day
            </button>
            <button
              onClick={onReset}
              className="px-3 py-2 text-xs font-bold text-[#1A1A1A] hover:bg-black/5 border-l border-black/10"
              title="Reset Season"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#1A1A1A] px-3 py-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Day Timeline:</span>
            <span className="text-xs font-mono font-bold text-[#1A1A1A]">T+{currentDay} / 120 Days</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left 4-cols: Weather metrics & Irrigation trigger control */}
        <div className="lg:col-span-4 space-y-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atmospheric Stressors</p>
          
          {/* Active weather meters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 border border-[#1A1A1A]/10 bg-white/40 text-left">
              <span className="text-[9px] text-sky-700 uppercase font-bold tracking-wider block">Rain Hydration</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-serif text-[#1A1A1A]">{activeWeather.rain} mm</span>
                <CloudRain className="h-4 w-4 text-sky-600 opacity-60" />
              </div>
            </div>
            <div className="p-4 border border-[#1A1A1A]/10 bg-white/40 text-left">
              <span className="text-[9px] text-[#D14900] uppercase font-bold tracking-wider block">Heat Constant</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-serif text-[#1A1A1A]">{activeWeather.temperature}°C</span>
                <Thermometer className="h-4 w-4 text-[#D14900] opacity-60" />
              </div>
            </div>
          </div>

          <div className="p-4 border border-black/10 bg-white/30 text-xs text-gray-700 font-serif leading-relaxed">
            <span className="text-[9px] uppercase font-bold tracking-wider block text-gray-400 mb-1">Forecast Mode</span>
            {activeWeather.weatherType}
          </div>

          {/* Sowing profile selectors */}
          <div className="border border-black/10 bg-white/50 p-5 space-y-5">
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider mb-2">Climate Profile Injector</span>
              <div className="space-y-1.5">
                {weatherRiskOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onReset();
                      setWeatherRiskProfile(opt.id);
                    }}
                    className={`w-full text-left p-3 border text-xs transition-all ${
                      weatherRiskProfile === opt.id
                        ? "bg-white border-[#1A1A1A] border-l-4 border-l-[#2D5A27] font-bold text-[#1A1A1A]"
                        : "bg-transparent border-black/5 hover:border-black/20 text-gray-650"
                    }`}
                  >
                    <span className="block font-serif italic text-sm">{opt.label}</span>
                    <span className="block text-[9.5px] text-gray-500 mt-0.5 leading-relaxed">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-black/5">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">OSA Moisture Threshold</span>
                <span className="text-xs font-mono font-bold text-[#2D5A27]">{agentConfig.osaIrrigationTrigger}mm</span>
              </div>
              <input
                type="range"
                min="20"
                max="55"
                value={agentConfig.osaIrrigationTrigger}
                onChange={(e) => setAgentConfig({ ...agentConfig, osaIrrigationTrigger: parseInt(e.target.value) })}
                className="w-full accent-[#2D5A27] cursor-pointer"
              />
              <span className="text-[10px] text-gray-500 font-serif leading-relaxed block mt-1.5">Adjust target moisture equivalent bucket depth limits for trigger approval.</span>
            </div>
          </div>
        </div>

        {/* Right 8-cols: Farms soil moisture cards & Blackboard terminal */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Co-op Member Soil Moisture & Yield Metrics</p>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {activeFarms.map((farm) => {
              const soilMoisturePercent = Math.min(100, Math.max(0, farm.soilMoisture));
              const isPorousDry = farm.soilMoisture < 25;
              const originalCrop = farm.allocatedCropId.charAt(0).toUpperCase() + farm.allocatedCropId.slice(1);

              return (
                <div key={farm.id} className="bg-white border border-[#1A1A1A]/10 p-4 hover:border-black transition-colors flex flex-col justify-between" id={`status-${farm.id}`}>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-serif font-bold text-gray-900 truncate" title={farm.ownerName}>{farm.ownerName.split(" ")[0]}</span>
                      {farm.waterSource === "Rainfed" ? (
                        <span className="text-[8px] border border-sky-400 bg-sky-50 text-sky-800 px-1 font-mono uppercase">Rainfed</span>
                      ) : (
                        <span className="text-[8px] border border-[#2D5A27] bg-green-50 text-green-900 px-1 font-mono uppercase">{farm.waterSource}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#6B6B6B] uppercase tracking-wider font-bold block mt-1">{originalCrop}</span>
                  </div>

                  {/* Horizontal soil moisture gauge */}
                  <div className="my-4">
                    <div className="flex justify-between text-[9px] text-gray-400 uppercase mb-1">
                      <span>Soil Water</span>
                      <span className={`font-mono ${isPorousDry ? "text-amber-600 animate-pulse font-bold" : "text-gray-700"}`}>
                        {Math.round(farm.soilMoisture)} mm
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-150 relative">
                      <div className="absolute left-[35%] right-[30%] top-0 bottom-0 bg-[#2D5A27]/10" />
                      <div
                        className={`h-full transition-all duration-300 ${isPorousDry ? "bg-amber-600" : "bg-[#2D5A27]"}`}
                        style={{ width: `${soilMoisturePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Yield potential factor */}
                  <div className="flex justify-between items-baseline pt-2 border-t border-black/5">
                    <span className="text-[9px] text-[#6B6B6B] uppercase font-bold tracking-wider">Yield forecast</span>
                    <span className={`text-[11px] font-mono font-bold ${farm.cropYieldFactor >= 0.95 ? "text-[#2D5A27]" : farm.cropYieldFactor >= 0.75 ? "text-yellow-600" : "text-red-600"}`}>
                      {Math.round(farm.cropYieldFactor * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shared Blackboard State Store terminal */}
          <div className="bg-[#1A1A1A] text-white p-5 border-l-4 border-orange-600 flex flex-col h-48 justify-between relative overflow-hidden select-none">
            <div className="absolute right-4 top-4 flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] text-[#FAF9F6] font-bold uppercase tracking-widest">
              <span className="h-1.5 w-1.5 bg-orange-500 animate-pulse rounded-full" /> Shared Blackboard
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2.5 pb-1 pr-1 text-left scrollbar-thin scrollbar-thumb-white/10">
              {logs.map((log, index) => {
                const logStyles = 
                  log.type === "critical"
                    ? "text-red-300 font-bold"
                    : log.type === "warning"
                    ? "text-amber-300"
                    : log.type === "success"
                    ? "text-emerald-300"
                    : "text-gray-300";

                return (
                  <div key={index} className="text-xs font-mono flex items-start gap-1.5 leading-relaxed">
                    <span className="text-gray-500 shrink-0 select-none">[Day {log.day}]</span>
                    <span className="font-bold shrink-0 select-none" style={{ color: log.agent === "OSA" ? "#60a5fa" : log.agent === "ASA" ? "#c084fc" : log.agent === "MIA" ? "#34d399" : log.agent === "EOA" ? "#f472b6" : "#e2e8f0" }}>
                      {log.agent}:
                    </span>
                    <span className={logStyles}>{log.message}</span>
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
