import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaLock, FaBuilding } from 'react-icons/fa';
import axios from 'axios';
import './LoginPage.css'; // Import custom CSS
import Logo from '../asset/Artboard 1@4x.png'; // Import logo image

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Pre-fill with default admin credentials for demo
    setUsername('admin');
    setPassword('admin123');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      
      if (!result.success) {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-overlay"></div>
      </div>
      
      <Container fluid className="login-content">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md={6} lg={4} xl={3}>
            <Card className="login-card">
              <Card.Body className="login-card-body">
                <div className="login-header">
                  <div className="company-logo">
                   
                    <img 
      src={Logo} 
      alt="Logo"
      className="medium-image"
      onError={() => console.log('Image failed to load')}
    />
    
                  </div>
                  <h1 className="company-name">Saranya International</h1>
                  <h2 className="system-name">Inventory Management System</h2>
                  <p className="login-subtitle">Please sign in to continue</p>
                </div>

                {error && (
                  <Alert variant="danger" className="custom-alert">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit} className="login-form">
                  <Form.Group className="form-group-custom">
                    <Form.Label className="form-label-custom">
                      <FaUser className="input-icon" />
                      Username
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                      disabled={loading}
                      className="form-input-custom"
                    />
                  </Form.Group>

                  <Form.Group className="form-group-custom">
                    <Form.Label className="form-label-custom">
                      <FaLock className="input-icon" />
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      className="form-input-custom"
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="login-button"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          className="button-spinner"
                        />
                        Signing In...
                      </>
                    ) : (
                      'Sign In to Dashboard'
                    )}
                  </Button>
                </Form>

                {/*<div className="demo-credentials">
                  <small className="demo-text">
                    <strong>Demo Access:</strong><br />
                    Username: admin | Password: admin123
                  </small>
                </div>*/}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;