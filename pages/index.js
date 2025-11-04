import { useEffect, useState } from 'react';
import Head from 'next/head';
import GiftList from '../components/GiftList';
import AuthModal from '../components/AuthModal';
import GiftFormModal from '../components/GiftFormModal';

export default function Home() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGiftFormModal, setShowGiftFormModal] = useState(false);
  const [editingGift, setEditingGift] = useState(null);

  // Check admin status on mount
  useEffect(() => {
    checkAdminStatus();
    fetchGifts();

    // Check for login success/error in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
      checkAdminStatus();
      window.history.replaceState({}, '', '/');
    }
    if (params.get('error')) {
      alert('Login failed. Please try again.');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchGifts = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await fetch('/api/gifts');
      const data = await response.json();
      setGifts(data);
    } catch (error) {
      console.error('Error fetching gifts:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleToggleBought = async (giftId, bought) => {
    // Optimistic update: immediately update UI
    let previousGifts;
    setGifts((prev) => {
      previousGifts = prev;
      return prev.map((g) => (g.id === giftId ? { ...g, bought } : g));
    });

    try {
      const response = await fetch('/api/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ giftId, bought }),
      });

      const data = await response.json();

      if (response.ok) {
        // Apply authoritative server response fields
        setGifts((prev) =>
          prev.map((g) =>
            g.id === giftId
              ? {
                  ...g,
                  ...('bought' in data ? { bought: data.bought } : {}),
                  ...(data.boughtBy ? { boughtBy: data.boughtBy } : {}),
                }
              : g
          )
        );

        // Silent re-sync to pick up other users' changes without showing spinner
        await fetchGifts(false);
      } else if (response.status === 403) {
        // Permission denied: revert optimistic update
        setGifts(previousGifts);
        alert(data.error || 'You do not have permission to change this item.');
        // Re-sync to ensure canonical state
        await fetchGifts(false);
      } else {
        // Unexpected error: revert optimistic update
        setGifts(previousGifts);
        console.error('Toggle failed:', response.status, data);
        alert('Failed to update gift status. Please try again.');
        await fetchGifts(false);
      }
    } catch (error) {
      // Network error: revert optimistic update
      setGifts(previousGifts);
      console.error('Error toggling bought status:', error);
      alert('Network error. Please check your connection and try again.');
      await fetchGifts(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAdmin(false);
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleAddGift = () => {
    setEditingGift(null);
    setShowGiftFormModal(true);
  };

  const handleEditGift = (gift) => {
    setEditingGift(gift);
    setShowGiftFormModal(true);
  };

  const handleGiftSaved = () => {
    setShowGiftFormModal(false);
    setEditingGift(null);
    fetchGifts();
  };

  return (
    <>
      <Head>
        <title>Gift List App</title>
      </Head>

      <div className="app-layout">
        <main className="main-content-wrapper">
          <div className="main-content container">
            <div className="flex justify-between items-center mb-8">
              <h1 className="m-0">Gift List</h1>
              <div>
                {isAdmin ? (
                  <div className="flex gap-4 items-center">
                    <button 
                      onClick={handleAddGift}
                      className="form-button"
                      style={{ width: 'auto', padding: '0.5rem 1rem' }}
                    >
                      Add Gift
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="form-button bg-gray-500"
                      style={{ width: 'auto', padding: '0.5rem 1rem' }}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="form-button"
                    style={{ width: 'auto', padding: '0.5rem 1rem' }}
                  >
                    Admin Login
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center p-8">
                <div className="loading-spinner mx-auto"></div>
                <p>Loading gifts...</p>
              </div>
            ) : (
              <GiftList 
                gifts={gifts} 
                onToggleBought={handleToggleBought}
                isAdmin={isAdmin}
                onEditGift={handleEditGift}
              />
            )}
          </div>
        </main>

        <footer>
          <div className="container">
            <div className="footer-content">
              <div className="footer-text">
                &copy; 2025 BuyMyLove v0.3.3
              </div>
              <div className="footer-links">
                <a href="https://github.com/AlfredJKwack/BuyMyLove-GiftLIst" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3em' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle' }}>
                    <path fill="#888" d="M12 2C6.48 2 2 6.58 2 12.26c0 4.48 2.87 8.28 6.84 9.63.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.36 9.36 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.58.69.48C19.13 20.54 22 16.74 22 12.26 22 6.58 17.52 2 12 2Z"/>
                  </svg>
                  <span style={{ color: '#888' }}>Source Code</span>
                </a>
              </div>
            </div>
          </div>
        </footer>

        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}

        {showGiftFormModal && (
          <GiftFormModal 
            gift={editingGift}
            onClose={() => {
              setShowGiftFormModal(false);
              setEditingGift(null);
            }}
            onSaved={handleGiftSaved}
          />
        )}
      </div>
    </>
  );
}
