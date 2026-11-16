#!/usr/bin/env python3
"""
Silicon Atlas: independent reference checks and paper figures.

Reads the JSON written by export-data.ts (the TypeScript kernels that run in the browser),
recomputes each reference result here with NumPy/SciPy from the textbook formulas, reports the
error, and draws the figures in paper/figures/. A summary goes to paper/data/summary.json and
is printed as the verification table used in the paper.

    pnpm paper:data && pnpm paper:figures
"""
import json
import math
import os

import numpy as np
from scipy import integrate, optimize
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")
FIG = os.path.join(HERE, "..", "figures")
os.makedirs(FIG, exist_ok=True)

Q = 1.602176634e-19
KB = 1.380649e-23
HBAR = 1.054571817e-34
EPS0 = 8.8541878128e-12


def load(name):
    with open(os.path.join(DATA, name + ".json")) as f:
        return json.load(f)


plt.rcParams.update({
    "font.family": "STIXGeneral", "mathtext.fontset": "stix", "font.size": 8,
    "axes.labelsize": 8, "axes.titlesize": 8, "legend.fontsize": 7, "xtick.labelsize": 7,
    "ytick.labelsize": 7, "axes.linewidth": 0.6, "lines.linewidth": 1.1, "grid.linewidth": 0.4,
    "grid.alpha": 0.35, "axes.grid": True, "savefig.bbox": "tight", "savefig.pad_inches": 0.02,
    "figure.dpi": 200, "legend.frameon": False,
})
ONE, TWO = 3.45, 7.1
K1, K2, K3, K4, KG = "#1b4f9c", "#c2410c", "#0f766e", "#7c3aed", "#6b7280"
REF = dict(color="black", lw=0.8, ls="--")
summary = {}


def save(fig, name):
    fig.savefig(os.path.join(FIG, name + ".pdf"))
    fig.savefig(os.path.join(FIG, name + ".png"), dpi=220)
    plt.close(fig)
    print("  figure", name)


