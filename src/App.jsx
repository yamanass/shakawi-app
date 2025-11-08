import reactLogo from './assets/react.svg';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* Floating decorative elements */}
      <div className="floating-flower flower1"></div>
      <div className="floating-flower flower2"></div>
      <div className="floating-flower flower3"></div>

      <header className="header">
        <img src={reactLogo} className="logo" alt="React logo" />
        <h1 className="main-title">React Wonderland ✨</h1>
      </header>

      <div className="card">
        <h1 className="greeting">Hello there! 👋</h1>
        <h2 className="message">
          Yaman & Naghm are about to rock the React world! <br />
          Let's code, create, and have fun 😎🔥
        </h2>
      </div>

      <footer>
        <p>Made with ❤️ using React & Vite</p>
      </footer>
    </div>
  );
}

export default App;
