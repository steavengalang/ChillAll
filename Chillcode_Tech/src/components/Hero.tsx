import './Hero.css';
import { Link } from 'react-router-dom';
import jsLogo from '../assets/js-logo.png';
import reactLogo from '../assets/react-logo.png';
import nextjsLogo from '../assets/nextjs-logo.png';
import vueLogo from '../assets/vue-logo.png';

export function Hero() {
    return (
        <section className="hero">
            {/* Background Effects */}
            <div className="hero-bg">
                <div className="hero-orb hero-orb-1"></div>
                <div className="hero-orb hero-orb-2"></div>
                <div className="hero-orb hero-orb-3"></div>
                <div className="hero-grid"></div>
                <div className="hero-noise"></div>
            </div>

            {/* Floating Tech Icons with Real Logos */}
            <div className="floating-icons">
                <div className="floating-icon floating-icon-1">
                    <div className="icon-glass icon-react">
                        <img src={reactLogo} alt="React" className="tech-logo" />
                    </div>
                    <span className="icon-label">React</span>
                </div>

                <div className="floating-icon floating-icon-2">
                    <div className="icon-glass icon-vue">
                        <img src={vueLogo} alt="Vue" className="tech-logo" />
                    </div>
                    <span className="icon-label">Vue</span>
                </div>

                <div className="floating-icon floating-icon-3">
                    <div className="icon-glass icon-js">
                        <img src={jsLogo} alt="Vanilla JS" className="tech-logo" />
                    </div>
                    <span className="icon-label">Vanilla JS</span>
                </div>

                <div className="floating-icon floating-icon-4">
                    <div className="icon-glass icon-nextjs">
                        <img src={nextjsLogo} alt="Next.js" className="tech-logo" />
                    </div>
                    <span className="icon-label">Next.js</span>
                </div>
            </div>

            <div className="hero-container">
                <div className="hero-badge animate-fade-in">
                    <div className="badge-glow"></div>
                    <span className="badge-dot"></span>
                    <span>Open Source & Free Forever</span>
                </div>

                <h1 className="hero-title animate-fade-in animate-delay-1">
                    Build with
                    <span className="hero-highlight"> Chill </span>
                    <br />
                    Components
                </h1>

                <p className="hero-subtitle animate-fade-in animate-delay-2">
                    88 accessible, dark-mode-ready UI components in one zero-dependency install.
                    The same code runs in plain HTML, React, Vue and Next.js.
                </p>

                <div className="hero-actions animate-fade-in animate-delay-3">
                    <Link to="/docs/guide/installation" className="hero-btn hero-btn-primary">
                        <span className="btn-glow"></span>
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                        Get Started
                    </Link>

                    <Link to="/docs" className="hero-btn hero-btn-docs">
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10,9 9,9 8,9" />
                        </svg>
                        View Docs
                    </Link>

                    <a href="https://github.com/steavengalang" target="_blank" rel="noopener noreferrer" className="hero-btn hero-btn-secondary">
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                    </a>
                </div>

                {/* Install Card */}
                <div className="hero-install-card animate-fade-in animate-delay-4">
                    <div className="install-header">
                        <div className="install-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span className="install-title">Terminal</span>
                    </div>
                    <div className="install-body">
                        <code className="install-code">
                            <span className="install-prompt">$</span>
                            npm install chillall
                        </code>
                        <button className="install-copy" onClick={() => navigator.clipboard.writeText('npm install chillall')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="hero-stats animate-fade-in animate-delay-5">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">0</span>
                            <span className="stat-label">Dependencies</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon stat-icon-blue">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">88</span>
                            <span className="stat-label">Components</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon stat-icon-purple">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20" />
                                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                            </svg>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">~4 KB</span>
                            <span className="stat-label">Gzip per component</span>
                        </div>
                    </div>
                </div>

                {/* Trusted By */}
                <div className="hero-trusted animate-fade-in animate-delay-5">
                    <div className="trusted-avatars">
                        <div className="avatar" style={{ background: 'linear-gradient(135deg, #22c55e, #3b82f6)' }}>C</div>
                        <div className="avatar" style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)' }}>D</div>
                        <div className="avatar" style={{ background: 'linear-gradient(135deg, #a855f7, #f59e0b)' }}>E</div>
                        <div className="avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #22c55e)' }}>+</div>
                    </div>
                    <span className="trusted-text">MIT licensed · 880+ automated tests · live docs</span>
                </div>
            </div>
        </section>
    );
}
