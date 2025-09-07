import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Clean, organized styles
  const layoutStyles = {
    // Main container styling
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      padding: 0,
      margin: 0,
      position: 'relative',
      overflow: 'hidden',
    },

    // Row container
    row: {
      margin: 0,
      minHeight: '100vh',
      position: 'relative',
    },

    // Sidebar column
    sidebarCol: {
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      width: sidebarOpen ? '250px' : '80px',
      zIndex: 1000,
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
    },

    // Main content area
    mainContentCol: {
      marginLeft: sidebarOpen ? '250px' : '80px',
      transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      padding: 0,
      position: 'relative',
      minHeight: '100vh',
    },

    // Header container
    headerContainer: {
      position: 'sticky',
      top: 0,
      zIndex: 999,
      width: '100%',
    },

    // Content wrapper
    contentWrapper: {
      padding: '24px',
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(20px)',
      minHeight: 'calc(100vh - 80px)',
      borderRadius: '20px 20px 0 0',
      margin: '0',
      position: 'relative',
      overflow: 'hidden',
    },

    // Inner content area
    contentInner: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      padding: '32px',
      minHeight: 'calc(100vh - 160px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      zIndex: 1,
    },

    // Decorative background elements
    decorativeElement1: {
      position: 'absolute',
      top: '15%',
      right: '-150px',
      width: '400px',
      height: '400px',
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))',
      borderRadius: '50%',
      filter: 'blur(80px)',
      zIndex: 0,
      animation: 'float 8s ease-in-out infinite',
    },

    decorativeElement2: {
      position: 'absolute',
      bottom: '10%',
      left: '-100px',
      width: '300px',
      height: '300px',
      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.05))',
      borderRadius: '50%',
      filter: 'blur(60px)',
      zIndex: 0,
      animation: 'float 12s ease-in-out infinite reverse',
    },

    decorativeElement3: {
      position: 'absolute',
      top: '60%',
      right: '20%',
      width: '200px',
      height: '200px',
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.05))',
      borderRadius: '50%',
      filter: 'blur(40px)',
      zIndex: 0,
      animation: 'float 10s ease-in-out infinite',
    },
  };

  // Add animations to document
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
        25% { transform: translateY(-20px) rotate(3deg); opacity: 0.8; }
        50% { transform: translateY(-10px) rotate(-2deg); opacity: 0.9; }
        75% { transform: translateY(-15px) rotate(1deg); opacity: 0.8; }
      }
      
      /* Smooth scrolling */
      html {
        scroll-behavior: smooth;
      }
      
      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
      }
    `;
    
    if (!document.head.querySelector('#layout-styles')) {
      styleElement.id = 'layout-styles';
      document.head.appendChild(styleElement);
    }

    return () => {
      const existingStyles = document.head.querySelector('#layout-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
    };
  }, []);

  return (
    <div style={layoutStyles.container}>
      {/* Decorative background elements */}
      <div style={layoutStyles.decorativeElement1}></div>
      <div style={layoutStyles.decorativeElement2}></div>
      <div style={layoutStyles.decorativeElement3}></div>

      {/* Sidebar */}
      <div style={layoutStyles.sidebarCol}>
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Main content area */}
      <div style={layoutStyles.mainContentCol}>
        {/* Header */}
        <div style={layoutStyles.headerContainer}>
          <Header toggleSidebar={toggleSidebar} />
        </div>

        {/* Content wrapper */}
        <div style={layoutStyles.contentWrapper}>
          <div style={layoutStyles.contentInner}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;