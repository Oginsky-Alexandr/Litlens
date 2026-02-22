#!/bin/bash
set -e

# SageRead MVP - Phase 1 Setup Script
# This script creates a React app and sets up the Book Setup interface

echo "🚀 Setting up SageRead MVP - Phase 1"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or 
higher from:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Check Node.js version (require v18+)
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION=18

if [ "${NODE_VERSION%%.*}" -lt "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js v18 or higher is required. Current version: 
v$NODE_VERSION"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js (which includes 
npm)"
    exit 1
fi

# Create React app
echo "📦 Creating React app..."
npx create-react-app sage-read-app --template cra-template-pwa

cd sage-read-app

# Create components directory
echo "📁 Creating component structure..."
mkdir -p src/components

# Create the SageReadBookSetup component
echo "⚛️ Creating SageReadBookSetup component..."
cat > src/components/SageReadBookSetup.jsx << 'EOF'
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
          <div className="app-icon">📖</div>
          <h1 className="app-name">SageRead</h1>
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
                <li>"The Great Gatsby (F. Scott Fitzgerald)"</li>
                <li>"Pride and Prejudice"</li>
                <li>"Moby Dick, Herman Melville"</li>
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

      {/* Footer */}
      <footer className="sage-read-footer">
        <p>Phase 1: Book Setup • All parsing handled by AI</p>
      </footer>
    </div>
  );
};

export default SageReadBookSetup;
EOF

# Create the CSS file
echo "🎨 Creating CSS styles..."
cat > src/components/SageReadBookSetup.css << 'EOF'
/* SageReadBookSetup.css */
:root {
  --primary-color: #2c3e50;
  --secondary-color: #f8f9fa;
  --text-primary: #333333;
  --text-secondary: #666666;
  --accent-color: #27ae60;
  --border-color: #e0e0e0;
  --disabled-color: #cccccc;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  background-color: var(--secondary-color);
  color: var(--text-primary);
  line-height: 1.6;
}

.sage-read-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

/* Header Styles */
.sage-read-header {
  width: 100%;
  max-width: 800px;
  margin-bottom: 40px;
  text-align: center;
}

.header-content {
  padding: 30px 0;
}

.app-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  opacity: 0.8;
}

.app-name {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 3.5rem;
  color: var(--primary-color);
  margin-bottom: 10px;
  letter-spacing: -0.5px;
}

.app-tagline {
  font-size: 1.2rem;
  color: var(--text-secondary);
  font-weight: 300;
}

/* Main Content Styles */
.sage-read-main {
  flex: 1;
  width: 100%;
  max-width: 800px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setup-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
  animation: fadeIn 0.5s ease-out;
}

.main-prompt {
  text-align: center;
  margin-bottom: 40px;
}

.main-prompt h2 {
  font-size: 2.2rem;
  font-weight: 400;
  color: var(--text-primary);
  line-height: 1.3;
}

/* Input Form Styles */
.book-input-form {
  margin-bottom: 50px;
}

.input-container {
  margin-bottom: 25px;
}

.book-input {
  width: 100%;
  padding: 18px 24px;
  font-size: 1.2rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background-color: white;
  color: var(--text-primary);
  transition: all 0.3s ease;
  outline: none;
}

.book-input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
}

.book-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

/* Button Styles */
.start-analysis-btn {
  width: 100%;
  padding: 18px;
  font-size: 1.2rem;
  font-weight: 600;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.start-analysis-btn:not(:disabled):hover {
  background-color: #219653;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.2);
}

.start-analysis-btn:disabled {
  background-color: var(--disabled-color);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Guidance Section */
.guidance-section {
  border-top: 1px solid var(--border-color);
  padding-top: 30px;
}

.examples h3 {
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 15px;
}

.example-list {
  list-style-type: none;
  margin-bottom: 25px;
}

.example-list li {
  padding: 8px 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  position: relative;
  padding-left: 20px;
}

.example-list li:before {
  content: "•";
  color: var(--accent-color);
  font-size: 1.5rem;
  position: absolute;
  left: 0;
  top: 5px;
}

.help-text {
  color: var(--text-secondary);
  font-size: 1.1rem;
  line-height: 1.5;
}

.help-text .note {
  font-size: 1rem;
  font-style: italic;
  margin-top: 10px;
  opacity: 0.8;
}

/* Footer Styles */
.sage-read-footer {
  width: 100%;
  max-width: 800px;
  text-align: center;
  padding: 20px 0;
  margin-top: 40px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  border-top: 1px solid var(--border-color);
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-name { font-size: 2.8rem; }
  .setup-card { padding: 30px 25px; }
  .main-prompt h2 { font-size: 1.8rem; }
}

@media (max-width: 480px) {
  .app-name { font-size: 2.2rem; }
  .setup-card { padding: 25px 20px; }
  .main-prompt h2 { font-size: 1.5rem; }
}

/* Animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Accessibility */
.book-input:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

.start-analysis-btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
EOF

# Replace App.js
echo "🔄 Updating App.js..."
cat > src/App.js << 'EOF'
import React from 'react';
import SageReadBookSetup from './components/SageReadBookSetup';
import './App.css';

function App() {
  const handleStartAnalysis = (rawBookInput) => {
    console.log('Phase 1 - Raw book input captured:', rawBookInput);
    console.log('In Phase 2, this will be sent to LLM for processing.');

    // Demo feedback
    alert(`Book input received: "${rawBookInput}"\n\nIn Phase 2, this text 
would be sent to the AI for processing.`);
  };

  return (
    <div className="App">
      <SageReadBookSetup onStartAnalysis={handleStartAnalysis} />
    </div>
  );
}

export default App;
EOF

# Simplify App.css
echo "🎯 Simplifying App.css..."
cat > src/App.css << 'EOF'
.App {
  min-height: 100vh;
  background-color: #f8f9fa;
}

* {
  box-sizing: border-box;
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
EOF

# Update index.js
echo "📝 Updating index.js..."
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Simplify index.css
cat > src/index.css << 'EOF'
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}
EOF

# Remove unnecessary default files
echo "🧹 Cleaning up default files..."
rm -f src/logo.svg
rm -f public/logo192.png
rm -f public/logo512.png

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   cd sage-read-app"
echo "   npm start"
echo ""
echo "Open: http://localhost:3000"
echo ""
echo "🎯 Phase 1 Success Criteria:"
echo "   ✓ Open input (any format accepted)"
echo "   ✓ No validation errors"
echo "   ✓ Simple state management"
echo "   ✓ Raw text preserved for LLM"
echo ""
echo "📚 Ready for Phase 2 integration."

