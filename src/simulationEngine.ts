import { Crop, Region, FarmState, BlackboardLog, SimulationDayRecord, AgentConfig, SoilNitrogen, WaterSource } from "./types";

// --- GLOBAL STATIC DATABASES ---

export const CROPS: Crop[] = [
  {
    id: "soybean",
    name: "Soybean",
    season: "Kharif",
    waterReqDaily: 4.5,
    soilNRequirement: "Medium",
    baseYield: 2.2, // tons/ha
    productionCost: 28000, // INR/ha
    basePrice: 44000, // INR/ton
    glutRisk: "LOW",
    droughtTolerance: 0.65,
    growthDays: 120,
    description: "Highly nutrient-efficient legume that fixes soil nitrogen. Safe Kharif crop with stable demand."
  },
  {
    id: "cotton",
    name: "Cotton (Bt)",
    season: "Kharif",
    waterReqDaily: 7.5,
    soilNRequirement: "High",
    baseYield: 1.8,
    productionCost: 48000,
    basePrice: 69000,
    glutRisk: "HIGH",
    droughtTolerance: 0.45,
    growthDays: 120,
    description: "High-value commercial fiber. Highly volatile prices and resource-intensive; prone to bollworm infestation."
  },
  {
    id: "maize",
    name: "Maize",
    season: "Kharif",
    waterReqDaily: 4.0,
    soilNRequirement: "High",
    baseYield: 4.8,
    productionCost: 24000,
    basePrice: 21000,
    glutRisk: "MEDIUM",
    droughtTolerance: 0.70,
    growthDays: 120,
    description: "Robust grain suitable for red gravelly soils. Requires high nitrogen but possesses resilient structural roots."
  },
  {
    id: "wheat",
    name: "Wheat",
    season: "Rabi",
    waterReqDaily: 3.8,
    soilNRequirement: "High",
    baseYield: 3.5,
    productionCost: 32000,
    basePrice: 22750,
    glutRisk: "LOW",
    droughtTolerance: 0.60,
    growthDays: 120,
    description: "Primary Rabi cereal. Thrives in moisture-cool settings, requiring nitrogen and timely watering."
  },
  {
    id: "chickpea",
    name: "Chickpea (Gram)",
    season: "Rabi",
    waterReqDaily: 2.5,
    soilNRequirement: "Low",
    baseYield: 1.6,
    productionCost: 19000,
    basePrice: 53000,
    glutRisk: "LOW",
    droughtTolerance: 0.80,
    growthDays: 120,
    description: "Nitrogen-fixing legume. Requires very little water and is highly resilient to winter light spells."
  },
  {
    id: "mustard",
    name: "Mustard",
    season: "Rabi",
    waterReqDaily: 3.0,
    soilNRequirement: "Medium",
    baseYield: 1.5,
    productionCost: 21000,
    basePrice: 54000,
    glutRisk: "MEDIUM",
    droughtTolerance: 0.75,
    growthDays: 120,
    description: "Popular oilseed crop. Good resistance to low temperature; requires medium soil moisture levels."
  },
  {
    id: "moong",
    name: "Moong Dal",
    season: "Zaid",
    waterReqDaily: 3.2,
    soilNRequirement: "Low",
    baseYield: 0.9,
    productionCost: 15000,
    basePrice: 72000,
    glutRisk: "LOW",
    droughtTolerance: 0.85,
    growthDays: 90,
    description: "Short-duration summer pulse. Extremely fast grower, requiring minimal surface moisture."
  }
];

export const REGIONS: Region[] = [
  {
    id: "vidarbha",
    name: "Vidarbha, Maharashtra",
    description: "Black Cotton Soils (Regur), prone to severe dry spells. Ideal for deep-rooted cotton and nitrogen-fixing soybeans.",
    soilSoilType: "Clayey Black Regur",
    soilN: "Low",
    soilP: "Medium",
    soilK: "High",
    groundwaterDepth: 180, // deep
    waterAvalaibilityScore: 4, // low
    typicalRainfall: 450
  },
  {
    id: "punjab",
    name: "Indo-Gangetic Basin, Punjab",
    description: "Alluvial soil with excessive canal systems. Extreme groundwater depletion but rich alluvial loam. High-feeding wheat/cereal yields.",
    soilSoilType: "Alluvial Loamy Clay",
    soilN: "Medium",
    soilP: "Low",
    soilK: "Medium",
    groundwaterDepth: 280, // highly depleted
    waterAvalaibilityScore: 9, // high
    typicalRainfall: 680
  },
  {
    id: "deccan",
    name: "Deccan Plateau, Karnataka",
    description: "Red gravelly and shallow soils with high percolation rate. Demands micro-irrigation schedulers to prevent rapid soil drying.",
    soilSoilType: "Red Sandy Gravelly",
    soilN: "Low",
    soilP: "Low",
    soilK: "Medium",
    groundwaterDepth: 120,
    waterAvalaibilityScore: 6,
    typicalRainfall: 520
  }
];

