import React, { useState, useEffect, useRef } from 'react';
import { Form, ListGroup } from 'react-bootstrap';
import api from '../services/api';

const ProductSearchInput = ({ onProductSelect, selectedProduct, placeholder = "Type product code or name..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionRef = useRef(null);

  useEffect(() => {
    if (selectedProduct) {
      setSearchTerm(`${selectedProduct.code} - ${selectedProduct.name}`);
    } else {
      setSearchTerm('');
    }
  }, [selectedProduct]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchProducts = async (term) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/products/search?q=${encodeURIComponent(term)}`);
      setSuggestions(response.data);
    } catch (error) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    
    // Clear selected product if user is typing
    if (selectedProduct && value !== `${selectedProduct.code} - ${selectedProduct.name}`) {
      onProductSelect(null);
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchProducts(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleProductSelect = (product) => {
    setSearchTerm(`${product.code} - ${product.name}`);
    setShowSuggestions(false);
    setSuggestions([]);
    onProductSelect(product);
  };

  const handleFocus = () => {
    if (searchTerm && !selectedProduct) {
      setShowSuggestions(true);
      searchProducts(searchTerm);
    }
  };

  return (
    <div className="position-relative">
      <Form.Control
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div 
          ref={suggestionRef}
          className="search-suggestion"
        >
          {loading ? (
            <div className="search-suggestion-item text-center">
              <small>Searching...</small>
            </div>
          ) : (
            <ListGroup variant="flush">
              {suggestions.map((product) => (
                <ListGroup.Item
                  key={product.id}
                  action
                  onClick={() => handleProductSelect(product)}
                  className="search-suggestion-item border-0"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{product.code}</strong> - {product.name}
                      <br />
                      <small className="text-muted">
                        Price: ${product.fixedPrice?.toFixed(2)} | Stock: {product.currentStock || 0}
                      </small>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchInput;