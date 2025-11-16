import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Tooltip component that renders in a portal with keyboard handling
 * @param {Object} targetRef - Ref to the target element (for accessibility)
 * @param {string} tooltipId - Unique ID for this tooltip
 * @param {string} text - Text to display in the tooltip
 * @param {boolean} visible - Whether the tooltip is visible
 * @param {Function} onClose - Callback when tooltip should close
 * @param {Object} placement - Position { left, top, arrowDirection }
 * @param {number} arrowOffset - Horizontal offset for the arrow
 */
export default function ToolSwitchTooltip({ 
  targetRef, 
  tooltipId, 
  text, 
  visible, 
  onClose, 
  placement, 
  arrowOffset 
}) {
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
