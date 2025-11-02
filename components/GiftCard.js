export default function GiftCard({ gift, onToggleBought, isAdmin, onEdit }) {
  const canToggle = isAdmin || gift.canToggle;
  
  const handleToggle = () => {
    if (!canToggle) {
      alert('This item has already been marked as bought by another user.');
      return;
    }
    onToggleBought(gift.id, !gift.bought);
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
            
            <label className={`toggle-switch ${canToggle ? 'opacity-100 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
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
    </div>
  );
}
