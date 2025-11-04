import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// Cache the confetti module import so it's only loaded once
let confettiImportPromise = null;

// Internal Tooltip component
function ToolSwitchTooltip({ targetRef, tooltipId, text, visible, onClose, placement, arrowOffset }) {
  const tooltipRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  if (!visible || typeof window === 'undefined') return null;

  return createPortal(
    <div
      ref={tooltipRef}
      id={tooltipId}
      role="tooltip"
      className="tool-switch-tooltip"
      tabIndex={0}
      style={{
        left: `${placement.left}px`,
        top: `${placement.top}px`,
      }}
    >
      <div
        className={`tool-switch-tooltip__arrow ${placement.arrowDirection === 'up' ? 'tool-switch-tooltip__arrow--up' : 'tool-switch-tooltip__arrow--down'}`}
        style={{ left: `${arrowOffset}px` }}
      />
      <span className="tool-switch-tooltip__text">{text}</span>
      <button
        className="tool-switch-tooltip__close"
        onClick={onClose}
        aria-label="Dismiss tooltip"
        type="button"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.7} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>,
    document.body
  );
}

export default function GiftCard({ gift, onToggleBought, isAdmin, onEdit }) {
  const canToggle = isAdmin || gift.canToggle;
  const toggleRef = useRef(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPlacement, setTooltipPlacement] = useState({ left: 0, top: 0, arrowDirection: 'up' });
  const [arrowOffset, setArrowOffset] = useState(0);
  const blurTimeoutRef = useRef(null);

  const tooltipId = `tool-switch-tooltip-${gift.id}`;
  const GLOBAL_DISMISSAL_KEY = 'tooltip-dismissed';

  // Check if tooltip was previously dismissed globally (localStorage)
  const isTooltipDismissed = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(GLOBAL_DISMISSAL_KEY) === 'true';
  };

  // Calculate tooltip position with collision detection
  const calculatePosition = useCallback(() => {
    if (!toggleRef.current) return;

    const toggleRect = toggleRef.current.getBoundingClientRect();
    const tooltipWidth = 140; // Approximate width
    const tooltipHeight = 48; // Approximate height
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

    setTooltipPlacement({ left, top, arrowDirection });
    setArrowOffset(constrainedArrowLeft);
  }, []);

  // Show tooltip
  const showTooltip = useCallback(() => {
    if (isTooltipDismissed() || !canToggle) return;
    
    // Never show tooltip if toggle is already checked
    if (gift.bought) return;
    
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
    setTooltipVisible(true);

    // Set aria-labelledby on the toggle input
    if (toggleRef.current) {
      const input = toggleRef.current.querySelector('.toggle-input');
      if (input) {
        input.setAttribute('aria-labelledby', tooltipId);
      }
    }
  }, [calculatePosition, tooltipId, canToggle, gift.bought]);

  // Hide tooltip and mark as dismissed
  const hideTooltip = useCallback((markDismissed = false) => {
    setTooltipVisible(false);

    // Remove aria-labelledby
    if (toggleRef.current) {
      const input = toggleRef.current.querySelector('.toggle-input');
      if (input) {
        input.removeAttribute('aria-labelledby');
      }
    }

    if (markDismissed && typeof window !== 'undefined') {
      localStorage.setItem(GLOBAL_DISMISSAL_KEY, 'true');
    }
  }, [tooltipId, GLOBAL_DISMISSAL_KEY]);

  // Handle blur - close tooltip only if focus leaves both toggle and tooltip
  const handleBlur = useCallback((e) => {
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
  }, [tooltipId, hideTooltip]);

  // Reposition on window resize/scroll
  useEffect(() => {
    if (!tooltipVisible) return;

    const handleReposition = () => calculatePosition();
    
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [tooltipVisible, calculatePosition]);

  // Listen for other tooltips opening and close this one
  useEffect(() => {
    const handleOtherTooltipOpen = (event) => {
      // If another tooltip is opening (not this one), hide this tooltip without dismissing globally
      if (event.detail.tooltipId !== tooltipId && tooltipVisible) {
        hideTooltip(false);
      }
    };

    window.addEventListener('tool-switch-open', handleOtherTooltipOpen);
    return () => {
      window.removeEventListener('tool-switch-open', handleOtherTooltipOpen);
    };
  }, [tooltipId, tooltipVisible, hideTooltip]);

  // Close tooltip if gift becomes bought while tooltip is visible
  useEffect(() => {
    if (tooltipVisible && gift.bought) {
      hideTooltip(false);
    }
  }, [gift.bought, tooltipVisible, hideTooltip]);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleToggle = () => {
    if (!canToggle) {
      alert('This item has already been marked as bought by another user.');
      return;
    }
    
    // Calculate the new state (true if marking as bought)
    const newState = !gift.bought;
    
    // Hide and dismiss tooltip when toggle is clicked
    hideTooltip(true);
    onToggleBought(gift.id, newState);
    
    // Fire confetti only when marking as bought (not when unmarking)
    if (newState) {
      // Lazy-load confetti module (cached after first load)
      if (!confettiImportPromise) {
        confettiImportPromise = import('./confetti');
      }
      confettiImportPromise
        .then((mod) => {
          // Fire confetti centered on the toggle element
          mod.fireConfettiAt(toggleRef.current, 25, 1);
        })
        .catch((err) => {
          // Swallow import errors so UX isn't impacted
          console.error('Failed to load confetti', err);
        });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`gift-card ${gift.bought ? 'is-bought' : ''}`}>
      {gift.bought && (
        <span className="gift-ribbon gift-ribbon--tr">Already bought</span>
      )}
      <div className="gift-card-image">
        <div className="image-container">
          {gift.imageUrl ? (
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="gift-image"
            />
          ) : (
            <div className="image-placeholder">
              <svg
                className="image-placeholder-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12v10H4V12M2 7h20v5H2zM12 22V7m0 0H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zm0 0h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="gift-card-content">
        <div className="gift-title">
          {gift.url ? (
            <h3>
              <a href={gift.url} target="_blank" rel="noopener noreferrer">
                {gift.title}
              </a>
            </h3>
          ) : (
            <h3>{gift.title}</h3>
          )}
        </div>

        {gift.note && (
          <p className="gift-description">{gift.note}</p>
        )}

        <div className="gift-footer">
          <span className="gift-date">
            Added {formatDate(gift.createdAt)}
          </span>

          <div className="flex gap-2 items-center">
            {isAdmin && (
              <button
                onClick={() => onEdit(gift)}
                className="text-sm bg-gray-500 text-white rounded-sm cursor-pointer"
                style={{ padding: '0.25rem 0.75rem', border: 'none' }}
              >
                Edit
              </button>
            )}
            
            <label 
              ref={toggleRef}
              style={{ position: 'relative' }}
              className={`toggle-switch ${canToggle ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
              onMouseOver={showTooltip}
              onFocus={showTooltip}
              onBlur={handleBlur}
            >
              <input
                type="checkbox"
                className="toggle-input"
                checked={gift.bought}
                onChange={handleToggle}
                disabled={!canToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <ToolSwitchTooltip
        targetRef={toggleRef}
        tooltipId={tooltipId}
        text="Mark as bought"
        visible={tooltipVisible}
        onClose={() => hideTooltip(true)}
        placement={tooltipPlacement}
        arrowOffset={arrowOffset}
      />
    </div>
  );
}
