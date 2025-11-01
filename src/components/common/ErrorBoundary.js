import React from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container fluid className="vh-100 bg-light">
          <Row className="justify-content-center align-items-center h-100">
            <Col md={6} lg={4}>
              <Card className="shadow border-0">
                <Card.Body className="text-center p-5">
                  <FaExclamationTriangle size={60} className="text-danger mb-4" />
                  <h3 className="mb-3">Oops! Something went wrong</h3>
                  <p className="text-muted mb-4">
                    We're sorry, but something unexpected happened. Please try refreshing the page or go back to the dashboard.
                  </p>
                  
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <Alert variant="danger" className="text-start">
                      <details>
                        <summary className="mb-2">Error Details (Development)</summary>
                        <pre className="small">
                          {this.state.error && this.state.error.toString()}
                          <br />
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    </Alert>
                  )}
                  
                  <div className="d-grid gap-2">
                    <Button variant="primary" onClick={this.handleReload}>
                      Refresh Page
                    </Button>
                    <Button variant="outline-secondary" onClick={this.handleGoHome}>
                      <FaHome className="me-2" />
                      Go to Dashboard
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;