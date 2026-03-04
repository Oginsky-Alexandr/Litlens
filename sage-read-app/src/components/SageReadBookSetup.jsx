// SageReadBookSetup.jsx
import React, { useState, useRef, useEffect } from 'react';
import './SageReadBookSetup.css';

const SageReadBookSetup = ({ onStartAnalysis }) => {
  const [bookInput, setBookInput] = useState('');
  const inputRef = useRef(null);

  // Auto-focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleInputChange = (e) => {
    setBookInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (bookInput.trim() && onStartAnalysis) {
      // Pass raw, unmodified text to parent component
      onStartAnalysis(bookInput.trim());
    }
  };

  // Check if button should be enabled
  const isButtonEnabled = bookInput.trim().length > 0;

  return (
    <div className="sage-read-container">
      {/* Header Section */}
      <header className="sage-read-header">
        <div className="header-content">
          <h1 className="app-name">LitLense</h1>
          <p className="app-tagline">Your intelligent reading 
companion</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="sage-read-main">
        <div className="setup-card">
          {/* Main Prompt */}
          <div className="main-prompt">
            <h2>Which book are you reading?</h2>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="book-input-form">
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={bookInput}
                onChange={handleInputChange}
                placeholder="Enter any book with title and author"
                className="book-input"
                aria-label="Book title and author"
              />
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              className="start-analysis-btn"
              disabled={!isButtonEnabled}
            >
              Start Analysis
            </button>
          </form>

          {/* Guidance Section */}
          <div className="guidance-section">
            <div className="examples">
              <h3>Examples:</h3>
              <ul className="example-list">
                <li>"To Kill a Mockingbird by Harper Lee"</li>
                <li>"1984 - George Orwell"</li>
              </ul>
            </div>
            <div className="help-text">
              <p>Enter the book in any format — we'll figure it out!</p>
              <p className="note">
                Tip: Including both title and author helps ensure accurate 
analysis.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SageReadBookSetup;
