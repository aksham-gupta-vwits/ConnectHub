import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@group-ui/group-ui-react/node_modules/@group-ui/group-ui/dist/group-ui/assets/themes/tokens.css';
import { defineCustomElements } from '@group-ui/group-ui-react/node_modules/@group-ui/group-ui/dist/components';
void defineCustomElements();

// Global styles to override defaults and ensure GroupUI compatibility
const globalStyles = `
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  #root {
    height: 100vh;
  }
`;

// Inject global styles
const style = document.createElement('style');
style.textContent = globalStyles;
document.head.appendChild(style);

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
