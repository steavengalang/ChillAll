import './Footer.css';
import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-main">
                    <div className="footer-brand">
                        <a href="#" className="footer-logo">
                            <span className="logo-icon">❄️</span>
                            <span className="logo-text">ChillCode<span className="logo-highlight">Tech</span></span>
                        </a>
                        <p className="footer-tagline">
                            88 zero-dependency UI components that just work.
                        </p>
                        <div className="footer-social">
                            <a href="https://github.com/steavengalang" target="_blank" rel="noopener noreferrer" className="social-link">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                            <a href="https://npmjs.com/~chillcode" target="_blank" rel="noopener noreferrer" className="social-link">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331z" />
                                </svg>
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <div className="footer-column">
                            <h4 className="footer-column-title">Components</h4>
                            <Link to="/docs/alert" className="footer-link">Alert</Link>
                            <Link to="/docs/table" className="footer-link">Table</Link>
                            <Link to="/docs/form" className="footer-link">Form</Link>
                            <Link to="/docs/calendar" className="footer-link">Calendar</Link>
                            <Link to="/docs" className="footer-link">All 88 →</Link>
                        </div>

                        <div className="footer-column">
                            <h4 className="footer-column-title">Resources</h4>
                            <Link to="/docs" className="footer-link">Documentation</Link>
                            <Link to="/docs/guide/installation" className="footer-link">Installation</Link>
                            <a href="https://github.com/steavengalang/chillalert" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
                            <a href="https://npmjs.com/package/chillall" target="_blank" rel="noopener noreferrer" className="footer-link">NPM</a>
                        </div>

                        <div className="footer-column">
                            <h4 className="footer-column-title">Project</h4>
                            <span className="footer-link">MIT License</span>
                            <Link to="/docs/guide/migration" className="footer-link">Upgrade guide</Link>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="footer-copyright">
                        © 2024 ChillCode Tech. Built by{' '}
                        <a href="https://github.com/steavengalang" target="_blank" rel="noopener noreferrer">
                            @steavengalang
                        </a>
                    </p>
                    <p className="footer-made">
                        Made with ❄️ and ☕
                    </p>
                </div>
            </div>
        </footer>
    );
}
