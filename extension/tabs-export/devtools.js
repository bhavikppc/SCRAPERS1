// devtools.js - Creates the DevTools panel

chrome.devtools.panels.create(
  'Export MD',
  '',
  'panel.html',
  function(panel) {
    console.log('Tabs Export panel created');
  }
);
