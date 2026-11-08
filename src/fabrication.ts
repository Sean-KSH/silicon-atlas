/** Independent analytical process kernels. All lengths m, times s, temperatures K, densities m^-3. */
export type Mask = 'diffusion'|'gate'|'contact'|'metal';
export type Rect = [number,number,number,number];
export const masks:Record<Mask,Rect[]>={diffusion:[[6,14,6,14],[26,34,6,14]],gate:[[13,27,5,15]],contact:[[8,12,8,12],[28,32,8,12]],metal:[[7,13,4,16],[13,27,3,17],[27,33,4,16]]};
// Separate metal islands with a 1 µm nominal gap on each side of the gate.
masks.metal=[[7,12,4,16],[14,26,3,17],[28,33,4,16]];
export const maskNames:Record<Mask,string>={diffusion:'01 · Diffusion',gate:'02 · Gate window',contact:'03 · Contacts',metal:'04 · Metal'};
export interface Recipe {fieldT:number;fieldTime:number;gateT:number;gateTime:number;diffT:number;diffTime:number;profile:'erfc'|'gaussian';surface:number;dose:number;acceptor:number;exposure:number;blur:number;alignment:Record<Mask,[number,number]>;fieldEtch:number;gateEtch:number;contactEtch:number;etch:'isotropic'|'anisotropic'}
export const defaults:Recipe={fieldT:1273.15,fieldTime:180*60,gateT:1273.15,gateTime:90*60,diffT:1273.15,diffTime:60*60,profile:'erfc',surface:1e25,dose:1e18,acceptor:1e21,exposure:1,blur:.4e-6,alignment:{diffusion:[0,0],gate:[0,0],contact:[0,0],metal:[0,0]},fieldEtch:12*60,gateEtch:12*60,contactEtch:1.5*60,etch:'isotropic'};
export const etchRate=100e-9/60, resistThickness=1.2e-6, metalThickness=.25e-6, width=40e-6,height=20e-6;
function nonnegative(x:number,name:string){if(!Number.isFinite(x)||x<0)throw Error(`${name} must be finite and nonnegative`)}
export function oxideRates(T:number,wet:boolean){if(T<1173.15||T>1373.15)throw Error('Oxidation range: 900–1100 °C');const B=(wet?5.940e-10:2.144e-9)*1e-4*Math.exp(-(wet?8237:14270)/T),linear=(wet?2.490:.173)*1e-2/1.68*Math.exp(-23200/T);return{B,A:B/linear,linear}}
export function oxideGrowth(initial:number,t:number,T:number,wet:boolean){nonnegative(initial,'Initial oxide');nonnegative(t,'Time');const{A,B}=oxideRates(T,wet),s=initial*initial+A*initial+B*t;return 2*s/(Math.sqrt(A*A+4*s)+A)}
export function diffusivity(T:number){if(T<1173.15||T>1373.15)throw Error('Diffusion range: 900–1100 °C');return 10.5e-4*Math.exp(-42800/T)}
// Abramowitz-Stegun 7.1.26: absolute erf error <1.5e-7.
export function erf(x:number){const s=x<0?-1:1,a=Math.abs(x),t=1/(1+.3275911*a);return s*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-a*a))}
export function erfc(x:number):number{if(x<0)return 2-erfc(-x);const t=1/(1+.3275911*x);return (((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x)}
export function concentration(z:number,r:Recipe){nonnegative(z,'Depth');if(r.diffTime<=0)throw Error('Diffusion time must be positive');const dt=diffusivity(r.diffT)*r.diffTime;return r.profile==='erfc'?r.surface*erfc(z/(2*Math.sqrt(dt))):r.dose/Math.sqrt(Math.PI*dt)*Math.exp(-z*z/(4*dt))}
export function junctionDepth(r:Recipe){if(concentration(0,r)<=r.acceptor)return null;let lo=0,hi=20*Math.sqrt(diffusivity(r.diffT)*r.diffTime);for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(concentration(mid,r)>r.acceptor)lo=mid;else hi=mid}return (lo+hi)/2}
export function profileDose(r:Recipe){return r.profile==='gaussian'?r.dose:2*r.surface*Math.sqrt(diffusivity(r.diffT)*r.diffTime/Math.PI)}
export function aerial(x:number,y:number,mask:Mask,r:Recipe){const [dx,dy]=r.alignment[mask],s=Math.SQRT2*r.blur;return masks[mask].reduce((sum,[a,b,c,d])=>sum+.25*(erf((x-dx-a*1e-6)/s)-erf((x-dx-b*1e-6)/s))*(erf((y-dy-c*1e-6)/s)-erf((y-dy-d*1e-6)/s)),0)*r.exposure}
export const steps=[
['P-type substrate','Start with a polished (100) p-type silicon wafer. Dimensions here are chosen teaching dimensions, not extracted mask metrology.'],
['Wet field oxidation','Grow protective field oxide on both faces. Silicon is consumed by 0.4407 times the added oxide thickness.'],
['Coat positive resist','Coat both faces. Positive resist protects the oxide until exposed regions are developed away.'],
['Expose diffusion mask','UV exposure creates a latent image. Brightness is the calculated Gaussian-blurred mask dose, not a ray-tracing simulation.'],
['Develop diffusion mask','Remove resist where normalized exposure exceeds 0.5. Unexposed positive resist remains.'],
['Etch diffusion windows','Etch oxide only through the developed openings. Isotropic etching also reaches laterally beneath resist.'],
['Strip diffusion resist','Remove resist without removing oxide or silicon.'],
['Diffuse phosphorus','Phosphorus enters only columns with fully opened oxide. The depth profile is computed; lateral dopant diffusion is omitted.'],
['Doped-glass cleanup','The lecture removes a Si–O–P glass after diffusion. This chemistry-only step is illustrated in the narrative; no glass thickness or cleanup oxide loss is calculated.'],
['Coat gate-window resist','Coat the front face for the gate-window mask. The backside is unprotected in the next oxide etch, as in the lecture.'],
['Expose gate window','Align a separate mask between the source and drain. This is not a self-aligned gate process.'],
['Develop gate window','Remove positive resist above the gate-window opening.'],
['Etch gate window + backside','Remove thick oxide from the channel region and unprotected backside. A short etch leaves residual oxide.'],
['Strip gate-window resist','Remove the remaining resist before thermal oxidation.'],
['Grow dry gate oxide','Dry oxidation adds thin oxide on exposed silicon and further grows existing oxide. The diffusion profile is frozen: later dopant redistribution and segregation are not coupled.'],
['Coat contact resist','Coat the front; assume the backside stays protected during this front contact patterning step.'],
['Expose contact mask','The source and drain contact openings must overlap the diffused regions.'],
['Develop contacts','Remove exposed positive resist. Underexposure can leave every contact closed.'],
['Etch contact openings','Clear gate oxide through contact windows. A separate backside clear is included here to permit the lecture’s final substrate metal.'],
['Strip contact resist','Contact windows should now expose n-type silicon. Residual oxide blocks contact.'],
['Coat lift-off resist','Pattern resist BEFORE aluminum deposition. This deliberately differs from metal deposition followed by metal etching.'],
['Expose metal mask','Align three isolated metal islands: source, gate and drain.'],
['Develop lift-off pattern','Resist openings identify where metal should remain. An ideal discontinuous film at resist edges is assumed.'],
['Deposit aluminum','Deposit 250 nm aluminum on the front and backside. Metal sitting on resist will be removed in lift-off.'],
['Lift off','Remove resist and the metal above it, leaving three separated metal islands where openings developed.'],
['Inspect four terminals','Inspect source, gate, drain and backside substrate contact geometry. Continuity flags are geometric checks, not predictions of contact resistance or transistor I–V.']
] as const;
export interface Snapshot{step:number;oxide:Float64Array;recess:Float64Array;resist:Uint8Array;dose:Float64Array;metal:Uint8Array;doped:Uint8Array;backOxide:number;backResist:boolean;backMetal:boolean;nx:number;ny:number}
function copy(s:Snapshot,step:number):Snapshot{return{...s,step,oxide:s.oxide.slice(),recess:s.recess.slice(),resist:s.resist.slice(),dose:s.dose.slice(),metal:s.metal.slice(),doped:s.doped.slice()}}
export function etchOxide(s:Snapshot,duration:number,kind:Recipe['etch']){const distance=duration*etchRate,dx=width/s.nx,dy=height/s.ny,old=s.oxide.slice();if(distance===0)return;const rx=Math.ceil(distance/dx),ry=Math.ceil(distance/dy);for(let y=0;y<s.ny;y++)for(let x=0;x<s.nx;x++){const i=y*s.nx+x;let depth=s.resist[i]?0:distance;if(kind==='isotropic'&&s.resist[i]){for(let oy=-ry;oy<=ry;oy++)for(let ox=-rx;ox<=rx;ox++){const xx=x+ox,yy=y+oy,d2=(ox*dx)**2+(oy*dy)**2;if(xx>=0&&xx<s.nx&&yy>=0&&yy<s.ny&&d2<distance*distance&&!s.resist[yy*s.nx+xx])depth=Math.max(depth,Math.sqrt(distance*distance-d2))}}s.oxide[i]=Math.max(0,old[i]-depth)}}
export function simulateRecipe(r:Recipe,nx=160):Snapshot[]{if(nx<40||nx>320||nx%2)throw Error('Grid must be even, 40–320');for(const k of ['fieldTime','gateTime','diffTime','surface','dose','acceptor','exposure','blur','fieldEtch','gateEtch','contactEtch'] as const)nonnegative(r[k],k);if(!r.diffTime||!r.blur||!r.acceptor)throw Error('Time, blur and background must be positive');for(const a of Object.values(r.alignment))for(const v of a)if(!Number.isFinite(v)||Math.abs(v)>6e-6)throw Error('Alignment range ±6 µm');const ny=nx/2,n=nx*ny,states:Snapshot[]=[];let s:Snapshot={step:0,oxide:new Float64Array(n),recess:new Float64Array(n),resist:new Uint8Array(n),dose:new Float64Array(n),metal:new Uint8Array(n),doped:new Uint8Array(n),backOxide:0,backResist:false,backMetal:false,nx,ny};const grow=(t:number,T:number,wet:boolean)=>{for(let i=0;i<n;i++){const next=oxideGrowth(s.oxide[i],t,T,wet);s.recess[i]+=.4407*(next-s.oxide[i]);s.oxide[i]=next}s.backOxide=oxideGrowth(s.backOxide,t,T,wet)};states.push(s);for(let step=1;step<steps.length;step++){s=copy(s,step);if([2,15].includes(step))s.backResist=true;if([6,19].includes(step))s.backResist=false;if(step===1)grow(r.fieldTime,r.fieldT,true);if([2,9,15,20].includes(step)){s.resist.fill(1);s.dose.fill(0)}if([3,10,16,21].includes(step)){const mask:Mask=step===3?'diffusion':step===10?'gate':step===16?'contact':'metal';for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)s.dose[y*nx+x]=aerial((x+.5)*width/nx,(y+.5)*height/ny,mask,r)}if([4,11,17,22].includes(step))for(let i=0;i<n;i++)if(s.dose[i]>=.5)s.resist[i]=0;if([5,12,18].includes(step)){const time=step===5?r.fieldEtch:step===12?r.gateEtch:r.contactEtch;etchOxide(s,time,r.etch);if(step!==5){s.backResist=false;s.backOxide=Math.max(0,s.backOxide-time*etchRate)}}if([6,13,19].includes(step))s.resist.fill(0);if(step===7&&junctionDepth(r)!==null)for(let i=0;i<n;i++)if(s.oxide[i]===0)s.doped[i]=1;if(step===14)grow(r.gateTime,r.gateT,false);if(step===23){s.metal.fill(1);s.backMetal=true}if(step===24){for(let i=0;i<n;i++)if(s.resist[i])s.metal[i]=0;s.resist.fill(0)}states.push(s)}return states}
export function inspect(s:Snapshot,r:Recipe){
 const y=Math.floor(s.ny/2),dx=width/s.nx,dy=height/s.ny,source:number[]=[],drain:number[]=[];
 for(let x=0;x<s.nx;x++)if(s.doped[y*s.nx+x])((x+.5)*dx<width/2?source:drain).push(x);
 const channel=source.length&&drain.length?(drain[0]-source[source.length-1]-1)*dx:null;
 const labels=new Int32Array(s.metal.length);let count=0;
 for(let i=0;i<labels.length;i++)if(s.metal[i]&&!s.resist[i]&&!labels[i]){count++;const queue=[i];labels[i]=count;for(let k=0;k<queue.length;k++){const j=queue[k],xx=j%s.nx,yy=Math.floor(j/s.nx);for(const next of [xx>0?j-1:-1,xx<s.nx-1?j+1:-1,yy>0?j-s.nx:-1,yy<s.ny-1?j+s.nx:-1])if(next>=0&&s.metal[next]&&!s.resist[next]&&!labels[next]){labels[next]=count;queue.push(next)}}}
 const [mx,my]=r.alignment.metal,anchor=(x:number)=>{const xx=Math.floor((x*1e-6+mx)/dx),yy=Math.floor((10e-6+my)/dy);return xx>=0&&xx<s.nx&&yy>=0&&yy<s.ny?labels[yy*s.nx+xx]:0},sid=anchor(9.5),gid=anchor(20),did=anchor(30.5);
 let sc=0,dc=0,short=0,gateTouch=false,overlapRows=0;
 for(let yy=0;yy<s.ny;yy++){let left=false,right=false;for(let x=0;x<s.nx;x++){const i=yy*s.nx+x;if(s.doped[i]){if(x<s.nx/2)left=true;else right=true}if(labels[i]&&s.oxide[i]===0){if(labels[i]===gid)gateTouch=true;if(s.doped[i]){if(labels[i]===sid&&x<s.nx/2)sc++;if(labels[i]===did&&x>=s.nx/2)dc++}else short++}}if(left&&right)overlapRows++}
 let gateCovers=channel!==null&&channel>0; if(gateCovers)for(let x=source[source.length-1]+1;x<drain[0];x++)if(labels[y*s.nx+x]!==gid||!gid||s.oxide[y*s.nx+x]===0)gateCovers=false;
 const bridged=!!((sid&&sid===gid)||(gid&&gid===did)||(sid&&sid===did));
 return{channel,sourceDrainOverlapWidth:overlapRows*dy,sourceContact:sc>0&&!bridged,drainContact:dc>0&&!bridged,gateInsulated:gateCovers&&!gateTouch&&!bridged,substrateContact:s.backMetal&&s.backOxide===0,unintendedSiliconContact:short>0,metalBridge:bridged,gateOxide:s.oxide[y*s.nx+Math.floor(s.nx/2)],junction:s.doped.some(Boolean)?junctionDepth(r):null}
}
export function exportRecipe(r:Recipe,states:Snapshot[],selected:number){const s=states[selected],zmax=12*Math.sqrt(diffusivity(r.diffT)*r.diffTime);return{schema:'silicon-atlas-fabrication-v1',units:'SI: m, s, K, m^-3, m^-2',recipe:r,selectedStep:selected,steps:steps.map(([name],i)=>({index:i,name})),metrics:inspect(s,r),modelLimits:['1D diffusion only; no subsequent redistribution','Height-field oxide etch; ideal selectivity and lift-off','No electrical device solution'],grid:{nx:s.nx,ny:s.ny,width,height},snapshots:states.map(a=>({...a,oxide:Array.from(a.oxide),recess:Array.from(a.recess),resist:Array.from(a.resist),dose:Array.from(a.dose),metal:Array.from(a.metal),doped:Array.from(a.doped)})),profile:Array.from({length:401},(_,i)=>{const z=i/400*zmax;return{depth_m:z,donor_m3:s.step>=7?concentration(z,r):0,acceptor_m3:r.acceptor}})}}
