import type { CategoryMeta } from './types';

export const categories: CategoryMeta[] = [
    { id: 'core', title: 'Core', blurb: 'The essentials: alerts, forms, tables, charts, dates, modals and notifications.' },
    { id: 'formControls', title: 'Form controls', blurb: 'Buttons, inputs, pickers and every control a form needs.' },
    { id: 'navigation', title: 'Navigation', blurb: 'Navbars, sidebars, tabs, steppers and page structure.' },
    { id: 'feedback', title: 'Feedback & overlays', blurb: 'Tooltips, drawers, menus, spinners, tours and friendly little moments.' },
    { id: 'display', title: 'Display', blurb: 'Cards, timelines, trees, calendars, carousels and ways to show content.' },
    { id: 'data', title: 'Data', blurb: 'Paging, search, filter, sort, upload and 100k-row virtual lists.' },
    { id: 'utility', title: 'Utilities', blurb: 'Theme, command palette, hotkeys, storage, fetch and other building blocks.' },
];

/** Components that are brand new in ChillAll 2.0 (get a "New" badge). */
export const NEW_IDS = new Set([
    'slider', 'rating', 'otp', 'colorpicker', 'timepicker', 'numberinput', 'taginput', 'autocomplete', 'segmented',
    'drawer', 'contextmenu', 'spinner', 'callout', 'lightbox', 'tour', 'copy', 'backtotop', 'confetti',
    'card', 'divider', 'timeline', 'tree', 'carousel', 'stat', 'calendar', 'code', 'marquee', 'countdown', 'kbd', 'masonry', 'reveal', 'reltime',
    'stepper', 'scrollspy', 'splitter', 'virtuallist',
    'storage', 'events', 'fetch', 'toolkit', 'animate', 'fullscreen',
]);

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
