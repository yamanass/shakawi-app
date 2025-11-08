import reactLogo from './assets/react.svg';
import './App.css';

function App() {
  return (
    <div className="app-container">

      {/* Floating cute stars */}
      <div className="star star1"></div>
      <div className="star star2"></div>
      <div className="star star3"></div>
      <div className="star star4"></div>
      <div className="star star5"></div>

      <header className="header">
        <img src={reactLogo} className="logo" alt="React logo" />
        <h1 className="main-title">Great Dev Team ✨</h1>
      </header>

      <div className="card team-card">
        <h1 className="greeting">Meet Our Awesome Team 💖</h1>

        <div className="roles-box">
          <div className="role-title">🌸 Frontend Mobile</div>
          <div className="role-list">Nussaiba & Oday</div>

          <div className="role-title">💻 Frontend Web</div>
          <div className="role-list">Yaman & Nagham</div>

          <div className="role-title">🔥 Backend Hero</div>
          <div className="role-list">Ali</div>
        </div>

        <h2 className="message">
          Together we create magic and build with passion ✨🚀
        </h2>

        <p className="team-slogan">
          — United as one powerful team —
        </p>
      </div>

      <footer>
        <p>Made with ❤️ by Yaman</p>
      </footer>
    </div>
  );
}

export default App;
