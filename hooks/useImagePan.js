import { useEffect } from 'react';

/**
 * Hook to enable mouse-tracking panning effect for zoomed images (desktop only)
 * @param {Object} imageRef - Ref to the image element
 * @param {Object} focalPoint - Focal point { x, y } for fallback transform-origin
 */
export function useImagePan(imageRef, focalPoint) {
  useEffect(() => {
    const img = imageRef.current;
    const container = img?.closest('.image-container') || img?.parentElement;
    if (!img || !container) return;

    // Only enable on larger screens
    if (typeof window === 'undefined' || window.innerWidth <= 500) return;

    let active = false;
    const scale = 1.7;
    const fallbackFocalX = (focalPoint?.x ?? 0.5) * 100;
    const fallbackFocalY = (focalPoint?.y ?? 0.5) * 100;

    const toPercent = (value) => Math.max(0, Math.min(100, value * 100));

    const setOriginFromEvent = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX !== undefined ? (e.clientX - rect.left) / rect.width : 0.5;
      const y = e.clientY !== undefined ? (e.clientY - rect.top) / rect.height : 0.5;
      const xp = toPercent(x);
      const yp = toPercent(y);
      img.style.transformOrigin = `${xp}% ${yp}%`;
      return { xp, yp };
    };

    const handleEnter = (e) => {
      if (window.innerWidth <= 500) return;
      active = true;
      setOriginFromEvent(e); // set origin to pointer pos
      img.style.transform = `scale(${scale})`;
    };

    const handleMove = (e) => {
      if (!active) return;
      setOriginFromEvent(e);
    };

    const handleLeave = () => {
      if (!active) return;
      active = false;
      // Keep current transform-origin so shrink is animated from last mouse pos
      img.style.transform = 'scale(1)';

      // After the transition completes, restore transform-origin to the stored focal point
      const onTransitionEnd = (ev) => {
        if (ev.propertyName !== 'transform') return;
        img.style.transformOrigin = `${fallbackFocalX}% ${fallbackFocalY}%`;
        img.removeEventListener('transitionend', onTransitionEnd);
      };
      img.addEventListener('transitionend', onTransitionEnd);
    };

    container.addEventListener('mouseenter', handleEnter);
    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseleave', handleLeave);

    return () => {
      container.removeEventListener('mouseenter', handleEnter);
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', handleLeave);
      img.style.transform = ''; // restore
      img.style.transformOrigin = ''; // restore (CSS via inline style removed)
      img.style.transition = ''; // restore
    };
  }, [imageRef, focalPoint]);
}
