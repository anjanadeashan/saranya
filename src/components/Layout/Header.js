import React, { useState } from 'react';
import { FaBars, FaUser, FaSignOutAlt, FaBell, FaCog, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // Header styles
  const headerStyles = {
    // Main header container
    header: {
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      zIndex: 999,
      height: '80px',
    },

    // Left section
    leftSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },

    // Sidebar toggle button
    toggleButton: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      padding: '12px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
    },

    // Brand section
    brand: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: 'white',
    },

    brandIcon: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '800',
      fontSize: '16px',
      color: 'white',
      boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
    },

    brandText: {
      fontSize: '20px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },

    // Right section
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },

    // Search bar
    searchContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },

    searchInput: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '24px',
      padding: '10px 16px 10px 40px',
      color: 'white',
      fontSize: '14px',
      width: '280px',
      outline: 'none',
      transition: 'all 0.3s ease',
    },

    searchIcon: {
      position: 'absolute',
      left: '14px',
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '14px',
      pointerEvents: 'none',
    },

    // Navigation items
    navItem: {
      position: 'relative',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      padding: '10px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    navIcon: {
      color: 'white',
      fontSize: '16px',
      transition: 'all 0.3s ease',
    },

    // Notification badge
    notificationBadge: {
      position: 'absolute',
      top: '-6px',
      right: '-6px',
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '600',
      color: 'white',
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
    },

    // User section
    userSection: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      padding: '8px 16px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },

    userAvatar: {
      width: '36px',
      height: '36px',
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '14px',
      boxShadow: '0 3px 12px rgba(59, 130, 246, 0.3)',
    },

    userInfo: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },

    userName: {
      color: 'white',
      fontSize: '14px',
      fontWeight: '600',
      lineHeight: '1.2',
    },

    userRole: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '12px',
      lineHeight: '1.2',
    },

    // Dropdown menu
    dropdown: {
      position: 'absolute',
      top: '100%',
      right: '0',
      marginTop: '8px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '8px 0',
      minWidth: '280px',
      zIndex: 1000,
    },

    dropdownHeader: {
      padding: '16px 20px',
      background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
      margin: '0 8px 8px 8px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },

    dropdownItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 20px',
      color: '#374151',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontWeight: '500',
    },

    dropdownIcon: {
      fontSize: '16px',
      width: '20px',
      textAlign: 'center',
    },
  };

  // Hover states
  const [hoveredItem, setHoveredItem] = useState(null);

  const getNavItemStyle = (itemName) => ({
    ...headerStyles.navItem,
    background: hoveredItem === itemName 
      ? 'rgba(255, 255, 255, 0.2)' 
      : 'rgba(255, 255, 255, 0.1)',
    transform: hoveredItem === itemName ? 'translateY(-2px)' : 'translateY(0)',
  });

  const getDropdownItemStyle = (itemName) => ({
    ...headerStyles.dropdownItem,
    background: hoveredItem === itemName 
      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' 
      : 'transparent',
    color: hoveredItem === itemName ? 'white' : '#374151',
    transform: hoveredItem === itemName ? 'translateX(4px)' : 'translateX(0)',
  });

  return (
    <header style={headerStyles.header}>
      {/* Left Section */}
      <div style={headerStyles.leftSection}>
        {/* Sidebar Toggle */}
        <button
          style={{
            ...headerStyles.toggleButton,
            background: hoveredItem === 'toggle' 
              ? 'rgba(255, 255, 255, 0.25)' 
              : 'rgba(255, 255, 255, 0.15)',
          }}
          onClick={toggleSidebar}
          onMouseEnter={() => setHoveredItem('toggle')}
          onMouseLeave={() => setHoveredItem(null)}
          aria-label="Toggle Sidebar"
        >
          <FaBars />
        </button>

        {/* Brand */}
        <div style={headerStyles.brand}>
          <div style={headerStyles.brandIcon}>
            IMS
          </div>
          <span style={headerStyles.brandText}>
            Inventory Management System
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div style={headerStyles.rightSection}>
        {/* Search Bar */}
        <div style={headerStyles.searchContainer}>
          <FaSearch style={headerStyles.searchIcon} />
          <input
            type="text"
            placeholder="Search products, customers..."
            style={{
              ...headerStyles.searchInput,
              background: hoveredItem === 'search' 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(255, 255, 255, 0.15)',
            }}
            onFocus={() => setHoveredItem('search')}
            onBlur={() => setHoveredItem(null)}
          />
        </div>

        {/* Notifications */}
        <div
          style={getNavItemStyle('notifications')}
          onMouseEnter={() => setHoveredItem('notifications')}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <FaBell style={headerStyles.navIcon} />
          <div style={headerStyles.notificationBadge}>3</div>
        </div>

        {/* Settings */}
        <div
          style={getNavItemStyle('settings')}
          onMouseEnter={() => setHoveredItem('settings')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <FaCog style={headerStyles.navIcon} />
        </div>

        {/* User Section */}
        <div
          style={{
            ...headerStyles.userSection,
            background: hoveredItem === 'user' || showDropdown
              ? 'rgba(255, 255, 255, 0.25)'
              : 'rgba(255, 255, 255, 0.15)',
          }}
          onMouseEnter={() => setHoveredItem('user')}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div style={headerStyles.userAvatar}>
            <FaUser />
          </div>
          <div style={headerStyles.userInfo}>
            <div style={headerStyles.userName}>
              {user?.username || 'Admin'}
            </div>
            <div style={headerStyles.userRole}>
              Administrator
            </div>
          </div>

          {/* User Dropdown */}
          {showDropdown && (
            <div style={headerStyles.dropdown}>
              {/* Dropdown Header */}
              <div style={headerStyles.dropdownHeader}>
                <div style={{
                  ...headerStyles.userAvatar,
                  width: '48px',
                  height: '48px',
                  fontSize: '18px',
                }}>
                  <FaUser />
                </div>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '2px',
                  }}>
                    {user?.username || 'Admin'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280',
                  }}>
                    admin@inventory.com
                  </div>
                </div>
              </div>

              {/* Dropdown Items */}
              <div
                style={getDropdownItemStyle('profile')}
                onMouseEnter={() => setHoveredItem('profile')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FaUser style={headerStyles.dropdownIcon} />
                Profile Settings
              </div>

              <div
                style={getDropdownItemStyle('preferences')}
                onMouseEnter={() => setHoveredItem('preferences')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FaCog style={headerStyles.dropdownIcon} />
                Preferences
              </div>

              {/* Divider */}
              <hr style={{
                margin: '8px 20px',
                border: 'none',
                borderTop: '1px solid rgba(0, 0, 0, 0.1)',
              }} />

              {/* Logout */}
              <div
                style={{
                  ...getDropdownItemStyle('logout'),
                  background: hoveredItem === 'logout' 
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                    : 'transparent',
                }}
                onMouseEnter={() => setHoveredItem('logout')}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={handleLogout}
              >
                <FaSignOutAlt style={headerStyles.dropdownIcon} />
                Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 998,
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </header>
  );
};

export default Header;