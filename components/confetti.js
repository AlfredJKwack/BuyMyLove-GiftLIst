/**
 * Client-only confetti animation module
 * Fires confetti pieces around a target element when a gift is marked as bought
 * 
 * Original code from George Hastings' codepen
 * at https://codepen.io/georgehastings/pen/bpegEL
 */

function ran(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function fireConfettiAt(element, amount = 25, size = 1) {
  // Ensure we're in browser context
  if (typeof window === 'undefined' || !element) return;

  // Ensure element has non-static positioning so absolute pieces align correctly
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.position === 'static') {
    element.style.position = 'relative';
  }

  const colors = ['#FF8E70', '#C76DFC', '#4192F6', '#77DDA8', '#F8E71C'];

  function newPiece() {
    const piece = document.createElement('div');
    piece.style.width = '4px';
    piece.style.height = '6px';
    piece.style.position = 'absolute';
    piece.style.left = '0';
    piece.style.right = '0';
    piece.style.margin = '0 auto';
    piece.style.opacity = '0';
    piece.style.pointerEvents = 'none';
    piece.style.backgroundColor = colors[ran(0, 4)];
    return piece;
  }

  function renderPiece() {
    const piece = newPiece();
    let degs = 0;
    let x = 0;
    let y = 0;
    let opacity = 0;
    let count = 0;
    let xfactor;
    const yfactor = ran(10, 40) * (1 + size / 10);

    if (ran(0, 1) === 1) {
      xfactor = ran(5, 40) * (1 + size / 10);
      piece.style.left = '-30px';
    } else {
      xfactor = ran(-5, -40) * (1 + size / 10);
      piece.style.left = '30px';
    }

    let start = null;
    element.appendChild(piece);

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;

      if (progress < 2000) {
        window.requestAnimationFrame(animate);
      } else {
        // Clean up: remove piece after animation completes
        if (element.contains(piece)) {
          element.removeChild(piece);
        }
      }

      piece.style.opacity = opacity;
      piece.style.webkitTransform = `translate3d(${Math.cos(Math.PI / 36 * x) * xfactor}px, ${Math.cos(Math.PI / 18 * y) * yfactor}px, 0) rotateZ(${degs}deg) rotateY(${degs}deg)`;
      piece.style.transform = `translate3d(${Math.cos(Math.PI / 36 * x) * xfactor}px, ${Math.cos(Math.PI / 18 * y) * yfactor}px, 0) rotateZ(${degs}deg) rotateY(${degs}deg)`;
      
      degs += 15;
      x += 0.5;
      y += 0.5;

      if (count > 25) {
        opacity -= 0.1;
      } else {
        opacity += 0.1;
      }
      count++;
    };

    window.requestAnimationFrame(animate);
  }

  // Launch confetti pieces with slight delays
  let count = 0;
  const launch = setInterval(() => {
    if (count < amount) {
      renderPiece();
      count++;
    } else {
      clearInterval(launch);
    }
  }, 32);
}
