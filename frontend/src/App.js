import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import CSS
import './App.css';

// Components
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import LoadingSpinner from './components/LoadingSpinner';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Loading ConnectHub..." />;
  }

  return (
    <div className="App">
      {isAuthenticated ? (
        <Switch>
          <Route exact path="/" component={ChatPage} />
          <Route path="/chat" component={ChatPage} />
          <Redirect to="/" />
        </Switch>
      ) : (
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Redirect to="/login" />
        </Switch>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;