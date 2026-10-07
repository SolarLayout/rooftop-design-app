// The hand inside a clip (the boards "In-App Help · Clips"): a dot drawn into the page where the pointer is, white, the
// accent while it presses; headless shows no pointer of its own. Added by the recording only, never by the app.
export const DRAW_THE_POINTER = `(() => {
  const dot = document.createElement('div');
  Object.assign(dot.style, { position: 'fixed', left: '-40px', top: '-40px', width: '18px', height: '18px', marginLeft: '-9px', marginTop: '-9px',
    borderRadius: '50%', background: 'rgba(255,255,255,0.92)', boxShadow: '0 0 0 2px rgba(5,7,10,0.8), 0 2px 6px rgba(0,0,0,0.5)',
    pointerEvents: 'none', zIndex: '2147483647' });
  document.body.appendChild(dot);
  addEventListener('pointermove', (e) => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; }, true);
  addEventListener('pointerdown', () => { dot.style.transform = 'scale(0.75)'; dot.style.background = 'rgba(255,176,32,0.95)'; }, true);
  addEventListener('pointerup', () => { dot.style.transform = 'scale(1)'; dot.style.background = 'rgba(255,255,255,0.92)'; }, true);
})();`;
