/** Instructional actions and observations, indexed by the immutable process timeline. */
export const fabricationGuide: readonly [string, string][] = [
  [
    'Start with the tested recipe, then press Next or Run tested demo.',
    'The wafer is p-type silicon; no oxide, resist or metal is present.',
  ],
  [
    'Grow wet field oxide on both wafer faces.',
    'Orange oxide covers the wafer. Its thickness follows the oxidation recipe.',
  ],
  [
    'Spin-coat positive resist on the front and back.',
    'Purple resist protects the oxide. No openings exist yet.',
  ],
  [
    'Align Mask 1 and expose its two clear windows.',
    'The exposed resist becomes brighter; it has not been removed yet.',
  ],
  [
    'Develop the exposed positive resist.',
    'Two windows appear in the purple resist; oxide remains underneath.',
  ],
  [
    'Etch the exposed field oxide through those windows.',
    'The windows must reach silicon. Isotropic etching also undercuts the resist.',
  ],
  ['Strip the remaining resist.', 'Only patterned oxide and exposed silicon remain.'],
  [
    'Diffuse phosphorus into the open silicon windows.',
    'Two green n-type regions form. The center gap remains p-type.',
  ],
  [
    'Remove the phosphorus-containing glass described in the lecture.',
    'This cleanup is narrative-only; the computed geometry does not change.',
  ],
  [
    'Coat front-side resist for the gate-window mask.',
    'The front is protected; the backside is intentionally unprotected.',
  ],
  [
    'Align Mask 2 over the gap between source and drain, then expose.',
    'The clear gate window should span the future channel.',
  ],
  [
    'Develop the gate-window resist.',
    'The channel-region oxide becomes accessible to the etchant.',
  ],
  [
    'Etch the thick channel oxide and the unprotected backside oxide.',
    'A short etch leaves unwanted oxide under the future gate.',
  ],
  ['Strip the gate-window resist.', 'The channel surface is ready for dry oxidation.'],
  [
    'Grow the thin dry gate oxide.',
    'A thin orange layer insulates the future gate; check its numerical thickness.',
  ],
  [
    'Coat resist for contact patterning.',
    'The front oxide is protected until the source/drain openings develop.',
  ],
  [
    'Align Mask 3 inside both n-type regions and expose.',
    'Each contact window must land within its green diffusion footprint.',
  ],
  ['Develop the contact resist.', 'Two small windows expose oxide above source and drain.'],
  [
    'Etch the contact oxide; perform the explicitly added backside clear.',
    'Both front windows and the backside must reach silicon for metal contact.',
  ],
  ['Strip contact resist.', 'The contact holes remain; oxide elsewhere stays in place.'],
  [
    'Coat the front with lift-off resist.',
    'Resist is patterned before metal deposition in this course flow.',
  ],
  [
    'Align Mask 4 for three separated metal islands and expose.',
    'Source, gate and drain patterns must remain separated.',
  ],
  [
    'Develop the metal openings in the resist.',
    'The gate sits over oxide; source and drain overlap their contact holes.',
  ],
  [
    'Deposit aluminum on the front and backside.',
    'Gold metal covers resist and openings; it is not patterned yet.',
  ],
  [
    'Lift off the resist and the metal sitting on it.',
    'Three separate metal islands remain. Check that no bridge connects them.',
  ],
  [
    'Inspect all four terminal checks before experimenting.',
    'The tested recipe passes Source, Gate insulation, Drain and Substrate in this model.',
  ],
];
