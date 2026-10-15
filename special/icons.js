// Small code-drawn previews of the same finite catalogue rendered in the ring.
export function modelIcon(id){
  const shapes={
    sphere:'<circle cx="40" cy="40" r="25" fill="currentColor"/><path d="M27 23q-12 9-10 20"/>',
    egg:'<path fill="currentColor" d="M40 9C25 9 17 39 19 50c2 26 40 26 42 0C63 39 55 9 40 9Z"/><path d="M32 22q-9 12-9 23"/>',
    torus:'<ellipse cx="40" cy="40" rx="25" ry="24" fill="none" stroke="currentColor" stroke-width="15"/><path d="M22 21q16-12 32 0"/>',
    ovalTorus:'<ellipse cx="40" cy="40" rx="27" ry="18" fill="none" stroke="currentColor" stroke-width="13"/><path d="M20 24q20-11 38 1"/>',
    circle:'<circle cx="40" cy="40" r="25" fill="none" stroke="currentColor" stroke-width="3"/>',
    ellipse:'<ellipse cx="40" cy="40" rx="31" ry="19" fill="none" stroke="currentColor" stroke-width="3"/>',
    segment:'<path d="M12 50 68 30" stroke="currentColor" stroke-width="3"/><circle cx="12" cy="50" r="4" fill="currentColor"/><circle cx="68" cy="30" r="4" fill="currentColor"/>',
    arc:'<path d="M12 52Q40 4 68 52" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="12" cy="52" r="4" fill="currentColor"/><circle cx="68" cy="52" r="4" fill="currentColor"/>'
  };
  return `<svg viewBox="0 0 80 80" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g stroke="#ffffff75" stroke-width="2" stroke-linecap="round">${shapes[id]||''}</g></svg>`;
}