def rel(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    return float(np.max(np.abs(a - b) / np.maximum(np.abs(b), 1e-300)))


# ------------------------------------------------------------------ 01 Scheil
s = load("scheil")
f = np.array(s["f"])
c0 = s["c0"]
err = 0.0
for cur in s["curves"]:
    k = cur["k"]
    err = max(err, rel(cur["cs"], k * c0 * (1 - f) ** (k - 1)))
bal = 0.0
for it in s["intervals"]:
    k, a, b = it["k"], it["a"], it["b"]
    inv = c0 * ((1 - a) ** k - (1 - b) ** k)
    bal = max(bal, rel(it["inventory"], inv), rel(it["average"], inv / (b - a)))
summary["scheil"] = {"profile_rel": err, "interval_rel": bal}

# ------------------------------------------------------------------ 02 Quantum
qd = load("quantum")
m, L = qd["m"], qd["L"]
lev = max(rel(l["E"], (l["n"] * math.pi * HBAR) ** 2 / (2 * m * L * L)) for l in qd["levels"])


def transfer_T(E, V, d, m):
    """Transmission from an explicit 2x2 transfer-matrix solution (independent of the closed form)."""
    k1 = math.sqrt(2 * m * E) / HBAR
    k2 = np.sqrt(complex(2 * m * (E - V))) / HBAR
    def M(k, x):
        return np.array([[np.exp(1j * k * x), np.exp(-1j * k * x)],
                         [1j * k * np.exp(1j * k * x), -1j * k * np.exp(-1j * k * x)]])
    T = np.linalg.solve(M(k1, 0), M(k2, 0)) @ np.linalg.solve(M(k2, d), M(k1, d))
    return float(1 / abs(T[0, 0]) ** 2)


E = np.array(qd["E"])
Tref = np.array([transfer_T(e, qd["V"], qd["d"], m) for e in E])
Tw_ref = np.array([transfer_T(0.3 * Q, qd["V"], w, m) for w in qd["widths"]])
summary["quantum"] = {"levels_rel": lev, "transmission_abs": float(np.max(np.abs(np.array(qd["T"]) - Tref))),
                      "thick_rel": rel(qd["Tw"], Tw_ref)}

fig, ax = plt.subplots(1, 2, figsize=(ONE * 2, 1.75))
ax[0].plot(E / Q, qd["T"], color=K1, label="Engine")
ax[0].plot(E[::12] / Q, Tref[::12], "o", ms=2.6, mfc="none", color="black", mew=0.6, label="Transfer matrix")
ax[0].axvline(qd["V"] / Q, color=KG, lw=0.6, ls=":")
ax[0].set_xlabel("Electron energy $E$ (eV)"); ax[0].set_ylabel("Transmission $T$")
ax[0].legend(loc="lower right")
ax[1].semilogy(np.array(qd["widths"]) * 1e9, qd["Tw"], color=K1)
ax[1].semilogy(np.array(qd["widths"])[::5] * 1e9, Tw_ref[::5], "o", ms=2.6, mfc="none", color="black", mew=0.6)
ax[1].set_xlabel("Barrier width $d$ (nm)"); ax[1].set_ylabel("$T$ at $E=0.3$ eV, $U_0=1$ eV")
save(fig, "fig_quantum")

# ------------------------------------------------------------------ 03 Equilibrium
eq = load("equilibrium")
fd_err = {}
for npts in (128, 512):
    errs = []
    for r in eq["fermi"]:
        eta = r["eta"]
        ref = 2 / math.sqrt(math.pi) * integrate.quad(lambda x: math.sqrt(x) / (1 + math.exp(min(x - eta, 700))), 0, max(eta, 0) + 60, limit=400)[0]
        errs.append(abs(r[f"f{npts}"] - ref) / ref)
    fd_err[npts] = max(errs)

# Independent Boltzmann neutrality with incomplete donor ionization (g = 2), Si, ND = 1e15 cm^-3.
T = np.array(eq["T"])
Nd = eq["donors"]
Eg = eq["gap"] * Q
Ed = Eg - 0.045 * Q
n_ref = []
for t in T:
    kt = KB * t
    nc = eq["nc300"] * (t / 300) ** 1.5
    nv = eq["nv300"] * (t / 300) ** 1.5
    def g(ef):
        n = nc * math.exp((ef - Eg) / kt)
        p = nv * math.exp(-ef / kt)
        ndp = Nd / (1 + 2 * math.exp((ef - Ed) / kt))
        return math.log(p + ndp) - math.log(n)
    ef = optimize.brentq(g, -10 * kt, Eg + 10 * kt, xtol=1e-30, rtol=1e-14)
    n_ref.append(nc * math.exp((ef - Eg) / kt))
n_ref = np.array(n_ref)
n_mb = np.array([r["n"] for r in eq["mb"]])
summary["equilibrium"] = {"fd128_rel": fd_err[128], "fd512_rel": fd_err[512], "n_mb_rel": rel(n_mb, n_ref),
                          "ni300_cm3": eq["ni300"] / 1e6}

fig, ax = plt.subplots(1, 2, figsize=(ONE * 2, 1.85))
ax[0].semilogy(T, n_mb / 1e6, color=K1, label="$n$, Boltzmann")
ax[0].semilogy(T, np.array([r["n"] for r in eq["fd"]]) / 1e6, color=K2, ls="--", label="$n$, Fermi–Dirac")
ax[0].semilogy(T[::6], n_ref[::6] / 1e6, "o", ms=2.6, mfc="none", color="black", mew=0.6, label="Reference (SciPy)")
ax[0].semilogy(T, np.array([r["ni"] for r in eq["mb"]]) / 1e6, color=KG, lw=0.8, label="$n_i$")
ax[0].axhline(Nd / 1e6, color=KG, lw=0.6, ls=":")
ax[0].set_ylim(1e10, 1e18); ax[0].set_xlabel("Temperature (K)"); ax[0].set_ylabel("Concentration (cm$^{-3}$)")
ax[0].legend(loc="lower right", fontsize=6)
etas = [r["eta"] for r in eq["fermi"]]
for npts, col in ((128, K1), (512, K3)):
    vals = []
    for r in eq["fermi"]:
        eta = r["eta"]
        ref = 2 / math.sqrt(math.pi) * integrate.quad(lambda x: math.sqrt(x) / (1 + math.exp(min(x - eta, 700))), 0, max(eta, 0) + 60, limit=400)[0]
        vals.append(max(abs(r[f"f{npts}"] - ref) / ref, 1e-17))
    ax[1].semilogy(etas, vals, color=col, label=f"{npts} Simpson panels")
ax[1].set_xlabel(r"Reduced Fermi level $\eta$"); ax[1].set_ylabel(r"Relative error in $F_{1/2}(\eta)$")
ax[1].set_ylim(1e-17, 1e-6); ax[1].legend(loc="lower left")
save(fig, "fig_equilibrium")

# ------------------------------------------------------------------ 04 Transport
tr = load("transport")
s0, D = tr["sigma0"], tr["D"]
fig, ax = plt.subplots(1, 2, figsize=(ONE * 2, 1.75))
var_err = {}
for d, col in zip(tr["diffusion"], (K2, K1, K3)):
    t = np.array(d["t"])
    ref = s0 ** 2 + 2 * D * t
    var_err[d["cells"]] = rel(d["variance"], ref)
    ax[0].plot(t * 1e9, (np.array(d["variance"]) - s0 ** 2) * 1e12, color=col, label=f'{d["cells"]} cells')
tt = np.linspace(0, tr["diffusion"][0]["t"][-1], 50)
ax[0].plot(tt * 1e9, 2 * D * tt * 1e12, **REF, label=r"$2Dt$")
ax[0].set_xlabel("Time (ns)"); ax[0].set_ylabel(r"$\sigma^2-\sigma_0^2$ ($\mu$m$^2$)")
ax[0].legend(loc="upper left")
dec = tr["decay"]
t = np.array(dec["t"])
ref = dec["n0"] * np.exp(-t / dec["tau"])
dec_err = rel(dec["number"], ref)
ax[1].semilogy(t * 1e6, np.array(dec["number"]) / dec["n0"], color=K1, label="Engine")
ax[1].semilogy(t[::4] * 1e6, ref[::4] / dec["n0"], "o", ms=2.6, mfc="none", color="black", mew=0.6, label=r"$e^{-t/\tau}$")
ax[1].set_xlabel(r"Time ($\mu$s)"); ax[1].set_ylabel("Excess carriers (normalized)")
ax[1].legend(loc="upper right")
save(fig, "fig_transport")
drift_ref = tr["center"] - tr["mobility"] * tr["driftField"] * tr["driftTime"]
drift_err = max(abs(d["mean"] - drift_ref) for d in tr["drift"])
spread = [(d["cells"], d["variance"] - s0 ** 2) for d in tr["drift"]]
order = math.log(spread[0][1] / spread[-1][1], 2) / 3
summary["transport"] = {"variance_rel": var_err, "decay_rel": dec_err, "drift_mean_abs_m": drift_err,
                        "numerical_spread_order": order}

# ------------------------------------------------------------------ 05 Oxidation and diffusion
fb = load("fabrication")
t = np.array(fb["t"])
fig, ax = plt.subplots(1, 2, figsize=(ONE * 2, 1.85))
ox_err = 0.0
for c, col in zip(fb["cases"], (K1, K2, K3)):
    A, B = c["A"], c["B"]
    ref = A / 2 * (np.sqrt(1 + t / (A * A / (4 * B))) - 1)
    ox_err = max(ox_err, rel(np.array(c["x"])[1:], ref[1:]))
    lab = f'{"wet" if c["wet"] else "dry"}, {c["T"] - 273.15:.0f} °C'
    ax[0].plot(t / 3600, np.array(c["x"]) * 1e9, color=col, label=lab)
    ax[0].plot(t / 3600, (B / A) * t * 1e9, color=col, lw=0.5, ls=":")
    ax[0].plot(t / 3600, np.sqrt(B * t) * 1e9, color=col, lw=0.5, ls="--")
ax[0].set_ylim(0, 1300); ax[0].set_xlabel("Oxidation time (h)"); ax[0].set_ylabel("Oxide thickness (nm)")
ax[0].legend(loc="upper left", fontsize=6)
comp = max(abs(c["twoSteps"] - c["direct"]) / c["direct"] for c in fb["composition"])
dose_err = 0.0
for p, col in zip(fb["profiles"], (K1, K2)):
    z, cz = np.array(p["z"]), np.array(p["c"])
    if p["profile"] == "gaussian":
        ref = p["doseIn"] / math.sqrt(math.pi * p["dt"]) * np.exp(-z * z / (4 * p["dt"]))
        dose = integrate.quad(lambda zz: p["doseIn"] / math.sqrt(math.pi * p["dt"]) * math.exp(-zz * zz / (4 * p["dt"])), 0, 40 * math.sqrt(p["dt"]), limit=200)[0]
        dose_err = max(dose_err, abs(p["dose"] - dose) / dose)
    else:
        from scipy.special import erfc
        ref = p["surface"] * erfc(z / (2 * math.sqrt(p["dt"])))
        dose = integrate.quad(lambda zz: p["surface"] * erfc(zz / (2 * math.sqrt(p["dt"]))), 0, 40 * math.sqrt(p["dt"]), limit=200)[0]
        dose_err = max(dose_err, abs(p["dose"] - dose) / dose)
    prof_err = float(np.max(np.abs(cz - ref) / np.maximum(ref, cz.max() * 1e-6)))
    summary.setdefault("diffusion_profile_rel", {})[p["profile"]] = prof_err
    ax[1].semilogy(z * 1e6, cz / 1e6, color=col, label="Limited dose (Gaussian)" if p["profile"] == "gaussian" else "Constant source (erfc)")
ax[1].axhline(fb["profiles"][0]["acceptor"] / 1e6, color=KG, lw=0.6, ls=":")
ax[1].set_ylim(1e14, 1e21); ax[1].set_xlim(0, 1.0); ax[1].set_xlabel(r"Depth ($\mu$m)"); ax[1].set_ylabel("Phosphorus (cm$^{-3}$)")
ax[1].legend(loc="upper right", fontsize=6)
save(fig, "fig_fabrication")
summary["oxidation"] = {"deal_grove_rel": ox_err, "composition_rel": comp}
summary["diffusion_dose_rel"] = dose_err

# ------------------------------------------------------------------ 06 Junction
jn = load("junction")
c = jn["input"]
vt, eps, ni = jn["vt"], jn["epsilon"], jn["ni"]
na, nd = c["na"], c["nd"]
vbi = vt * math.log(na * nd / ni ** 2)
w = math.sqrt(2 * eps * vbi / Q * (1 / na + 1 / nd))
dep_err = max(abs(jn["vbi"] - vbi) / vbi, abs(jn["w"] - w) / w, abs(abs(jn["peak"]) - 2 * vbi / w) / (2 * vbi / w))
x = np.array(jn["x"])
pb = jn["pb"]
xp = np.array([r["x"] for r in pb])
fig, ax = plt.subplots(1, 3, figsize=(TWO, 1.8))
ax[0].plot(x * 1e6, np.array(jn["depField"]) / 1e5, color=K1, label="Depletion")
ax[0].plot(xp * 1e6, np.array([r["field"] for r in pb]) / 1e5, color=K2, ls="--", label="Poisson–Boltzmann")
ax[0].set_xlabel(r"$x$ ($\mu$m)"); ax[0].set_ylabel("Electric field (kV/cm)"); ax[0].legend(loc="lower right", fontsize=6)
ax[0].set_xlim(-0.6, 1.6)
ax[1].plot(x * 1e6, jn["depPhi"], color=K1)
ax[1].plot(xp * 1e6, np.array([r["phi"] for r in pb]) - pb[0]["phi"], color=K2, ls="--")
ax[1].set_xlabel(r"$x$ ($\mu$m)"); ax[1].set_ylabel(r"Potential $\phi$ (V)"); ax[1].set_xlim(-0.6, 1.6)
cells = np.array([r["cells"] for r in jn["refine"]])
peaks = np.array([r["peak"] for r in jn["refine"]])
ref_peak = peaks[-1] + (peaks[-1] - peaks[-2])  # Richardson extrapolation, first order (observed)
ax[2].loglog(cells, np.abs(peaks - ref_peak) / ref_peak, "o-", color=K1, ms=3)
ax[2].loglog(cells, 0.6 * (cells / cells[0]) ** -1 * abs(peaks[0] - ref_peak) / ref_peak, **REF, label=r"$\propto N^{-1}$")
ax[2].set_xlabel("Cells per side $N$"); ax[2].set_ylabel("Relative error in peak field"); ax[2].legend(loc="lower left")
save(fig, "fig_junction")
obs = [math.log(abs(peaks[i] - ref_peak) / abs(peaks[i + 1] - ref_peak), 2) for i in range(len(peaks) - 2)]
gauss = max(r["gaussError"] for r in jn["refine"])
neamen = jn["neamen"]
book = {"vbi": 0.635, "w": 0.951e-6, "peak": 1.34e6, "w5": 2.83e-6, "cap5": 3.66e-5}
nm_err = max(abs(neamen["zero"]["vbi"] - book["vbi"]) / book["vbi"], abs(neamen["zero"]["w"] - book["w"]) / book["w"],
             abs(abs(neamen["zero"]["peak"]) - book["peak"]) / book["peak"], abs(neamen["rev5"]["w"] - book["w5"]) / book["w5"],
             abs(neamen["rev5"]["cap"] - book["cap5"]) / book["cap5"])
rv = jn["reverse"]
cap_scaling = max(abs(r["w"] - math.sqrt(2 * eps * (vbi + r["vr"]) / Q * (1 / na + 1 / nd))) / r["w"] for r in rv)
summary["junction"] = {"depletion_rel": dep_err, "reverse_rel": cap_scaling, "pb_gauss_rel": gauss,
                       "pb_peak_order": obs, "pb_vs_depletion_peak": float(peaks[-1] / abs(jn["peak"])),
                       "pb_iterations": [r["iterations"] for r in jn["refine"]], "neamen_rel": nm_err,
                       "vbi": jn["vbi"], "w_um": jn["w"] * 1e6}

# ------------------------------------------------------------------ 07 Diode
dd = load("diode")
p = dd["params"]
ci = dd["input"]
n0 = p["ni"] ** 2 / ci["na"]
p0 = p["ni"] ** 2 / ci["nd"]
Is = Q * ci["area"] * (p["dn"] / p["ln"] * n0 / math.tanh(ci["wp"] / p["ln"]) + p["dp"] / p["lp"] * p0 / math.tanh(ci["wn"] / p["lp"]))
v = np.array(dd["v"])
iref = Is * np.expm1(v / p["vt"])
diode_err = max(rel(dd["i1"], iref), rel(dd["i2"], 2 * iref))
slope = float(np.polyfit(v[v > 0.2], np.log10(np.array(dd["i1"])[v > 0.2]), 1)[0])
summary["diode"] = {"iv_rel": diode_err, "is_rel": abs(p["is"] - Is) / Is, "mv_per_decade": 1000 / slope,
                    "expected_mv_per_decade": 1000 * p["vt"] * math.log(10)}

# ------------------------------------------------------------------ 08 MOS
ms = load("mos")
mp = ms["params"]
cox, eps_s, p0m, n0m, vtm, vfb = mp["cox"], mp["eps"], mp["major"], mp["minor"], mp["vt"], mp["vfb"]
LD = math.sqrt(eps_s * vtm / (Q * p0m))


def Qs(psi):
    u = psi / vtm
    F = math.sqrt(max((math.exp(-u) + u - 1) + (n0m / p0m) * (math.exp(u) - u - 1), 0.0))
    return -math.copysign(1, psi) * math.sqrt(2) * eps_s * vtm / LD * F


def VG(psi):
    return vfb + psi - Qs(psi) / cox


psis = np.linspace(-0.3, 1.0, 4001)
vgs = np.array([VG(x) for x in psis])
qss = np.array([Qs(x) for x in psis])
cref = -np.gradient(qss, vgs)
vg = np.array([r["vg"] for r in ms["cv"]])
cqs = np.array([r["cqs"] for r in ms["cv"]])
cref_i = np.interp(vg, vgs, cref)
mask = (vg > vgs.min()) & (vg < vgs.max())
cv_err = float(np.max(np.abs(cqs[mask] - cref_i[mask]) / cox))
psi_ref = np.interp(vg, vgs, psis)
psi_err = float(np.max(np.abs(np.array([r["psi"] for r in ms["cv"]])[mask] - psi_ref[mask])))
fig, ax = plt.subplots(1, 2, figsize=(ONE * 2, 1.85))
ax[0].plot(vg, cqs / cox, color=K1, label="Quasi-static (engine)")
ax[0].plot(vg[::10], cref_i[::10] / cox, "o", ms=2.6, mfc="none", color="black", mew=0.6, label="Independent reference")
chf = np.array([np.nan if r["chf"] is None else r["chf"] for r in ms["cv"]])
ax[0].plot(vg, chf / cox, color=K2, ls="--", label="High-frequency approx.")
ax[0].axvline(vfb, color=KG, lw=0.6, ls=":"); ax[0].axvline(mp["theta"], color=KG, lw=0.6, ls=":")
ax[0].set_xlabel(r"Gate voltage $V_G$ (V)"); ax[0].set_ylabel(r"$C/C_{ox}$"); ax[0].set_ylim(0, 1.05)
ax[0].legend(loc="lower left", fontsize=6)
vds = np.array(ms["vds"])
beta = ms["input"]["mobility"] * cox * ms["input"]["W"] / ms["input"]["L"]
fet_err = 0.0
for o, col in zip(ms["output"], (K3, K1, K4, K2)):
    ov = o["vgs"] - mp["theta"]
    ref = np.where(vds < ov, beta * (ov * vds - vds ** 2 / 2), beta * ov ** 2 / 2)
    fet_err = max(fet_err, float(np.max(np.abs(np.array(o["id"]) - ref)) / np.max(ref)))
    ax[1].plot(vds, np.array(o["id"]) * 1e6, color=col, label=f'$V_{{GS}}={o["vgs"]:.1f}$ V')
ax[1].set_xlabel(r"$V_{DS}$ (V)"); ax[1].set_ylabel(r"$I_D$ ($\mu$A)"); ax[1].legend(loc="upper left", fontsize=6)
save(fig, "fig_mos")
summary["mos"] = {"cv_abs_over_cox": cv_err, "psi_abs_V": psi_err, "fet_rel": fet_err, "vfb": vfb, "vt": mp["theta"]}

# ------------------------------------------------------------------ 09 Solar and 10 bench (one figure)
so = load("solar")
voc = so["vt"] * math.log1p(so["iph"] / so["is"])
pw = lambda vv: -(vv * (so["iph"] - so["is"] * math.expm1(vv / so["vt"])))
r = optimize.minimize_scalar(pw, bounds=(0, voc), method="bounded", options={"xatol": 1e-12})
pmax = -r.fun
summary["solar"] = {"voc_rel": abs(so["voc"] - voc) / voc, "isc_rel": abs(so["isc"] - so["iph"]) / so["iph"],
                    "pmax_rel": abs(so["mpp"]["power"] - pmax) / pmax, "ff": so["ff"], "balance_abs_W": abs(so["balance"])}
bn = load("bench")
fr = [r_["frequency"] for r_ in bn["runs"]]
summary["bench"] = {"ring_f_MHz": fr[0] / 1e6, "dt_change_rel": abs(fr[1] - fr[0]) / fr[0],
                    "dt_change_rel_4": abs(fr[2] - fr[1]) / fr[1],
                    "edge_vs_period_rel": abs(bn["runs"][0]["edgeDelay"] - bn["runs"][0]["delayFromRing"]) / bn["runs"][0]["delayFromRing"],
                    "probe_MHz": {p_["probe"]: p_["frequency"] / 1e6 for p_ in bn["probes"]},
                    "sheet_extracted": bn["resistor"]["extracted"], "fet_error": bn["fet"]["error"]}

fig, ax = plt.subplots(1, 3, figsize=(TWO, 1.8))
v = np.array(dd["v"])
ax[0].semilogy(v, dd["i1"], color=K1, label="Area $A$")
ax[0].semilogy(v, dd["i2"], color=K2, label="Area $2A$")
ax[0].semilogy(v[::6], iref[::6], "o", ms=2.6, mfc="none", color="black", mew=0.6, label="Shockley (SciPy)")
ax[0].set_xlabel("Forward bias (V)"); ax[0].set_ylabel("Current (A)"); ax[0].legend(loc="lower right", fontsize=6)
vv = np.array(so["v"])
ii = np.array(so["i"])
ax[1].plot(vv, ii * 1e6, color=K1, label="Current")
ax1b = ax[1].twinx()
ax1b.plot(vv, vv * ii * 1e6, color=K2, ls="--", label="Power")
ax1b.plot([so["mpp"]["v"]], [so["mpp"]["power"] * 1e6], "o", color=K2, ms=3)
ax1b.set_ylabel(r"Power ($\mu$W)", color=K2); ax1b.grid(False); ax1b.tick_params(axis="y", colors=K2)
ax[1].set_xlabel("Terminal voltage (V)"); ax[1].set_ylabel(r"Current ($\mu$A)")
probes = bn["probes"]
labels = {"ideal": "Ideal probe", "buffer": "Buffered", "direct": "Direct 10 pF"}
ax[2].bar([labels[p_["probe"]] for p_ in probes], [p_["frequency"] / 1e6 for p_ in probes], color=[K1, K3, K2], width=0.55)
for i_, p_ in enumerate(probes):
    ax[2].text(i_, p_["frequency"] / 1e6 + 0.02, f'{p_["frequency"] / 1e6:.3f}', ha="center", fontsize=6.5)
ax[2].set_ylabel("Ring frequency (MHz)"); ax[2].set_ylim(0.9, 1.33); ax[2].grid(axis="x", visible=False)
ax[2].tick_params(axis="x", labelsize=6.5)
fig.subplots_adjust(wspace=0.62)
save(fig, "fig_devices")

# ------------------------------------------------------------------ Scheil figure
fig, ax = plt.subplots(figsize=(ONE, 1.8))
for cur, col in zip(s["curves"], (K1, K3, KG, K2)):
    ax.semilogy(f, np.array(cur["cs"]) / c0, color=col, label=f'$k={cur["k"]}$')
ax.set_xlabel("Fraction solidified $f$"); ax.set_ylabel(r"$C_s/C_0$"); ax.legend(loc="upper left", ncol=2)
save(fig, "fig_scheil")

with open(os.path.join(DATA, "summary.json"), "w") as fh:
    json.dump(summary, fh, indent=1)
print(json.dumps(summary, indent=1))
