'use strict';
/**
 * Category map for the ChillAll bundle. Order here = order in the bundle and in the docs.
 * Any component folder that exists on disk but is missing here ends up in "misc" (build warns).
 * Components listed here but missing on disk are skipped silently (so partial work still builds).
 */
module.exports = {
    version: '2.0.0',
    categories: {
        core: ['chillalert', 'chillform', 'chilltable', 'chillchart', 'chilldate', 'chillmodal', 'chillnotify'],
        formControls: [
            'chillbutton', 'chillinput', 'chilltextarea', 'chillselect', 'chilldropdown', 'chillcheckbox', 'chillradio', 'chillswitch',
            'chillslider', 'chillrating', 'chillotp', 'chillcolorpicker', 'chilltimepicker', 'chillnumberinput', 'chilltaginput',
            'chillautocomplete', 'chillsegmented'
        ],
        navigation: ['chillnavbar', 'chillsidebar', 'chillfooter', 'chillbreadcrumb', 'chilltabs', 'chilllayout', 'chillstepper', 'chillscrollspy', 'chillsplitter'],
        feedback: [
            'chilltooltip', 'chillpopover', 'chillaccordion', 'chillskeleton', 'chillemptystate', 'chillprogress', 'chillavatar', 'chillbadge', 'chilltag',
            'chilldrawer', 'chillcontextmenu', 'chillspinner', 'chillcallout', 'chilllightbox', 'chilltour', 'chillcopy', 'chillbacktotop', 'chillconfetti'
        ],
        display: [
            'chillcard', 'chilldivider', 'chilltimeline', 'chilltree', 'chillcarousel', 'chillstat', 'chillcalendar', 'chillcode',
            'chillmarquee', 'chillcountdown', 'chillkbd', 'chillmasonry', 'chillreveal', 'chillreltime'
        ],
        data: ['chillpagination', 'chillsearch', 'chillfilter', 'chillsort', 'chillinfinitescroll', 'chilldragdrop', 'chillfileupload', 'chillvirtuallist'],
        utility: [
            'chilltheme', 'chillcommand', 'chillhotkey', 'chillprovider', 'chillconfig', 'chillportal', 'chillfocustrap', 'chillclickoutside', 'chillmediaquery',
            'chillstorage', 'chillevents', 'chillfetch', 'chilltoolkit', 'chillanimate', 'chillfullscreen'
        ]
    }
};