// Seed random generator for reproducible demo runs
function seedRandom(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

export function runCompleteSimulation(
  regionId: string,
  season: "Kharif" | "Rabi" | "Zaid",
  agentConfig: AgentConfig,
  weatherRiskProfile: "normal" | "drought" | "excessive_rain"
) {
  const rand = seedRandom("cropAgent" + regionId + season + weatherRiskProfile);
  const region = REGIONS.find(r => r.id === regionId) || REGIONS[0];
  const activeCrops = CROPS.filter(c => c.season === season);

  // Stand-alone soil water balance (single layer bucket model) tracker
  const applyDailyDynamics = (f: FarmState, rain: number, irrigation: number, estEvap: number) => {
    f.soilMoisture = Math.max(0.0, Math.min(100.0, f.soilMoisture + rain + irrigation - estEvap));
    if (irrigation > 0) {
      f.waterConsumed += irrigation * f.size * 10.0; // 1 mm/ha is exactly 10 cubic meters of water
    }
  };

  // Initialize virtual farms (representing a local FPO hub of 5 smallholder farms)
  const owners = [
    { name: "Suresh Patil", size: 1.8, soilN: region.soilN, water: "Borewell" as WaterSource },
    { name: "Ramesh Hegde", size: 2.2, soilN: region.soilN === "Low" ? "Medium" : region.soilN, water: "Rainfed" as WaterSource },
    { name: "Sunita Deshmukh", size: 3.5, soilN: "Low" as SoilNitrogen, water: "Canal" as WaterSource },
    { name: "Harpreet Singh", size: 1.2, soilN: region.soilN, water: "Rainfed" as WaterSource },
    { name: "Anil Kadam", size: 2.5, soilN: "High" as SoilNitrogen, water: "Borewell" as WaterSource }
  ];

  const totalDays = season === "Zaid" ? 90 : 120;
  const blackboardLogs: BlackboardLog[] = [];
  const dayRecords: SimulationDayRecord[] = [];

  // Log pre-season setup
  blackboardLogs.push({
    day: 0,
    agent: "System",
    type: "info",
    message: `Initializing Virtual FPO sandbox for ${region.name} (${season} season, ${totalDays} days). Total area: 11.2 hectares across 5 farms.`
  });

  // 1. MIA (Market Intelligence Agent) Prediction
  blackboardLogs.push({
    day: 0,
    agent: "MIA",
    type: "info",
    message: "Analyzing mandis, export patterns, and planting acreage indexes..."
  });

  const forecastedPrices: { [cropId: string]: { expected: number; premiumBonus: number; glutRisk: string; crashMultiplier: number } } = {};
  for (const c of activeCrops) {
    let glutStatus: string = c.glutRisk;
    let crashMultiplier = 1.0;

    // Simulate market events: Traditional farmers always flood Cotton
    if (c.id === "cotton" && weatherRiskProfile === "normal") {
      glutStatus = "HIGH glut imminent (84% of traditional region planting)";
      crashMultiplier = 0.76; // 24% price crash in open markets
    } else if (c.id === "cotton" && weatherRiskProfile === "drought") {
      glutStatus = "LOW (drought restricts traditional harvest)";
      crashMultiplier = 1.15; // prices surge due to low supply
    }

    const baseExpected = c.basePrice * crashMultiplier;
    // FPO wholesale middleman bypass premium
    const premiumBonus = baseExpected * (agentConfig.fcaContractBypassRate / 100);

    forecastedPrices[c.id] = {
      expected: baseExpected,
      premiumBonus,
      glutRisk: glutStatus,
      crashMultiplier
    };

    blackboardLogs.push({
      day: 0,
      agent: "MIA",
      type: glutStatus.includes("HIGH") ? "warning" : "success",
      message: `${c.name}: Expected Mandi standard: ₹${Math.round(baseExpected)}/ton (Glut risk: ${glutStatus}). FPO Buyer Premium: +₹${Math.round(premiumBonus)}/ton.`
    });
  }

  // 2. ASA (Agronomy & Soil Agent) Matchmaking
  blackboardLogs.push({
    day: 0,
    agent: "ASA",
    type: "info",
    message: "Evaluating local soil macronutrients and borehole recharge levels..."
  });

  // Calculate matching scores and propose crops
  const getSuitabilityScore = (farm: typeof owners[0], crop: Crop) => {
    let score = 85; // Base percent suitability
    if (crop.soilNRequirement === "High") {
      if (farm.soilN === "Low") score -= 25;
      if (farm.soilN === "Medium") score -= 10;
    }
    if (farm.water === "Rainfed") {
      if (crop.waterReqDaily > 6.0) score -= 30; // High water crops like cotton suffer
      else if (crop.waterReqDaily > 4.0) score -= 10;
    }
    if (region.id === "deccan" && crop.id === "soybean") {
      score -= 10; // slightly less adapted to very dry red sands
    }
    return Math.max(20, Math.min(100, score));
  };

  // 3. EOA (Executive Orchestrator Agent) Allocation Portfolio
  // Agent allocations: matches best crops avoiding market crashes or crop-water crash risk
  const agentFarmStates: FarmState[] = owners.map((owner, idx) => {
    // Dynamic matching selection
    let bestCropId = activeCrops[0].id;
    let maxSuitScore = -999;

    for (const c of activeCrops) {
      const suitability = getSuitabilityScore(owner, c);
      // Incorporate EOA optimization weight
      let optimizeWeight = suitability;
      
      // If profit focus, favor high priced cotton unless extreme risk
      const miaForecast = forecastedPrices[c.id];
      const yieldPotential = c.baseYield * (suitability / 100);
      const estReturn = (miaForecast.expected + miaForecast.premiumBonus) * yieldPotential - c.productionCost;

      if (agentConfig.eoaOptimizationFocus === "Profit") {
        optimizeWeight = estReturn * 0.7 + suitability * 0.3;
      } else if (agentConfig.eoaOptimizationFocus === "Resource") {
        // High penalty for high water requirements
        optimizeWeight = suitability * 1.5 - c.waterReqDaily * 8;
      }

      if (optimizeWeight > maxSuitScore) {
        maxSuitScore = optimizeWeight;
        bestCropId = c.id;
      }
    }

    const chosenCrop = activeCrops.find(c => c.id === bestCropId)!;
    const suitPercent = getSuitabilityScore(owner, chosenCrop);

    blackboardLogs.push({
      day: 0,
      agent: "EOA",
      type: "success",
      message: `Allocated [Farm ${idx + 1}: ${owner.name}] (${owner.size}ha, ${owner.water}) -> ${chosenCrop.name} (${suitPercent}% suitability score).`
    });

    return {
      id: `farm-${idx + 1}`,
      ownerName: owner.name,
      size: owner.size,
      soilN: owner.soilN,
      waterSource: owner.water,
      allocatedCropId: bestCropId,
      soilMoisture: owner.water === "Rainfed" ? 40.0 : 60.0,
      cropYieldFactor: 1.0,
      waterConsumed: 0.0,
      nitrogenDeficit: chosenCrop.soilNRequirement === "High" && owner.soilN === "Low",
      isHarvested: false,
      totalRevenue: 0,
      totalCost: 0
    };
  });

  // Traditional allocations: uncoordinated, heavy reliance on Cotton monoculture or simple tradition
  const traditionalFarmStates: FarmState[] = owners.map((owner, idx) => {
    // 80% traditional choose Cotton because they don't look at crop pricing glut charts
    // If it's Rabi, traditional farmers almost always plant Wheat monocross
    let tradCropId = activeCrops[0].id;
    if (season === "Kharif") {
      tradCropId = idx % 5 === 0 ? "soybean" : "cotton"; // Cotton monoculture bias
    } else if (season === "Rabi") {
      tradCropId = idx % 5 === 4 ? "chickpea" : "wheat"; // Wheat bias
    } else {
      tradCropId = activeCrops[0].id;
    }

    const isNitrogenDeficit = activeCrops.find(c => c.id === tradCropId)!.soilNRequirement === "High" && owner.soilN === "Low";

    return {
      id: `farm-${idx + 1}-trad`,
      ownerName: owner.name,
      size: owner.size,
      soilN: owner.soilN,
      waterSource: owner.water,
      allocatedCropId: tradCropId,
      soilMoisture: owner.water === "Rainfed" ? 40.0 : 60.0,
      cropYieldFactor: 1.0,
      waterConsumed: 0.0,
      nitrogenDeficit: isNitrogenDeficit,
      isHarvested: false,
      totalRevenue: 0,
      totalCost: 0
    };
  });

  // --- DAY-BY-DAY IN-SEASON SIMULATION ---

  blackboardLogs.push({
    day: 1,
    agent: "System",
    type: "info",
    message: `Entering 5-day sowing cycle. Ground monitoring setup complete. Virtual atmosphere sensor ONLINE.`
  });

  for (let day = 1; day <= totalDays; day++) {
    // Generate daily weather
    let rainChance = 0.15;
    let standardTemp = 32;
    let weatherType = "Sunny & Clear";

    if (season === "Kharif") {
      // Monsoonal pattern
      rainChance = 0.32;
      standardTemp = 30;
      if (day >= 20 && day <= 50) {
        // Active Monsoon
        rainChance = 0.55;
      }
    } else if (season === "Rabi") {
      rainChance = 0.08;
      standardTemp = 22;
    } else {
      // Zaid (extremely dry, hot summer)
      rainChance = 0.04;
      standardTemp = 39;
    }

    let rain = 0;
    if (rand() < rainChance) {
      rain = Math.round(rand() * 15 * 100) / 100;
      weatherType = rain > 12 ? "Sustained Monsoon Rains" : "Scattered Local Showers";
    }

    // Weather risk overrides
    if (weatherRiskProfile === "drought") {
      rain = rain * 0.18; // dry monsoon
      if (rain < 1) rain = 0;
      weatherType = "Extreme Dry Spell";
    } else if (weatherRiskProfile === "excessive_rain" && day >= 40 && day <= 55) {
      // Trigger a direct flood shock at week 7
      if (day === 45) {
        rain = 75.0;
        weatherType = "Severe Monsoon Cloudburst (75mm flood alert!)";
      } else {
        rain = rain * 1.5;
        weatherType = "Heavy Runoff Rain";
      }
    }

    const tempCoeff = rand() * 4 - 2;
    const temp = Math.round((standardTemp + tempCoeff) * 10) / 10;

    // Daily loop for all Farms
    const dayMoisturesAgent: { [id: string]: number } = {};
    const dayYieldsAgent: { [id: string]: number } = {};
    const dayWaterAgent: { [id: string]: number } = {};

    // 1. Process Agent Farms (Precision Scheduling)
    for (const f of agentFarmStates) {
      const crop = activeCrops.find(c => c.id === f.allocatedCropId)!;

      // Evapotranspiration
      const evapRate = crop.waterReqDaily * (1 + (temp - standardTemp) * 0.04) + (rand() * 1 - 0.5);
      const estEvap = Math.max(1.5, Math.min(9.0, evapRate));

      // OSA checks soil moisture. Irrigation triggers if soil moisture < config threshold
      let irrigationApplied = 0.0;
      const thresholdMoisture = agentConfig.osaIrrigationTrigger; // e.g. 35mm base threshold

      if (f.waterSource !== "Rainfed") {
        if (f.soilMoisture < thresholdMoisture && rain < 2.0) {
          // Precision Watering - apply just enough to reach 65mm saturation
          const desiredWater = Math.max(10, 65 - f.soilMoisture);
          irrigationApplied = Math.min(25, desiredWater);

          // Add feedback logs periodically on milestones or alert conditions
          if (day === 15 || day === 45 || day === 75 || day === 105) {
            blackboardLogs.push({
              day,
              agent: "OSA",
              type: "success",
              message: `Precision scheduling triggered on [Farm: ${f.ownerName}]. Applied ${Math.round(irrigationApplied)}mm to sustain growth (Moisture was ${Math.round(f.soilMoisture)}mm).`
            });
          }
        }
      }

      // Special protective actions for extreme storm
      let drainageProtectionFactor = 1.0;
      if (rain > 50 && day === 45) {
        // Agent OSA alerts farmer to clear ditches, avoiding most root rotting!
        drainageProtectionFactor = 0.95; // very minor yield loss
        blackboardLogs.push({
          day,
          agent: "OSA",
          type: "critical",
          message: `ALERT: Cloudburst of ${rain}mm detected. Automated text alert sent to FPO group to clear drainage channels. Secured crop yields!`
        });
      }

      // Apply crop dynamics
      applyDailyDynamics(f, rain, irrigationApplied, estEvap);

      // Drought Stress degradation logic
      if (f.soilMoisture < 25) {
        const stress = (25 - f.soilMoisture) / 25;
        // Crop yield factor drops
        const degradation = 0.007 * stress * (1.0 - crop.droughtTolerance) * drainageProtectionFactor;
        f.cropYieldFactor = Math.max(0.2, f.cropYieldFactor - degradation);
      }

      // Soil Nitrogen deficit degradation
      if (f.nitrogenDeficit) {
        // No fertilizers applied in traditional, but Agent applies precision nano-nitrogen fertilizer at day 20
        if (day < 20) {
          f.cropYieldFactor = Math.max(0.4, f.cropYieldFactor - 0.002);
        } else if (day === 20) {
          f.nitrogenDeficit = false;
          blackboardLogs.push({
            day,
            agent: "OSA",
            type: "info",
            message: `Dispatched customized Nano-N fertilizer guidance for [Farm: ${f.ownerName}] base soil. Nitrogen deficit RESOLVED.`
          });
        }
      }

      dayMoisturesAgent[f.id] = Math.round(f.soilMoisture * 10) / 10;
      dayYieldsAgent[f.id] = Math.round(f.cropYieldFactor * 100) / 100;
      dayWaterAgent[f.id] = Math.round(f.waterConsumed);
    }

    // 2. Process Traditional Farms (Fixed Intermittent Irrigation / No proactive drainage)
    for (const f of traditionalFarmStates) {
      const crop = activeCrops.find(c => c.id === f.allocatedCropId)!;

      // Evapotranspiration
      const evapRate = crop.waterReqDaily * (1 + (temp - standardTemp) * 0.04) + (rand() * 1 - 0.5);
      const estEvap = Math.max(1.5, Math.min(9.0, evapRate));

      // Traditional Irrigation: Fixed interval scheduling (irrigates 20mm exactly every 12 days, irrespective of rainfall or moistures)
      let irrigationApplied = 0.0;
      if (f.waterSource !== "Rainfed") {
        if (day % 12 === 0) {
          irrigationApplied = 20.0;
        }
      }

      // Extreme weather drainage deficit
      let drainageProtectionFactor = 1.0;
      if (rain > 50 && day === 45) {
        // Traditional farmers do not prepare drainage channels in time -> severe root rotting!
        drainageProtectionFactor = 0.65; // 35% yield reduction!
        blackboardLogs.push({
          day,
          agent: "System",
          type: "warning",
          message: `UNPREPARED: Traditional farmers suffered severe crop root waterlogging and wash-off in Punjab/Maharashtra due to lack of real-time cloudburst drainage alerts!`
        });
      }

      // Apply crop dynamics
      applyDailyDynamics(f, rain, irrigationApplied, estEvap);

      // Drought Stress degradation logic (worse because fixed water intervals might miss active dry spells)
      if (f.soilMoisture < 25) {
        const stress = (25 - f.soilMoisture) / 25;
        const degradation = 0.012 * stress * (1.0 - crop.droughtTolerance) * (1 / drainageProtectionFactor);
        f.cropYieldFactor = Math.max(0.15, f.cropYieldFactor - degradation);
      }

      // Permanent Nitrogen deficit (traditional farmers do not test soils and usually underdose or overdue)
      if (f.nitrogenDeficit) {
        f.cropYieldFactor = Math.max(0.3, f.cropYieldFactor - 0.0018);
      }
    }

    // Capture day records (for rendering graphs)
    dayRecords.push({
      day,
      rain,
      temperature: temp,
      weatherType,
      farmMoistures: dayMoisturesAgent,
      farmYieldFactors: dayYieldsAgent,
      farmWaterConsumed: dayWaterAgent
    });
  }

  // --- HARVESTING, AGGREGATION & CONTRACT SELLING ---

  blackboardLogs.push({
    day: totalDays,
    agent: "System",
    type: "info",
    message: "cropland season successfully completed! Initializing grading, logistics and bulk marketing sequence."
  });

  // Calculate yield outputs, total costs, total revenues
  let totalAgentRevenue = 0;
  let totalAgentCost = 0;
  let totalAgentYield = 0;
  let totalAgentWater = 0;

  let totalTradRevenue = 0;
  let totalTradCost = 0;
  let totalTradYield = 0;
  let totalTradWater = 0;

  const harvestTotalsAgent: { [cropId: string]: number } = {};
  const harvestTotalsTraditional: { [cropId: string]: number } = {};

  // Initialize crop metrics
  for (const c of activeCrops) {
    harvestTotalsAgent[c.id] = 0;
    harvestTotalsTraditional[c.id] = 0;
  }

  // 1. Process agent farms sales
  for (const f of agentFarmStates) {
    const crop = CROPS.find(c => c.id === f.allocatedCropId)!;
    const finalYield = crop.baseYield * f.cropYieldFactor * f.size; // in tons
    const mForecast = forecastedPrices[crop.id];
    const finalPricePerTon = mForecast.expected + mForecast.premiumBonus; // FPO bulk marketing premium

    const fertPestCostMultiplier = 1.05; // 5% extra for precision fertilizers but highly optimized
    const cost = crop.productionCost * f.size * fertPestCostMultiplier;
    const revenue = finalYield * finalPricePerTon;

    f.totalCost = Math.round(cost);
    f.totalRevenue = Math.round(revenue);
    f.isHarvested = true;

    totalAgentRevenue += revenue;
    totalAgentCost += cost;
    totalAgentYield += finalYield;
    totalAgentWater += f.waterConsumed;

    harvestTotalsAgent[crop.id] += finalYield;
  }

  // 2. Process traditional farms sales (sold individually to middlemen with a -15% penalty due to small volumes and transport desperation)
  for (const f of traditionalFarmStates) {
    const crop = CROPS.find(c => c.id === f.allocatedCropId)!;
    // traditional has a standard yield reduction due to unscientific practices
    const baseTradYieldFactor = f.cropYieldFactor * 0.88; 
    const finalYield = crop.baseYield * baseTradYieldFactor * f.size; // in tons
    
    // Middleman markdown penalty (15% markdown)
    const baseExpected = forecastedPrices[crop.id].expected;
    const finalPricePerTon = baseExpected * 0.85;

    // Traditional farmers waste fertilizers + spend heavily on reactive commercial chemicals
    const inputCostMultiplier = 1.15; // 15% higher chemical bill
    const cost = crop.productionCost * f.size * inputCostMultiplier;
    const revenue = finalYield * finalPricePerTon;

    f.totalCost = Math.round(cost);
    f.totalRevenue = Math.round(revenue);
    f.isHarvested = true;

    totalTradRevenue += revenue;
    totalTradCost += cost;
    totalTradYield += finalYield;
    totalTradWater += f.waterConsumed;

    harvestTotalsTraditional[crop.id] += finalYield;
  }

  // Log FPO direct contract deals
  blackboardLogs.push({
    day: totalDays,
    agent: "FCA",
    type: "success",
    message: `Aggregation completed successfully: soybean=${harvestTotalsAgent["soybean"]?.toFixed(1) || 0} tons, cotton=${harvestTotalsAgent["cotton"]?.toFixed(1) || 0} tons, maize=${harvestTotalsAgent["maize"]?.toFixed(1) || 0} tons.`
  });

  blackboardLogs.push({
    day: totalDays,
    agent: "FCA",
    type: "success",
    message: "Executed wholesale contracts bypassing village middlemen. Verified food processor quality metrics and dispatched FPO logistics trucks."
  });

  blackboardLogs.push({
    day: totalDays,
    agent: "EOA",
    type: "info",
    message: "Multi-Agent System complete. Final comparative profit matrices pushed to financial dashboard."
  });

  return {
    blackboardLogs,
    dayRecords,
    agentFarmStates,
    traditionalFarmStates,
    metrics: {
      agent: {
        totalRevenue: Math.round(totalAgentRevenue),
        totalCost: Math.round(totalAgentCost),
        totalProfit: Math.round(totalAgentRevenue - totalAgentCost),
        totalYield: Math.round(totalAgentYield * 100) / 100,
        totalWater: Math.round(totalAgentWater),
        waterEfficiency: totalAgentWater > 0 ? Math.round((totalAgentYield * 1000 / totalAgentWater) * 100) / 100 : 0
      },
      traditional: {
        totalRevenue: Math.round(totalTradRevenue),
        totalCost: Math.round(totalTradCost),
        totalProfit: Math.round(totalTradRevenue - totalTradCost),
        totalYield: Math.round(totalTradYield * 100) / 100,
        totalWater: Math.round(totalTradWater),
        waterEfficiency: totalTradWater > 0 ? Math.round((totalTradYield * 1000 / totalTradWater) * 100) / 100 : 0
      }
    }
  };
}
