import React, { useState, useEffect } from 'react';
import { FaBars, FaUser, FaChevronDown, FaCog, FaShieldAlt, FaChartLine, FaDatabase, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Logout handler
  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  // Enhanced admin features
  const adminFeatures = [
    { icon: FaUser, title: 'User Management', desc: 'Manage system users' },
    { icon: FaDatabase, title: 'Database Settings', desc: 'Configure database' },
    { icon: FaChartLine, title: 'System Analytics', desc: 'View system stats' },
    { icon: FaShieldAlt, title: 'Security Center', desc: 'Security settings' }
  ];

  // Header styles with orange theme
  const headerStyles = {
    header: {
      background: isScrolled 
        ? 'linear-gradient(135deg, rgba(255, 140, 0, 0.98) 0%, rgba(255, 165, 0, 0.98) 50%, rgba(255, 69, 0, 0.98) 100%)'
        : 'linear-gradient(135deg, rgba(255, 140, 0, 0.95) 0%, rgba(255, 165, 0, 0.95) 50%, rgba(255, 69, 0, 0.95) 100%)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: isScrolled 
        ? '0 8px 32px rgba(255, 140, 0, 0.3)'
        : '0 4px 20px rgba(255, 140, 0, 0.2)',
      padding: isMobile ? '12px 16px' : '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      height: isMobile ? '70px' : '85px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },

    leftSection: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '12px' : '24px',
      flex: 1,
    },

    toggleButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '15px',
      padding: isMobile ? '10px' : '14px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: isMobile ? '14px' : '18px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    },

    toggleButtonHover: {
      background: 'rgba(255, 255, 255, 0.35)',
      transform: 'translateY(-2px) scale(1.05)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },

    brand: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '8px' : '16px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },

    brandIcon: {
      width: isMobile ? '35px' : '48px',
      height: isMobile ? '35px' : '48px',
      background: 'linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.9) 100%)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '900',
      fontSize: isMobile ? '12px' : '16px',
      color: '#ff8c00',
      boxShadow: '0 6px 20px rgba(255, 255, 255, 0.3)',
      transition: 'all 0.3s ease',
    },

    brandText: {
      fontSize: isMobile ? '16px' : '24px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      display: isMobile ? 'none' : 'block',
    },

    brandSubtext: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '500',
      display: isMobile ? 'none' : 'block',
    },

    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '8px' : '16px',
    },

    // Enhanced Admin Section
    adminSection: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '8px' : '12px',
      background: showDropdown || hoveredItem === 'admin'
        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%)',
      borderRadius: '20px',
      padding: isMobile ? '8px 12px' : '12px 20px',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      transform: hoveredItem === 'admin' ? 'translateY(-2px)' : 'translateY(0)',
    },

    adminAvatar: {
      width: isMobile ? '32px' : '42px',
      height: isMobile ? '32px' : '42px',
      background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ff8c00',
      fontSize: isMobile ? '12px' : '16px',
      fontWeight: 'bold',
      boxShadow: '0 4px 15px rgba(255, 255, 255, 0.3)',
      transition: 'all 0.3s ease',
      border: '2px solid rgba(255, 255, 255, 0.5)',
    },

    adminInfo: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },

    adminName: {
      color: 'white',
      fontSize: isMobile ? '12px' : '15px',
      fontWeight: '700',
      lineHeight: '1.2',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    },

    adminRole: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: isMobile ? '10px' : '12px',
      lineHeight: '1.2',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },

    chevronIcon: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '12px',
      transition: 'all 0.3s ease',
      transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
    },

    // Enhanced Dropdown
    dropdown: {
      position: 'absolute',
      top: '100%',
      right: '0',
      marginTop: '12px',
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(25px)',
      borderRadius: '20px',
      boxShadow: '0 25px 70px rgba(255, 140, 0, 0.25)',
      border: '1px solid rgba(255, 140, 0, 0.2)',
      padding: '0',
      minWidth: isMobile ? '280px' : '350px',
      zIndex: 1001,
      overflow: 'hidden',
      animation: 'dropdownSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },

    dropdownHeader: {
      padding: '24px',
      background: 'linear-gradient(135deg, #ff8c00 0%, #ffa500 50%, #ff4500 100%)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      color: 'white',
    },

    dropdownHeaderAvatar: {
      width: '60px',
      height: '60px',
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      color: '#ff8c00',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    },

    adminFeaturesGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      padding: '20px',
      background: 'rgba(255, 140, 0, 0.05)',
    },

    featureCard: {
      background: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '12px',
      padding: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(255, 140, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      textAlign: 'center',
    },

    featureCardHover: {
      background: 'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(255, 140, 0, 0.3)',
      color: 'white',
    },

    featureIcon: {
      fontSize: '20px',
      color: '#ff8c00',
      transition: 'all 0.3s ease',
    },

    featureIconHover: {
      color: 'white',
      transform: 'scale(1.1)',
    },

    featureTitle: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#333',
      transition: 'all 0.3s ease',
    },

    featureTitleHover: {
      color: 'white',
    },

    featureDesc: {
      fontSize: '10px',
      color: '#666',
      transition: 'all 0.3s ease',
    },

    featureDescHover: {
      color: 'rgba(255, 255, 255, 0.9)',
    },

    dropdownDivider: {
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(255, 140, 0, 0.3), transparent)',
      margin: '0 20px',
    },

    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 24px',
      color: '#dc2626',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontWeight: '600',
      margin: '8px 0',
    },

    logoutButtonHover: {
      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      color: 'white',
    },

    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
      background: 'rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(2px)',
    },
  };

  // Inline keyframes for animation
  const dropdownAnimation = `
    @keyframes dropdownSlide {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;

  return (
    <>
      <style>{dropdownAnimation}</style>
      <header style={headerStyles.header}>
        {/* Left Section */}
        <div style={headerStyles.leftSection}>
          {/* Sidebar Toggle */}
          <button
            style={hoveredItem === 'toggle' ? {...headerStyles.toggleButton, ...headerStyles.toggleButtonHover} : headerStyles.toggleButton}
            onClick={toggleSidebar}
            onMouseEnter={() => setHoveredItem('toggle')}
            onMouseLeave={() => setHoveredItem(null)}
            aria-label="Toggle Sidebar"
          >
            <FaBars />
          </button>

          {/* Enhanced Brand */}
          <div 
            style={headerStyles.brand}
            onMouseEnter={() => setHoveredItem('brand')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div style={{
              ...headerStyles.brandIcon,
              transform: hoveredItem === 'brand' ? 'rotate(5deg) scale(1.05)' : 'rotate(0deg) scale(1)',
            }}>
              IMS
            </div>
            <div>
              <div style={headerStyles.brandText}>
                Inventory Management System
              </div>
              <div style={headerStyles.brandSubtext}>
                Advanced Control Panel
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Enhanced Admin Panel */}
        <div style={headerStyles.rightSection}>
          <div
            style={headerStyles.adminSection}
            onMouseEnter={() => setHoveredItem('admin')}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div style={headerStyles.adminAvatar}>
              <FaShieldAlt />
            </div>
            {!isMobile && (
              <div style={headerStyles.adminInfo}>
                <div style={headerStyles.adminName}>
                  {user?.username || 'System Admin'}
                </div>
                <div style={headerStyles.adminRole}>
                  <FaCog style={{ fontSize: '10px' }} />
                  Administrator
                </div>
              </div>
            )}
            <FaChevronDown style={headerStyles.chevronIcon} />

            {/* Enhanced Dropdown Menu */}
            {showDropdown && (
              <div style={headerStyles.dropdown}>
                {/* Header */}
                <div style={headerStyles.dropdownHeader}>
                  <div style={headerStyles.dropdownHeaderAvatar}>
                    <FaShieldAlt />
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                      {user?.username || 'System Admin'}
                    </div>
                    <div style={{ fontSize: '14px', opacity: '0.9' }}>
                      admin@inventory.com
                    </div>
                    <div style={{ fontSize: '12px', opacity: '0.8', marginTop: '2px' }}>
                      Full System Access
                    </div>
                  </div>
                </div>

                {/* Admin Features Grid */}
                <div style={headerStyles.adminFeaturesGrid}>
                  {adminFeatures.map((feature, index) => (
                    <div
                      key={index}
                      style={hoveredItem === `feature-${index}` ? 
                        {...headerStyles.featureCard, ...headerStyles.featureCardHover} : 
                        headerStyles.featureCard
                      }
                      onMouseEnter={() => setHoveredItem(`feature-${index}`)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => {
                        // Handle feature click
                        console.log(`Clicked ${feature.title}`);
                      }}
                    >
                      <feature.icon 
                        style={hoveredItem === `feature-${index}` ? 
                          {...headerStyles.featureIcon, ...headerStyles.featureIconHover} : 
                          headerStyles.featureIcon
                        } 
                      />
                      <div 
                        style={hoveredItem === `feature-${index}` ? 
                          {...headerStyles.featureTitle, ...headerStyles.featureTitleHover} : 
                          headerStyles.featureTitle
                        }
                      >
                        {feature.title}
                      </div>
                      <div 
                        style={hoveredItem === `feature-${index}` ? 
                          {...headerStyles.featureDesc, ...headerStyles.featureDescHover} : 
                          headerStyles.featureDesc
                        }
                      >
                        {feature.desc}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={headerStyles.dropdownDivider}></div>

                {/* Logout */}
                <div
                  style={hoveredItem === 'logout' ? 
                    {...headerStyles.logoutButton, ...headerStyles.logoutButtonHover} : 
                    headerStyles.logoutButton
                  }
                  onMouseEnter={() => setHoveredItem('logout')}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={handleLogout}
                >
                  <FaSignOutAlt />
                  Logout from System
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overlay for dropdown */}
        {showDropdown && (
          <div
            style={headerStyles.overlay}
            onClick={() => setShowDropdown(false)}
          />
        )}
      </header>
    </>
  );
};

export default Header;