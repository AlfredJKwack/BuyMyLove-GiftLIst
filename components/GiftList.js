import GiftCard from './GiftCard';

export default function GiftList({ gifts, onToggleBought, isAdmin, onEditGift }) {
  if (gifts.length === 0) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500 text-lg">
          No gifts yet. {isAdmin && 'Click "Add Gift" to create your first gift!'}
        </p>
      </div>
    );
  }

  return (
    <div className="gift-grid">
      {gifts.map((gift) => (
        <GiftCard
          key={gift.id}
          gift={gift}
          onToggleBought={onToggleBought}
          isAdmin={isAdmin}
          onEdit={onEditGift}
        />
      ))}
    </div>
  );
}
