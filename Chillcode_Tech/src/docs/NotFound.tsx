import { Link } from 'react-router-dom';
import { useDocTitle } from './data';

export function NotFound({ what = 'page' }: { what?: string }) {
    useDocTitle('Not found');
    return (
        <div className="dx-page">
            <div className="dx-notfound">
                <div className="dx-notfound-code">404</div>
                <h1 className="dx-h1">We couldn't find that {what}</h1>
                <p className="dx-lead">It may have been renamed. Try the search (<kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd>) or browse everything.</p>
                <div className="dx-actions">
                    <Link to="/docs" className="dx-btn dx-btn-primary">Browse components</Link>
                    <Link to="/" className="dx-btn">Home</Link>
                </div>
            </div>
        </div>
    );
}
