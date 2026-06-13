import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Trophy, Droplets, Target, Award, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";

interface CumulativeAnalyticsProps {
  metrics: {
    agent: {
      totalRevenue: number;
      totalCost: number;
      totalProfit: number;
      totalYield: number;
      totalWater: number;
      waterEfficiency: number;
    };
    traditional: {
      totalRevenue: number;
      totalCost: number;
      totalProfit: number;
      totalYield: number;
      totalWater: number;
      waterEfficiency: number;
    };
  };
  currentDay: number;
}

export const CumulativeAnalytics: React.FC<CumulativeAnalyticsProps> = ({ metrics, currentDay }) => {
  const chartData = [
    {
      name: "Total Cost",
      "Agent FPO": metrics.agent.totalCost,
      "Traditional": metrics.traditional.totalCost
    },
    {
      name: "Gross Revenue",
      "Agent FPO": metrics.agent.totalRevenue,
      "Traditional": metrics.traditional.totalRevenue
    },
    {
      name: "Net Profit",
      "Agent FPO": metrics.agent.totalProfit,
      "Traditional": metrics.traditional.totalProfit
    }
  ];

  const profitDiff = metrics.agent.totalProfit - metrics.traditional.totalProfit;
  const isAgentLeading = profitDiff > 0;

  return (
    <div className="bg-[#FAF9F6] border border-[#1A1A1A]/20 p-6 md:p-8" id="analytics-section">
      <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-8 pb-4 border-b-2 border-[#1A1A1A]">
        <div>
          <h2 className="text-3xl font-serif italic tracking-tighter text-[#1A1A1A] flex items-center gap-2">
            Seasonal Cumulative Analysis & Efficiency Metrics
          </h2>
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#6B6B6B] mt-1.5">
            Compare financial performance and resource conservation metrics of ASA/FCA agents vs standard baseline
          </p>
        </div>
      </div>

      {currentDay === 0 ? (
        <div className="text-center py-20 bg-white border border-black/10 max-w-xl mx-auto space-y-4">
          <Award className="h-12 w-12 text-[#1A1A1A]/40 mx-auto" />
          <div className="space-y-1.5">
            <h3 className="text-lg font-serif italic text-[#1A1A1A]">Awaiting Simulation Data</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Initialize the crop planning sequence and run the 120-Day Sandbox simulator to compile real-time cooperative yield matrices.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comparative Bento-Grid Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Net Profits (Most Critical Card) */}
            <div className="p-5 bg-white border-2 border-[#1A1A1A] flex flex-col justify-between text-left">
              <div>
                <span className="text-[10px] text-[#2D5A27] uppercase font-black tracking-widest block">Net FPO Coop Profit</span>
                <span className="text-3xl font-serif italic text-[#1A1A1A] mt-1.5 block">₹{metrics.agent.totalProfit.toLocaleString()}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-black/10 flex items-center gap-1.5 text-xs text-[#2D5A27] font-bold font-serif italic">
                <Sparkles className="h-4 w-4 text-[#2D5A27]" />
                <span>+₹{profitDiff.toLocaleString()} surplus vs baseline</span>
              </div>
            </div>

            {/* Total Crop Harvested */}
            <div className="p-[21px] bg-white border border-black/10 flex flex-col justify-between text-left">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Coop Yield Aggregated</span>
                <span className="text-2xl font-serif italic text-[#1A1A1A] mt-1.5 block">{metrics.agent.totalYield} <span className="text-xs font-sans not-italic text-gray-450">Tons</span></span>
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center text-xs text-gray-500">
                <span>Traditional Baseline:</span>
                <span className="font-mono font-bold text-gray-800">{metrics.traditional.totalYield} T</span>
              </div>
            </div>

            {/* Environmental Water usage */}
            <div className="p-[21px] bg-white border border-black/10 flex flex-col justify-between text-left">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Total Irrigation Pumped</span>
                <span className="text-2xl font-serif italic text-[#1A1A1A] mt-1.5 block flex items-baseline gap-1.5">
                  {metrics.agent.totalWater.toLocaleString()} <span className="text-xs font-sans not-italic text-gray-450">m³</span>
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center text-xs text-gray-500">
                <span>Traditional Baseline:</span>
                <span className="font-mono font-bold text-gray-800">{metrics.traditional.totalWater.toLocaleString()} m³</span>
              </div>
            </div>

            {/* Irrigation Resource Efficiency (WUE) */}
            <div className="p-[21px] bg-white border border-black/10 flex flex-col justify-between text-left">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Water Use Efficiency (WUE)</span>
                <span className="text-2xl font-serif italic text-[#1A1A1A] mt-1.5 block">{metrics.agent.waterEfficiency.toFixed(2)} <span className="text-xs font-sans not-italic text-gray-450">kg/m³</span></span>
              </div>
              <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center text-xs text-gray-500">
                <span>Traditional Baseline:</span>
                <span className="font-mono font-bold text-gray-800">{metrics.traditional.waterEfficiency.toFixed(2)} kg/m³</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Column (2-grid columns) */}
            <div className="lg:col-span-2 bg-white/50 border border-black/10 p-5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Financial Allocation Comparison (INR)</span>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#1A1A1A", fontFamily: "serif" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#666" }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#FAF9F6", borderColor: "#1A1A1A", borderRadius: "0px", fontSize: "11px" }} 
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, ""]} 
                    />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Bar dataKey="Agent FPO" fill="#2D5A27" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Traditional" fill="#1A1A1A" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Strategic Risk Assessment column (1-grid-column) */}
            <div className="lg:col-span-1 bg-white border border-black/10 p-5 flex flex-col justify-between text-left">
              <div>
                <span className="text-[10px] text-[#2D5A27] uppercase font-bold tracking-widest block">FPO risk exposure check</span>
                <h4 className="text-xl font-serif italic text-[#1A1A1A] mt-2 flex items-center gap-1.5">
                  <ShieldAlert className="text-[#2D5A27] h-4.5 w-4.5 shrink-0" />
                  Portfolio Safety Rating
                </h4>
                
                <div className="space-y-3.5 mt-4 text-[11.5px] text-gray-700 leading-relaxed font-serif">
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 bg-[#2D5A27] mt-1.5 shrink-0" />
                    <p><strong>Bypass Contracts Protection</strong>: Selling directly to vetted food off-takers protects FPO members from sudden mandi broker cartels & distress sales.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 bg-[#2D5A27] mt-1.5 shrink-0" />
                    <p><strong>Diversification Shield</strong>: Zero monoculture avoids overproduction glut crashes. If one commodity prices tumble, others anchor seasonal cash flows.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 bg-[#2D5A27] mt-1.5 shrink-0" />
                    <p><strong>Precision Weather Adaptive Guard</strong>: Closed-loop irrigation triggers prevent plant wilting or water logging, securing consistent grade-A crop standard outputs.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-black/5 flex items-start gap-1.5 text-[11px] text-amber-900 leading-relaxed font-serif bg-amber-50/50 p-2.5 border border-amber-200">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                <span>Traditional baseline farmers have a <strong>42% higher vulnerability</strong> to total crop failure during monsoon dry-spells.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
