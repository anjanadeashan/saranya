import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaBox,
  FaTruck,
  FaUsers,
  FaWarehouse,
  FaCashRegister
} from 'react-icons/fa';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);

  // Menu configuration
  const menuItems = [
    { 
      path: '/dashboard', 
      icon: FaTachometerAlt, 
      label: 'Dashboard',
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
    },
    { 
      path: '/products', 
      icon: FaBox, 
      label: 'Products',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    { 
      path: '/suppliers', 
      icon: FaTruck, 
      label: 'Suppliers',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)'
    },
    { 
      path: '/customers', 
      icon: FaUsers, 
      label: 'Customers',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    { 
      path: '/inventory', 
      icon: FaWarehouse, 
      label: 'Inventory',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    },
    { 
      path: '/sales', 
      icon: FaCashRegister, 
      label: 'Sales',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)'
    }
  ];

  // Sidebar styles
  const sidebarStyles = {
    // Main container
    container: {
      height: '100vh',
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    },

    // Brand section
    brandContainer: {
      marginBottom: '32px',
      paddingBottom: '24px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: isOpen ? 'left' : 'center',
    },

    brandTitle: {
      fontSize: isOpen ? '24px' : '18px',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: 0,
      transition: 'all 0.3s ease',
      letterSpacing: '0.5px',
    },

    brandSubtitle: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '12px',
      fontWeight: '500',
      marginTop: '4px',
      display: isOpen ? 'block' : 'none',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },

    // Navigation
    navContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      flex: 1,
    },

    navItem: {
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
    },

    navLink: {
      display: 'flex',
      alignItems: 'center',
      gap: isOpen ? '16px' : '0',
      padding: isOpen ? '16px 20px' : '16px 0',
      justifyContent: isOpen ? 'flex-start' : 'center',
      color: 'rgba(255, 255, 255, 0.7)',
      textDecoration: 'none',
      borderRadius: '12px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      width: '100%',
    },

    // Icon container
    iconContainer: {
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '10px',
      transition: 'all 0.3s ease',
      position: 'relative',
      zIndex: 1,
    },

    // Label text
    labelText: {
      display: isOpen ? 'block' : 'none',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1,
    },

    // Active indicator
    activeIndicator: {
      position: 'absolute',
      left: '-16px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '4px',
      height: '24px',
      borderRadius: '0 4px 4px 0',
      transition: 'all 0.3s ease',
    },

    // Tooltip for collapsed mode
    tooltip: {
      position: 'fixed',
      left: '90px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      zIndex: 1000,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      transform: 'translateY(-50%)',
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

  // Get item styles based on state
  const getItemStyles = (item) => {
    const isActive = location.pathname.startsWith(item.path);
    const isHovered = hoveredItem === item.path;

    return {
      navLink: {
        ...sidebarStyles.navLink,
        background: isActive 
          ? 'rgba(255, 255, 255, 0.1)' 
          : isHovered 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'transparent',
        color: isActive 
          ? 'white' 
          : isHovered 
            ? 'rgba(255, 255, 255, 0.9)' 
            : 'rgba(255, 255, 255, 0.7)',
        transform: isActive || isHovered ? 'translateX(8px)' : 'translateX(0)',
        boxShadow: isActive ? '0 8px 25px rgba(0, 0, 0, 0.2)' : 'none',
      },
      iconContainer: {
        ...sidebarStyles.iconContainer,
        background: isActive || isHovered ? item.gradient : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isActive || isHovered ? `0 4px 20px ${item.color}40` : 'none',
        transform: isActive || isHovered ? 'scale(1.05)' : 'scale(1)',
      },
      activeIndicator: {
        ...sidebarStyles.activeIndicator,
        background: item.gradient,
        opacity: isActive ? 1 : 0,
      }
    };
  };

  return (
    <div style={sidebarStyles.container}>
      {/* Brand Section */}
      <div style={sidebarStyles.brandContainer}>
        <h1 style={sidebarStyles.brandTitle}>
          {isOpen ? 'Inventory Pro' : 'IP'}
        </h1>
        <div style={sidebarStyles.brandSubtitle}>
          Management System
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={sidebarStyles.navContainer}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const itemStyles = getItemStyles(item);
          
          return (
            <div key={item.path} style={sidebarStyles.navItem}>
              {/* Active indicator */}
              <div style={itemStyles.activeIndicator} />
              
              {/* Navigation link */}
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
                      fontSize: '18px',
                      color: 'white',
                      transition: 'all 0.3s ease',
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

      {/* Tooltip for collapsed sidebar */}
      {!isOpen && hoveredItem && (
        <div 
          style={{
            ...sidebarStyles.tooltip,
            top: `${(menuItems.findIndex(item => item.path === hoveredItem) + 1) * 70 + 120}px`
          }}
        >
          {menuItems.find(item => item.path === hoveredItem)?.label}
        </div>
      )}
    </div>
  );
};

export default Sidebar;