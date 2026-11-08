/** SI throughout. Lumped steady body-growth closure, not a free-boundary CZ solver. */
export const growthConstants={meltingK:1687, density:2330, latent:1.8e6, coolingW:600, meltH:500, crucibleDiameterM:.3, initialMeltKg:5, durationS:10800} as const;
export type GrowthInput={meltK:number;pullMps:number};
export const growthDefault:GrowthInput={meltK:1707,pullMps:.8e-3/60};
export function growthModel(input:GrowthInput){
 const {meltK,pullMps}=input,g=growthConstants;
 if(![meltK,pullMps].every(Number.isFinite)||meltK<g.meltingK||meltK>g.meltingK+80||pullMps<.2e-3/60-1e-15||pullMps>2e-3/60+1e-15)throw new RangeError('Thermal model requires melt superheat 0–80 K and pull speed 0.2–2.0 mm/min.');
 const superheat=meltK-g.meltingK,area=g.coolingW/(g.density*g.latent*pullMps+g.meltH*superheat),diameter=Math.sqrt(4*area/Math.PI),massRate=g.density*area*pullMps,liquidHeat=g.meltH*area*superheat,latentHeat=massRate*g.latent;
 if(diameter>=g.crucibleDiameterM)throw new RangeError('Calculated body exceeds the assumed crucible diameter; geometry is unsupported.');
 return {...input,superheat,area,diameter,massRate,liquidHeat,latentHeat,residual:g.coolingW-liquidHeat-latentHeat};
}
export type GrowthModel=ReturnType<typeof growthModel>;
export function growthAt(m:GrowthModel,timeS:number){const g=growthConstants;if(!Number.isFinite(timeS)||timeS<0||timeS>g.durationS)throw new RangeError('Run time must be between 0 and 180 minutes.');const length=m.pullMps*timeS,mass=m.massRate*timeS;if(mass>g.initialMeltKg)throw new RangeError('Initial melt exhausted; stop the run.');return{timeS,length,mass,remaining:g.initialMeltKg-mass,extractedJ:g.coolingW*timeS,meltHeatJ:m.liquidHeat*timeS,latentJ:m.latentHeat*timeS};}
export function growthSeries(m:GrowthModel){return Array.from({length:181},(_,minutes)=>{const r=growthAt(m,minutes*60);return{minutes,lengthMm:r.length*1000,massKg:r.mass};});}
export function growthCsv(m:GrowthModel){return `# Constant-condition lumped thermal model; melt_K=${m.meltK}; pull_m_s=${m.pullMps}; diameter_m=${m.diameter}; Qout_W=600; h_W_m2_K=500\ntime_s,length_m,diameter_m,mass_kg,remaining_melt_kg,extracted_J,melt_heat_J,latent_J\n`+Array.from({length:181},(_,i)=>{const r=growthAt(m,i*60);return[r.timeS,r.length,m.diameter,r.mass,r.remaining,r.extractedJ,r.meltHeatJ,r.latentJ].join(',');}).join('\n');}
