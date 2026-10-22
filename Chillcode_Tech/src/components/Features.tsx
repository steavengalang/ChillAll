import type { JSX } from 'react';
import './Features.css';

interface Feature {
    icon: JSX.Element;
    title: string;
    description: string;
    gradient: string;
}

const features: Feature[] = [
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
        ),
        title: 'Zero Dependencies',
        description: 'No React, Vue, or any framework required. Just pure JavaScript that works everywhere.',
        gradient: 'linear-gradient(135deg, #22c55e, #16a34a)'
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
        ),
        title: 'Framework Agnostic',
        description: 'Works identically in Vanilla JS, React, Vue, Next.js, Nuxt, and any JavaScript environment.',
        gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)'
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
        ),
        title: 'Dark Mode Ready',
        description: 'Follows the OS setting or <html data-theme>. One ChillTheme call switches every component.',
        gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)'
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </svg>
        ),
        title: 'Tiny Bundle Size',
        description: 'Tree-shakeable: one component is ~4 KB gzipped, not the whole library. Ship only what you use.',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
        ),
        title: 'Accessible',
        description: 'Full keyboard navigation, focus management, and ARIA labels baked in.',
        gradient: 'linear-gradient(135deg, #ec4899, #be185d)'
    },
    {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
        ),
        title: 'Typed',
        description: 'Generated TypeScript definitions ship in the box, so editors autocomplete every component.',
        gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)'
    }
];

export function Features() {
    return (
        <section id="features" className="features">
            <div className="features-container">
                <div className="section-header">
                    <span className="section-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="badge-icon">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        Why Choose Us
                    </span>
                    <h2 className="section-title">
                        Built for <span className="text-gradient">Simplicity</span>
                    </h2>
                    <p className="section-subtitle">
                        Every component follows the same principles: small, safe by default, accessible, and it just works.
                    </p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="feature-card">
                            <div className="feature-icon" style={{ background: feature.gradient }}>
                                {feature.icon}
                            </div>
                            <div className="feature-content">
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                            <div className="feature-arrow">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Code Showcase */}
                <div className="code-showcase">
                    <div className="showcase-header">
                        <h3 className="showcase-title">
                            <span className="text-gradient">Same API</span>, Any Framework
                        </h3>
                        <p className="showcase-subtitle">Write once, use everywhere. No wrapper needed.</p>
                    </div>

                    <div className="showcase-cards">
                        <div className="showcase-card">
                            <div className="card-header">
                                <div className="card-dots">
                                    <span></span><span></span><span></span>
                                </div>
                                <span className="card-lang" style={{ color: '#22c55e' }}>React / Vue / Next.js</span>
                            </div>
                            <pre className="card-code">
                                <code>{`const result = await ChillAlert.confirm({
  title: "Delete item?",
  text: "This action cannot be undone",
  confirmText: "Delete",
  cancelText: "Cancel"
});

if (result) {
  ChillAlert.toast({
    text: "Item deleted!",
    type: "success"
  });
}`}</code>
                            </pre>
                        </div>
                    </div>

                    <div className="showcase-badges">
                        <span className="tech-badge">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="tech-icon">
                                <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" />
                            </svg>
                            React
                        </span>
                        <span className="tech-badge">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="tech-icon">
                                <path d="M24,1.61H6.24L12,11.06,24,1.61ZM12,14.56,0,24l12-9.94,12,9.94Z" />
                            </svg>
                            Vue
                        </span>
                        <span className="tech-badge">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="tech-icon">
                                <path d="M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 01-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 00-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 00-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 01-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 01-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 01.174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 004.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 002.466-2.163 11.944 11.944 0 002.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 00-2.499-.523A33.119 33.119 0 0011.573 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 01.237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 01.233-.296c.096-.05.13-.054.5-.054z" />
                            </svg>
                            Next.js
                        </span>
                        <span className="tech-badge">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="tech-icon">
                                <path d="M12 0c6.628 0 12 5.373 12 12s-5.372 12-12 12S0 18.627 0 12 5.373 0 12 0zm-.041 4.5l-.165.014-.165.024-.161.035-.158.047-.153.058-.147.069-.14.08-.132.09-.123.101-.113.11-.102.12-.09.128-.078.136-.065.143-.052.149-.038.154-.024.159-.01.163v7.844l-3.152-1.837-.104-.051-.15-.061-.156-.045-.16-.03-.163-.013-.165.004-.163.022-.16.039-.155.057-.149.074-.14.09-.131.106-.12.12-.107.134-.093.146-.078.156-.062.165-.045.173-.028.178-.01.18.009.183.027.18.046.176.064.169.081.162.097.152.112.14.127.127.14.112.153.096.163.078.173.059.18.039.185.019.187-.002.188-.022.184-.043.177-.063.168-.083.033-.02 6.343 3.695.144.074.153.066.159.054.163.041.166.027.168.012.168-.004.165-.02.161-.037.155-.053.149-.07.14-.084.13-.1.12-.113.107-.125.094-.138.079-.148.064-.158.047-.166.03-.172.013-.176-.005-.178-.022-.178-.04-.174V8.11l-.053-.167-.07-.16-.085-.152-.1-.143-.116-.131-.13-.118-.143-.104-.154-.09-.164-.074-.171-.057-.176-.04-.178-.023zM8.708 11.91v4.917l3.158 1.84V13.75l-3.158-1.84z" />
                            </svg>
                            Nuxt
                        </span>
                        <span className="tech-badge">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="tech-icon">
                                <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z" />
                            </svg>
                            Vanilla JS
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
