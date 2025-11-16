import { useState, useCallback, useEffect } from 'react';

/**
 * Hook to calculate and manage tooltip position with collision detection
 * @param {Object} toggleRef - Ref to the toggle element
 * @param {boolean} visible - Whether the tooltip is visible
 * @param {Object} dimensions - Approximate tooltip dimensions { width, height }
 * @returns {Object} { placement, arrowOffset, calculatePosition }
 */
export function useTooltipPosition(toggleRef, visible, dimensions = { width: 140, height: 48 }) {
  const [placement, setPlacement] = useState({ left: 0, top: 0, arrowDirection: 'up' });
  const [arrowOffset, setArrowOffset] = useState(0);

  const calculatePosition = useCallback(() => {
    if (!toggleRef.current) return;

    const toggleRect = toggleRef.current.getBoundingClientRect();
    const { width: tooltipWidth, height: tooltipHeight } = dimensions;
    const arrowSize = 8;
    const margin = 12;

    // Calculate horizontal center position
    const toggleCenterX = toggleRect.left + toggleRect.width / 2;
    let left = toggleCenterX - tooltipWidth / 2;

    // Horizontal collision detection
    const viewportWidth = window.innerWidth;
    const minLeft = 6;
    const maxLeft = viewportWidth - tooltipWidth - 6;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    // Calculate arrow offset relative to tooltip
    const arrowLeft = toggleCenterX - left;
    const constrainedArrowLeft = Math.max(12, Math.min(arrowLeft, tooltipWidth - 12));

    // Vertical collision detection - determine if tooltip should be above or below
    const spaceBelow = window.innerHeight - toggleRect.bottom;
    const spaceAbove = toggleRect.top;
    const placeBelow = spaceBelow >= tooltipHeight + margin || spaceBelow > spaceAbove;

    let top;
    let arrowDirection;

    if (placeBelow) {
      // Place below toggle
      top = toggleRect.bottom + margin;
      arrowDirection = 'up';
    } else {
      // Place above toggle
      top = toggleRect.top - tooltipHeight - margin;
      arrowDirection = 'down';
    }

    setPlacement({ left, top, arrowDirection });
    setArrowOffset(constrainedArrowLeft);
  }, [toggleRef, dimensions]);

  // Reposition on window resize/scroll
  useEffect(() => {
    if (!visible) return;

    const handleReposition = () => calculatePosition();
    
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [visible, calculatePosition]);

  return { placement, arrowOffset, calculatePosition };
}
