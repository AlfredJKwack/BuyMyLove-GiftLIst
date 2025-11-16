import { useState, useCallback, useRef, useEffect } from 'react';
import { getItem, setItem } from '../utils/localStorageSafe';

const GLOBAL_DISMISSAL_KEY = 'tooltip-dismissed';

/**
 * Hook to manage tooltip visibility, dismissal, and focus behavior
 * @param {Object} toggleRef - Ref to the toggle element
 * @param {string} tooltipId - Unique ID for this tooltip
 * @param {boolean} canToggle - Whether the toggle is enabled
 * @param {boolean} itemBought - Whether the item is already bought
 * @returns {Object} { visible, showTooltip, hideTooltip, handleBlur }
 */
export function useTooltipVisibility(toggleRef, tooltipId, canToggle, itemBought) {
  const [visible, setVisible] = useState(false);
  const blurTimeoutRef = useRef(null);

  // Check if tooltip was previously dismissed globally
  const isTooltipDismissed = useCallback(() => {
    return getItem(GLOBAL_DISMISSAL_KEY) === 'true';
  }, []);

  // Show tooltip
  const showTooltip = useCallback((calculatePosition) => {
    if (isTooltipDismissed() || !canToggle) return;
    
    // Never show tooltip if item is already bought
    if (itemBought) return;
    
    // Double-check the input element's checked state
    if (toggleRef.current) {
      const input = toggleRef.current.querySelector('.toggle-input');
      if (input && input.checked) return;
    }
    
    // Notify other cards to close their tooltips
    window.dispatchEvent(new CustomEvent('tool-switch-open', { 
      detail: { tooltipId } 
    }));
    
    calculatePosition();
    setVisible(true);

    // Set aria-labelledby on the toggle input
    if (toggleRef.current) {
      const input = toggleRef.current.querySelector('.toggle-input');
      if (input) {
        input.setAttribute('aria-labelledby', tooltipId);
      }
    }
  }, [isTooltipDismissed, canToggle, itemBought, toggleRef, tooltipId]);

  // Hide tooltip and optionally mark as dismissed
  const hideTooltip = useCallback((markDismissed = false) => {
    setVisible(false);

    // Remove aria-labelledby
    if (toggleRef.current) {
      const input = toggleRef.current.querySelector('.toggle-input');
      if (input) {
        input.removeAttribute('aria-labelledby');
      }
    }

    if (markDismissed) {
      setItem(GLOBAL_DISMISSAL_KEY, 'true');
    }
  }, [toggleRef, tooltipId]);

  // Handle blur - close tooltip only if focus leaves both toggle and tooltip
  const handleBlur = useCallback(() => {
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Use a small delay to check where focus went
    blurTimeoutRef.current = setTimeout(() => {
      const activeElement = document.activeElement;
      const tooltipElement = document.getElementById(tooltipId);
      
      // Check if focus is on toggle or tooltip
      const focusOnToggle = toggleRef.current?.contains(activeElement);
      const focusOnTooltip = tooltipElement?.contains(activeElement);

      if (!focusOnToggle && !focusOnTooltip) {
        hideTooltip(false);
      }
    }, 10);
  }, [tooltipId, hideTooltip, toggleRef]);

  // Listen for other tooltips opening and close this one
  useEffect(() => {
    const handleOtherTooltipOpen = (event) => {
      // If another tooltip is opening (not this one), hide this tooltip without dismissing globally
      if (event.detail.tooltipId !== tooltipId && visible) {
        hideTooltip(false);
      }
    };

    window.addEventListener('tool-switch-open', handleOtherTooltipOpen);
    return () => {
      window.removeEventListener('tool-switch-open', handleOtherTooltipOpen);
    };
  }, [tooltipId, visible, hideTooltip]);

  // Close tooltip if item becomes bought while tooltip is visible
  useEffect(() => {
    if (visible && itemBought) {
      hideTooltip(false);
    }
  }, [itemBought, visible, hideTooltip]);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return { visible, showTooltip, hideTooltip, handleBlur };
}
