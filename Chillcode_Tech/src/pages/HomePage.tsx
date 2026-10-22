import { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Showcase } from '../components/Showcase';
import { Components } from '../components/Components';
import { Features } from '../components/Features';
import { Footer } from '../components/Footer';

export function HomePage() {
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        document.title = 'ChillAll — 88 zero-dependency UI components in one install';
    }, []);

    return (
        <div className="app">
            <Navbar theme={theme} toggleTheme={toggleTheme} />
            <main>
                <Hero />
                <Showcase />
                <Components />
                <Features />
            </main>
            <Footer />
        </div>
    );
}
