
/* This guard deliberately uses ES5 syntax so very old Android WebViews can show
   a useful message instead of a partially rendered, non-interactive game. */
(function () {
  var supported;
  try {
    supported = !!(window.CSS && CSS.supports && CSS.supports('display', 'grid') &&
      CSS.supports('aspect-ratio', '1 / 1') && Array.prototype.flatMap &&
      Object.fromEntries && window.ResizeObserver);
  } catch (e) { supported = false; }
  if (!supported) document.addEventListener('DOMContentLoaded', function () {
    var panel = document.createElement('div'); panel.id = 'webviewUpdateNotice';
    panel.setAttribute('role', 'alert');
    panel.style.cssText = 'position:fixed;z-index:2147483647;left:0;right:0;top:0;bottom:0;overflow:auto;background:#f7f3e6;color:#244d46;font:16px/1.5 sans-serif;padding:24px;box-sizing:border-box';
    panel.innerHTML = '<div style="max-width:560px;margin:0 auto"><p style="font-weight:bold;color:#a25d31">LITTLE PARCEL CREW</p><h1 style="font-size:25px;line-height:1.2">Android WebView update needed</h1><p>This phone’s Android System WebView is too old to run the game. Please update <b>Android System WebView</b> in the Play Store, then reopen Little Parcel Crew. On some phones, updating Chrome may also be needed.</p><p>Your game saves are stored on the device. Do not uninstall the game to update WebView.</p></div>';
    document.body.appendChild(panel);
  });
}());

