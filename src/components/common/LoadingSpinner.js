import React from 'react';
import { Spinner, Container, Row, Col } from 'react-bootstrap';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'lg', 
  variant = 'primary',
  fullScreen = false 
}) => {
  const content = (
    <div className="text-center">
      <Spinner animation="border" variant={variant} size={size} />
      {message && <p className="mt-3 text-muted">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <Container fluid className="vh-100">
        <Row className="justify-content-center align-items-center h-100">
          <Col xs="auto">
            {content}
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <div className="loading py-4">
      {content}
    </div>
  );
};

export default LoadingSpinner;