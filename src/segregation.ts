// Concentrations are dimensionless mass fractions; f is fraction of initial melt mass solidified.
export function validate(c0:number,k:number,f:number){if(![c0,k,f].every(Number.isFinite)||c0<=0||c0>=1||k<=0||f<0||f>=1)throw new RangeError('Require 0 < C0 < 1, k > 0 and 0 ≤ f < 1. The endpoint f = 1 is excluded.');}
export function liquid(c0:number,k:number,f:number){validate(c0,k,f);return c0*Math.exp((k-1)*Math.log1p(-f));}
export function solid(c0:number,k:number,f:number){return k*liquid(c0,k,f);}
// Impurity mass divided by INITIAL melt mass, integrated over [a,b].
export function inventory(c0:number,k:number,a:number,b:number){validate(c0,k,a);validate(c0,k,b);if(b<=a)throw new RangeError('Retained segment must have positive length.');return c0*Math.exp(k*Math.log1p(-a))*(-Math.expm1(k*(Math.log1p(-b)-Math.log1p(-a))));}
export function average(c0:number,k:number,a:number,b:number){return inventory(c0,k,a,b)/(b-a);}
export function balance(c0:number,k:number,f:number){validate(c0,k,f);const frozen=f===0?0:inventory(c0,k,0,f),remaining=(1-f)*liquid(c0,k,f);return {frozen,remaining,residual:(frozen+remaining-c0)/c0};}
export function profile(c0:number,k:number){return Array.from({length:501},(_,i)=>{const f=i*.999/500;return {f,cs:solid(c0,k,f)*1e9,low:solid(c0,.1,f)*1e9,unity:solid(c0,1,f)*1e9,high:solid(c0,2,f)*1e9};});}
