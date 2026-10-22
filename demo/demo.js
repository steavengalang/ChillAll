// ChillAlert Demo - Main Logic
(function () {
    var framework = 'react';
    var language = 'typescript';
    var styling = 'tailwind';

    var labels = {
        react: 'React', nextjs: 'Next.js', vue: 'Vue', vanilla: 'Vanilla JS',
        typescript: 'TypeScript', javascript: 'JavaScript',
        tailwind: 'Tailwind', css: 'Custom CSS'
    };

    function updateCode() {
        var key = framework + '-' + language + '-' + styling;
        var code = window.codeTemplates[key] || 'Select a combination';
        document.getElementById('code-output').textContent = code;
        document.getElementById('combo-label').textContent =
            labels[framework] + ' + ' + labels[language] + ' + ' + labels[styling];
    }

    function setupSelector(id, varName) {
        var btns = document.querySelectorAll('#' + id + ' .selector-btn');
        btns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                btns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                if (varName === 'framework') framework = btn.dataset.value;
                if (varName === 'language') language = btn.dataset.value;
                if (varName === 'styling') styling = btn.dataset.value;
                updateCode();
            });
        });
    }

    // Setup selectors
    setupSelector('framework-options', 'framework');
    setupSelector('language-options', 'language');
    setupSelector('styling-options', 'styling');

    // Copy button
    document.getElementById('copy-btn').addEventListener('click', function () {
        var code = document.getElementById('code-output').textContent;
        navigator.clipboard.writeText(code);
        ChillAlert.toast({ text: 'Code copied!', type: 'success', duration: 2000 });
    });

    // Demo buttons
    document.getElementById('demo-alert').addEventListener('click', async function () {
        await ChillAlert.alert({ title: 'Success!', text: 'Operation completed.', icon: 'success' });
    });

    document.getElementById('demo-confirm').addEventListener('click', async function () {
        var result = await ChillAlert.confirm({ title: 'Are you sure?', text: 'This cannot be undone' });
        ChillAlert.toast({ text: result ? 'Confirmed!' : 'Cancelled', type: result ? 'success' : 'info' });
    });

    document.getElementById('demo-prompt').addEventListener('click', async function () {
        var name = await ChillAlert.prompt({ title: "What's your name?", placeholder: 'Enter name' });
        if (name) ChillAlert.toast({ text: 'Hello, ' + name + '!', type: 'success' });
    });

    document.getElementById('demo-toast').addEventListener('click', function () {
        ChillAlert.toast({ text: 'This is a toast!', type: 'info', duration: 3000 });
    });

    document.getElementById('demo-loading').addEventListener('click', async function () {
        var loader = ChillAlert.loading({ text: 'Loading...' });
        await new Promise(function (r) { setTimeout(r, 2000); });
        loader.close();
        ChillAlert.toast({ text: 'Done!', type: 'success' });
    });

    // Initial load
    updateCode();

    // Welcome toast
    setTimeout(function () {
        ChillAlert.toast({ text: 'Welcome! Select your stack above', type: 'info', duration: 3000 });
    }, 500);
})();
