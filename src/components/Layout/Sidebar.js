import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaBox,
  FaTruck,
  FaUsers,
  FaWarehouse,
  FaCashRegister,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaChevronUp,
  FaChevronDown
} from 'react-icons/fa';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Company information
  const companyInfo = {
    name: 'SaranyaInternational',
    email: 'internationalsaranya@gmail.com',
    phone: '0112745833',
    website: 'www.saranyainternational.com'
  };

  // Menu configuration with orange theme
  const menuItems = [
    { 
      path: '/dashboard', 
      icon: FaTachometerAlt, 
      label: 'Dashboard',
      color: '#ff8c00',
      gradient: 'linear-gradient(135deg, #ff8c00, #ffa500)'
    },
    { 
      path: '/products', 
      icon: FaBox, 
      label: 'Products',
      color: '#ff6b35',
      gradient: 'linear-gradient(135deg, #ff6b35, #ff8c00)'
    },
    { 
      path: '/suppliers', 
      icon: FaTruck, 
      label: 'Suppliers',
      color: '#ff4500',
      gradient: 'linear-gradient(135deg, #ff4500, #ff6b35)'
    },
    { 
      path: '/customers', 
      icon: FaUsers, 
      label: 'Customers',
      color: '#ffa500',
      gradient: 'linear-gradient(135deg, #ffa500, #ffb347)'
    },
    { 
      path: '/inventory', 
      icon: FaWarehouse, 
      label: 'Inventory',
      color: '#ff7f50',
      gradient: 'linear-gradient(135deg, #ff7f50, #ff8c00)'
    },
    { 
      path: '/sales', 
      icon: FaCashRegister, 
      label: 'Sales',
      color: '#ff5722',
      gradient: 'linear-gradient(135deg, #ff5722, #ff6b35)'
<<<<<<< HEAD
=======
    },
    { 
      path: '/reports', 
      icon: FaTachometerAlt, 
      label: 'reports',
      color: '#ff8c00',
      gradient: 'linear-gradient(135deg, #ff8c00, #ffa500)'
>>>>>>> master
    }
  ];

  // Enhanced sidebar styles with orange theme
  const sidebarStyles = {
    // Main container
    container: {
      height: '100vh',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f1e 100%)',
      padding: isMobile ? '16px 12px' : '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
<<<<<<< HEAD
      overflow: 'hidden',
=======
      overflowX: 'hidden',
      overflowY: 'auto',
>>>>>>> master
      boxShadow: '4px 0 20px rgba(255, 140, 0, 0.1)',
      borderRight: '1px solid rgba(255, 140, 0, 0.2)',
    },

    // Animated background elements
    backgroundElement: {
      position: 'absolute',
      background: 'radial-gradient(circle, rgba(255, 140, 0, 0.1) 0%, transparent 70%)',
      borderRadius: '50%',
      animation: 'float 6s ease-in-out infinite',
    },

    // Enhanced brand section
    brandContainer: {
      marginBottom: isMobile ? '24px' : '32px',
      paddingBottom: isMobile ? '16px' : '24px',
      borderBottom: '2px solid rgba(255, 140, 0, 0.2)',
      textAlign: isOpen ? 'left' : 'center',
      position: 'relative',
      background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '12px' : '16px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 140, 0, 0.15)',
      transition: 'all 0.3s ease',
    },

    brandIcon: {
      width: isOpen ? (isMobile ? '40px' : '50px') : (isMobile ? '35px' : '45px'),
      height: isOpen ? (isMobile ? '40px' : '50px') : (isMobile ? '35px' : '45px'),
      background: 'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: isOpen ? '0 0 12px 0' : '0 auto 8px auto',
      fontSize: isOpen ? (isMobile ? '16px' : '20px') : (isMobile ? '14px' : '18px'),
      color: 'white',
      fontWeight: '900',
      boxShadow: '0 8px 25px rgba(255, 140, 0, 0.4)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      border: '2px solid rgba(255, 255, 255, 0.2)',
    },

    brandTitle: {
      fontSize: isOpen ? (isMobile ? '18px' : '22px') : (isMobile ? '12px' : '14px'),
      fontWeight: '800',
      background: 'linear-gradient(135deg, #ff8c00 0%, #ffa500 50%, #ffb347 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: 0,
      transition: 'all 0.3s ease',
      letterSpacing: '0.5px',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },

    brandSubtitle: {
      color: 'rgba(255, 140, 0, 0.8)',
      fontSize: isMobile ? '10px' : '12px',
      fontWeight: '600',
      marginTop: '4px',
      display: isOpen ? 'block' : 'none',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },

    // Company info section
    companySection: {
      background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.15) 0%, rgba(255, 165, 0, 0.1) 100%)',
      borderRadius: '12px',
      padding: isOpen ? (isMobile ? '12px' : '16px') : '8px',
      marginBottom: isMobile ? '16px' : '24px',
      border: '1px solid rgba(255, 140, 0, 0.2)',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    },

    companyHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isOpen ? 'space-between' : 'center',
      marginBottom: showCompanyInfo && isOpen ? '12px' : '0',
    },

    companyIcon: {
      color: '#ff8c00',
      fontSize: isMobile ? '16px' : '18px',
      marginRight: isOpen ? '8px' : '0',
    },

    companyName: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: isOpen ? (isMobile ? '12px' : '14px') : '0px',
      fontWeight: '700',
      display: isOpen ? 'block' : 'none',
      transition: 'all 0.3s ease',
    },

    expandIcon: {
      color: 'rgba(255, 140, 0, 0.7)',
      fontSize: '12px',
      transition: 'all 0.3s ease',
      transform: showCompanyInfo ? 'rotate(180deg)' : 'rotate(0deg)',
      display: isOpen ? 'block' : 'none',
    },

    companyDetails: {
      display: showCompanyInfo && isOpen ? 'block' : 'none',
      animation: showCompanyInfo ? 'slideDown 0.3s ease' : 'slideUp 0.3s ease',
    },

    companyDetailItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
      padding: '6px 8px',
      borderRadius: '8px',
      background: 'rgba(255, 255, 255, 0.05)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    },

    companyDetailIcon: {
      color: '#ff8c00',
      fontSize: '12px',
      width: '16px',
    },

    companyDetailText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: isMobile ? '10px' : '11px',
      fontWeight: '500',
    },

    // Enhanced navigation
    navContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      flex: 1,
      position: 'relative',
    },

    navItem: {
      position: 'relative',
      borderRadius: '14px',
      overflow: 'hidden',
    },

    navLink: {
      display: 'flex',
      alignItems: 'center',
      gap: isOpen ? (isMobile ? '12px' : '16px') : '0',
      padding: isOpen ? (isMobile ? '14px 16px' : '16px 20px') : (isMobile ? '14px 0' : '16px 0'),
      justifyContent: isOpen ? 'flex-start' : 'center',
      color: 'rgba(255, 255, 255, 0.7)',
      textDecoration: 'none',
      borderRadius: '14px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      fontWeight: '600',
      fontSize: isMobile ? '13px' : '14px',
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      width: '100%',
      backdropFilter: 'blur(10px)',
    },

    // Enhanced icon container
    iconContainer: {
      width: isMobile ? '36px' : '42px',
      height: isMobile ? '36px' : '42px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '12px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      zIndex: 1,
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },

    // Enhanced label text
    labelText: {
      display: isOpen ? 'block' : 'none',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1,
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    },

    // Enhanced active indicator
    activeIndicator: {
      position: 'absolute',
      left: '-16px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '5px',
      height: '30px',
      borderRadius: '0 8px 8px 0',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '2px 0 10px rgba(255, 140, 0, 0.5)',
    },

    // Enhanced tooltip
    tooltip: {
      position: 'fixed',
      left: isMobile ? '70px' : '90px',
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 140, 0, 0.1) 100%)',
      color: 'white',
      padding: '10px 14px',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: '600',
      zIndex: 1000,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      boxShadow: '0 8px 32px rgba(255, 140, 0, 0.3)',
      border: '1px solid rgba(255, 140, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      transform: 'translateY(-50%)',
      animation: 'tooltipSlide 0.3s ease',
    },

    tooltipArrow: {
      position: 'absolute',
      left: '-5px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '0',
      height: '0',
      borderTop: '5px solid transparent',
      borderBottom: '5px solid transparent',
      borderRight: '5px solid rgba(0, 0, 0, 0.95)',
    },
  };

  // Get current active item
  const getActiveItem = () => {
    return menuItems.find(item => location.pathname.startsWith(item.path));
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Enhanced item styles with orange theme
  const getItemStyles = (item) => {
    const isActive = location.pathname.startsWith(item.path);
    const isHovered = hoveredItem === item.path;

    return {
      navLink: {
        ...sidebarStyles.navLink,
        background: isActive 
          ? 'linear-gradient(135deg, rgba(255, 140, 0, 0.2) 0%, rgba(255, 165, 0, 0.15) 100%)' 
          : isHovered 
            ? 'linear-gradient(135deg, rgba(255, 140, 0, 0.1) 0%, rgba(255, 165, 0, 0.08) 100%)' 
            : 'transparent',
        color: isActive 
          ? 'white' 
          : isHovered 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(255, 255, 255, 0.7)',
        transform: isActive || isHovered ? 'translateX(8px) scale(1.02)' : 'translateX(0) scale(1)',
        boxShadow: isActive 
          ? '0 8px 32px rgba(255, 140, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
          : isHovered 
            ? '0 4px 20px rgba(255, 140, 0, 0.2)' 
            : 'none',
        border: isActive 
          ? '1px solid rgba(255, 140, 0, 0.3)' 
          : '1px solid transparent',
      },
      iconContainer: {
        ...sidebarStyles.iconContainer,
        background: isActive || isHovered ? item.gradient : 'rgba(255, 255, 255, 0.08)',
        boxShadow: isActive || isHovered 
          ? `0 6px 25px ${item.color}50, inset 0 1px 0 rgba(255, 255, 255, 0.2)` 
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        transform: isActive || isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
        border: isActive || isHovered ? '2px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
      },
      activeIndicator: {
        ...sidebarStyles.activeIndicator,
        background: item.gradient,
        opacity: isActive ? 1 : 0,
        transform: isActive ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.8)',
      }
    };
  };

  // Animation keyframes
  const animations = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-10px); }
    }
    @keyframes tooltipSlide {
      from { opacity: 0; transform: translateY(-50%) translateX(-10px); }
      to { opacity: 1; transform: translateY(-50%) translateX(0); }
    }
  `;

  return (
    <>
      <style>{animations}</style>
      <div style={sidebarStyles.container}>
        {/* Animated background elements */}
        <div style={{
          ...sidebarStyles.backgroundElement,
          width: '100px',
          height: '100px',
          top: '20%',
          right: '-50px',
          animationDelay: '0s'
        }} />
        <div style={{
          ...sidebarStyles.backgroundElement,
          width: '80px',
          height: '80px',
          bottom: '20%',
          left: '-40px',
          animationDelay: '3s'
        }} />

        {/* Enhanced Brand Section */}
        <div 
          style={{
            ...sidebarStyles.brandContainer,
            transform: hoveredItem === 'brand' ? 'scale(1.02)' : 'scale(1)',
          }}
          onMouseEnter={() => setHoveredItem('brand')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div style={{
            ...sidebarStyles.brandIcon,
            transform: hoveredItem === 'brand' ? 'scale(1.1) rotate(10deg)' : 'scale(1) rotate(0deg)',
          }}>
            SI
          </div>
          <h1 style={sidebarStyles.brandTitle}>
            {isOpen ? 'SaranyaInternational' : 'SI'}
          </h1>
          <div style={sidebarStyles.brandSubtitle}>
            Inventory Management System
          </div>
        </div>

        {/* Company Information Section */}
        <div 
          style={{
            ...sidebarStyles.companySection,
            transform: hoveredItem === 'company' ? 'scale(1.02)' : 'scale(1)',
          }}
          onMouseEnter={() => setHoveredItem('company')}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => setShowCompanyInfo(!showCompanyInfo)}
        >
          <div style={sidebarStyles.companyHeader}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FaBuilding style={sidebarStyles.companyIcon} />
              <span style={sidebarStyles.companyName}>Company Info</span>
            </div>
            {isOpen && (
              <FaChevronDown style={sidebarStyles.expandIcon} />
            )}
          </div>

          <div style={sidebarStyles.companyDetails}>
            <div 
              style={{
                ...sidebarStyles.companyDetailItem,
                background: hoveredItem === 'email' ? 'rgba(255, 140, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              }}
              onMouseEnter={() => setHoveredItem('email')}
              onMouseLeave={() => setHoveredItem('company')}
            >
              <FaEnvelope style={sidebarStyles.companyDetailIcon} />
              <span style={sidebarStyles.companyDetailText}>{companyInfo.email}</span>
            </div>
            <div 
              style={{
                ...sidebarStyles.companyDetailItem,
                background: hoveredItem === 'phone' ? 'rgba(255, 140, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              }}
              onMouseEnter={() => setHoveredItem('phone')}
              onMouseLeave={() => setHoveredItem('company')}
            >
              <FaPhone style={sidebarStyles.companyDetailIcon} />
              <span style={sidebarStyles.companyDetailText}>{companyInfo.phone}</span>
            </div>
            <div 
              style={{
                ...sidebarStyles.companyDetailItem,
                background: hoveredItem === 'website' ? 'rgba(255, 140, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              }}
              onMouseEnter={() => setHoveredItem('website')}
              onMouseLeave={() => setHoveredItem('company')}
            >
              <FaGlobe style={sidebarStyles.companyDetailIcon} />
              <span style={sidebarStyles.companyDetailText}>{companyInfo.website}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Menu */}
        <nav style={sidebarStyles.navContainer}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const itemStyles = getItemStyles(item);
            
            return (
              <div key={item.path} style={sidebarStyles.navItem}>
                {/* Enhanced active indicator */}
                <div style={itemStyles.activeIndicator} />
                
                {/* Enhanced navigation link */}
                <button
                  style={itemStyles.navLink}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => handleNavigation(item.path)}
                  aria-label={item.label}
                >
                  <div style={itemStyles.iconContainer}>
                    <IconComponent 
                      style={{
                        fontSize: isMobile ? '16px' : '18px',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                      }}
                    />
                  </div>
                  <span style={sidebarStyles.labelText}>
                    {item.label}
                  </span>
                </button>
              </div>
            );
          })}
        </nav>

        {/* Enhanced tooltip for collapsed sidebar */}
        {!isOpen && hoveredItem && hoveredItem !== 'brand' && hoveredItem !== 'company' && hoveredItem !== 'email' && hoveredItem !== 'phone' && hoveredItem !== 'website' && (
          <div 
            style={{
              ...sidebarStyles.tooltip,
              top: `${(menuItems.findIndex(item => item.path === hoveredItem) + 1) * (isMobile ? 60 : 70) + (isMobile ? 180 : 220)}px`
            }}
          >
            <div style={sidebarStyles.tooltipArrow}></div>
            {menuItems.find(item => item.path === hoveredItem)?.label}
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;