import { useRef } from 'react';
import ToolSwitchTooltip from './ToolSwitchTooltip';
import { useTooltipPosition } from '../hooks/useTooltipPosition';
import { useTooltipVisibility } from '../hooks/useTooltipVisibility';
import { useSmartCropFocalPoint } from '../hooks/useSmartCropFocalPoint';
import { useImagePan } from '../hooks/useImagePan';
import { fireConfettiAt } from './confetti';

export default function GiftCard({ gift, onToggleBought, isAdmin, onEdit }) {
  const canToggle = isAdmin || gift.canToggle;
  const boughtByMe = gift.bought && gift.canToggle;
  const toggleRef = useRef(null);
  const imageRef = useRef(null);
  const cardRef = useRef(null);

  const tooltipId = `tool-switch-tooltip-${gift.id}`;

  // Tooltip positioning
  const { placement, arrowOffset, calculatePosition } = useTooltipPosition(toggleRef, true);

  // Tooltip visibility and behavior
  const { visible, showTooltip, hideTooltip, handleBlur } = useTooltipVisibility(
    toggleRef,
    tooltipId,
    canToggle,
    gift.bought
  );

  // Smart crop focal point detection
  const focalPoint = useSmartCropFocalPoint(
    imageRef,
    cardRef,
    gift.imageUrl,
    gift.imageFocalX,
    gift.imageFocalY
  );

  // Image pan effect
  useImagePan(imageRef, focalPoint);

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
      // Fire confetti centered on the toggle element
      fireConfettiAt(toggleRef.current, 25, 1);
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
    <div 
      ref={cardRef}
      className={`gift-card ${gift.bought ? 'is-bought' : ''}`}
      style={
        focalPoint && gift.imageUrl
          ? {
              '--focal-x': `${focalPoint.x * 100}%`,
              '--focal-y': `${focalPoint.y * 100}%`,
            }
          : undefined
      }
    >
      {gift.bought && (
        <span className={`gift-ribbon gift-ribbon--tr ${boughtByMe ? 'gift-ribbon--owner' : 'gift-ribbon--other'}`}>
          {boughtByMe ? '✨ Thank you ✨' : 'Already bought'}
        </span>
      )}
      <div className="gift-card-image">
        <div className="image-container">
          {gift.imageUrl ? (
            <img
              ref={imageRef}
              src={gift.imageUrl}
              alt={gift.title}
              className="gift-image"
              crossOrigin="anonymous"
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
              onMouseOver={() => showTooltip(calculatePosition)}
              onFocus={() => showTooltip(calculatePosition)}
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
        visible={visible}
        onClose={() => hideTooltip(true)}
        placement={placement}
        arrowOffset={arrowOffset}
      />
    </div>
  );
}
