import React, { useState, useEffect } from 'react';
import Backendless from './backendless';
import logo from './assets/logo.png'; // ✅ Your logo path

function PredictionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [decimal, setDecimal] = useState(null);
  const [history, setHistory] = useState([]);

  const generateWeightedDecimal = () => {
    const chance = Math.random();
    let value;
    if (chance < 0.8) {
      value = (Math.random() * (10.99 - 1.0) + 1.0).toFixed(2);
    } else {
      value = (Math.random() * (99.99 - 11.0) + 11.0).toFixed(2);
    }
    return value;
  };

  const saveInitialPrediction = async () => {
    const rawDecimal = generateWeightedDecimal();
    setDecimal(`${rawDecimal}x`);
    try {
      await Backendless.Data.of('GeneratedValues').save({
        generatedValue: parseFloat(rawDecimal),
        created: new Date(),
      });
    } catch (err) {
      console.error('Error saving prediction:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const result = await Backendless.Data.of('GeneratedValues').find({
        sortBy: ['created DESC'],
        pageSize: 20,
      });
      setHistory(result);
      if (result.length > 0) {
        setDecimal(`${result[0].generatedValue}x`);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  useEffect(() => {
    const currentUser = Backendless.UserService.getCurrentUser();
    if (currentUser) {
      setEmail(currentUser.email);
      setIsLoggedIn(true);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          saveInitialPrediction().then(fetchHistory);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      fetchHistory();

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await Backendless.UserService.login(email, password, true);
      } else {
        await Backendless.UserService.register({ email, password });
        await Backendless.UserService.login(email, password, true);
      }
      Backendless.UserService.setCurrentUser(Backendless.UserService.getCurrentUser());
      setIsLoggedIn(true);
      await saveInitialPrediction();
      await fetchHistory();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await Backendless.UserService.logout();
      setIsLoggedIn(false);
      setEmail('');
      setPassword('');
      setDecimal(null);
      setHistory([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Fixed top bar */}
      <div style={styles.topBar}>
        <img src={logo} alt="Logo" style={styles.logo} />
        <h1 style={styles.appTitle}>Aviator Predictions App</h1>
        {isLoggedIn && (
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        )}
      </div>

      {/* Padding to prevent fixed header from overlapping content */}
      <div style={styles.pageContent}>
        {isLoggedIn && decimal && (
          <h2 style={styles.predictionsTitle}>Predictions</h2>
        )}

        {decimal && (
          <div style={styles.predictionBox}>
            {decimal}
            <div style={styles.planeIcon}>🛩️</div>
          </div>
        )}

        {!isLoggedIn && (
          <form onSubmit={handleSubmit} style={styles.authForm}>
            <h3>{isLogin ? 'Login' : 'Register'}</h3>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.authButton}>
              {isLogin ? 'Login' : 'Register'}
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={styles.switchButton}
            >
              Switch to {isLogin ? 'Register' : 'Login'}
            </button>
          </form>
        )}

        {decimal && (
          <div style={styles.paymentContainer}>
            <button
              onClick={() => {
                window.location.href = "https://store.pesapal.com/accessunlimitedpredictions";
              }}
              style={styles.paymentButton}
            >
              Next Prediction
            </button>
            <p style={styles.paymentNote}>
              🔒 Unlock <strong>unlimited predictions</strong> with a small one-time payment of <strong>$0.76 USD</strong> and keep winning!
            </p>
          </div>
        )}

        {history.length > 0 && (
          <div style={styles.historyBox}>
            <h3>Recent Predictions</h3>
            <ul style={styles.historyList}>
              {history.map((item, index) => (
                <li key={index}>{item.generatedValue}x</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
  },
  topBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 1000,
  },
  logo: {
    height: '40px',
    width: '40px',
    marginRight: '10px',
  },
  appTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
    flexGrow: 1,
  },
  logoutButton: {
    padding: '5px 10px',
    fontSize: '12px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  pageContent: {
    paddingTop: '80px',
    paddingLeft: '20px',
    paddingRight: '20px',
    maxWidth: '100%',
    margin: '0 auto',
  },
  predictionsTitle: {
    textAlign: 'center',
    fontSize: '24px',
    marginBottom: 20,
  },
  predictionBox: {
    backgroundColor: 'white',
    padding: 20,
    textAlign: 'center',
    marginBottom: 20,
    borderRadius: 8,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    fontWeight: 'bold',
    color: 'red',
    fontSize: 28,
  },
  planeIcon: {
    fontSize: 24,
    marginTop: 10,
  },
  authForm: {
    marginBottom: 30,
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  authButton: {
    padding: 10,
    width: '100%',
    backgroundColor: '#28a745',
    color: '#fff',
    fontSize: 16,
    border: 'none',
    borderRadius: 4,
  },
  switchButton: {
    marginTop: 10,
    fontSize: 14,
    color: '#007BFF',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  paymentContainer: {
    textAlign: 'center',
    margin: '30px 0',
  },
  paymentButton: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  paymentNote: {
    fontSize: '14px',
    color: '#555',
    marginTop: '10px',
  },
  historyBox: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    maxHeight: '250px',
    overflowY: 'auto',
  },
  historyList: {
    color: 'black',
    listStyle: 'decimal',
    paddingLeft: '20px',
  },
};

export default PredictionPage;