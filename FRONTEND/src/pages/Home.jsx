import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { planets } from "../utils/astronomyData";

const FEATURES = [
  {
    icon: "O",
    title: "8 Hanh Tinh",
    desc: "Kham pha chi tiet tung hanh tinh trong He Mat Troi voi du lieu truc quan.",
  },
  {
    icon: "*",
    title: "Chom Sao",
    desc: "Tim hieu cac chom sao noi tieng, than thoai va mua quan sat tot nhat.",
  },
  {
    icon: "AI",
    title: "AI Chatbot",
    desc: "Dat cau hoi ve vu tru, CosmoBot se giai dap cac thac mac cua ban.",
  },
  {
    icon: "M",
    title: "Su Kien Thien Van",
    desc: "Cap nhat cac su kien thien van dang chu y va nhung hien tuong sap dien ra.",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="star-field" aria-hidden="true" />
        <div className="planet-orbit orbit-one" aria-hidden="true" />
        <div className="planet-orbit orbit-two" aria-hidden="true" />

        <div className="site-nav">
          <Link to="/" className="brand">
            <span className="brand-mark">CV</span>
            <span>CosmoVision</span>
          </Link>
          <div className="nav-links">
            <Link to="/planets">Planets</Link>
            <Link to="/constellation">Constellations</Link>
            <Link to="/login" className="nav-pill">
              Login
            </Link>
          </div>
        </div>

        <div className="hero-content">
          <div className="eyebrow">AI-Powered Astronomy Portal</div>
          <h1>
            Kham Pha <span>Vu Tru</span>
            <br />
            Cung AI
          </h1>
          <p>
            Portal thien van hoc thong minh: tim hieu hanh tinh, chom sao va dat cau hoi voi CosmoBot AI.
          </p>
          <div className="hero-actions">
            <Link to={user ? "/planets" : "/login"} className="btn btn-primary">
              {user ? "Kham pha ngay" : "Bat dau ngay"}
            </Link>
            <Link to="/constellation" className="btn btn-secondary">
              Xem chom sao
            </Link>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <p>Highlights</p>
          <h2>Tinh Nang Noi Bat</h2>
        </div>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section planet-preview">
        <div className="section-heading row-heading">
          <div>
            <p>Solar System</p>
            <h2>Hanh Tinh Trong He Mat Troi</h2>
          </div>
          <Link to="/planets">Xem tat ca</Link>
        </div>
        <div className="planet-grid">
          {planets.slice(0, 4).map((planet) => (
            <Link key={planet.id} to="/planets" className="planet-card">
              <img src={planet.image} alt={planet.name} />
              <div>
                <h3>{planet.name}</h3>
                <p>{planet.vietnamese}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
