package com.onestepdelivery.game;

import android.app.Activity;
import android.content.Intent;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.DisplayCutout;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.KeyEvent;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ConsoleMessage;
import android.webkit.WebResourceError;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Native shell reconstructed from the shipped 0.16.1 APK and revised for recovery.
 *  The file:// asset origin is intentionally unchanged to preserve WebView localStorage.
 *  Renderer handling is a mitigation, not a confirmed fix for the Android 13 crash. */
public class MainActivity extends Activity {
    private static final String GAME_URL = "file:///android_asset/index.html";
    private static final String DIAG_TAG = "LPCDiagnostic";
    // Development-only diagnostic build: no save values, device identifiers or content are logged.
    private void logStage(String stage) {
        Runtime rt=Runtime.getRuntime();
        Log.i(DIAG_TAG, "stage=" + stage + " sdk=" + Build.VERSION.SDK_INT +
            " javaHeapUsed=" + (rt.totalMemory()-rt.freeMemory()) + " javaHeapMax=" + rt.maxMemory());
    }
    private void logWebViewProvider(WebView view) {
        try {
            android.content.pm.PackageInfo pkg=Build.VERSION.SDK_INT>=26?WebView.getCurrentWebViewPackage():null;
            Log.i(DIAG_TAG, "WebView provider=" + (pkg==null?"unknown":pkg.packageName+"/"+pkg.versionName) +
                " hardwareAccelerated=" + view.isHardwareAccelerated());
        } catch (RuntimeException e) { Log.w(DIAG_TAG, "Unable to read WebView provider", e); }
    }
    private void safeWebViewOperation(String stage, Runnable operation) {
        try { operation.run(); }
        catch (IllegalStateException e) { Log.e(DIAG_TAG, "WebView unavailable during " + stage, e); }
    }
    private static final int EXPORT_PROGRESS = 7201, IMPORT_PROGRESS = 7202;
    private final ExecutorService progressIo = Executors.newSingleThreadExecutor();
    private boolean progressBusy;
    private String pendingExport;
    private WebView progressOrigin;
    private FrameLayout root;
    private WebView webView;
    private int safeLeft, safeTop, safeRight, safeBottom;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        logStage("onCreate");
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams p = getWindow().getAttributes();
            p.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(p);
        }
        if (Build.VERSION.SDK_INT >= 30) getWindow().setDecorFitsSystemWindows(false);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(237, 247, 251));
        setContentView(root);
        immersive();
        openGame();
    }

    private void openGame() {
        logStage("openGame.begin");
        progressBusy = false; pendingExport = null; progressOrigin = null;
        root.removeAllViews();
        try {
            WebView view = new WebView(this);
            webView = view;
            view.setBackgroundColor(Color.rgb(228, 246, 255));
            view.getSettings().setJavaScriptEnabled(true);
            view.getSettings().setDomStorageEnabled(true);
            view.getSettings().setAllowFileAccess(true);
            view.getSettings().setAllowContentAccess(false);
            view.getSettings().setAllowUniversalAccessFromFileURLs(false);
            view.getSettings().setMediaPlaybackRequiresUserGesture(true);
            view.setWebChromeClient(new WebChromeClient() {
                @Override public boolean onConsoleMessage(ConsoleMessage m) {
                    // Diagnostic only: source/line and message may contain user data;
                    // logs must be reviewed/redacted before sharing.
                    if (m.messageLevel()==ConsoleMessage.MessageLevel.ERROR)
                        Log.e(DIAG_TAG, "JS " + m.sourceId() + ":" + m.lineNumber() + " " + m.message());
                    return super.onConsoleMessage(m);
                }
            });
            view.addJavascriptInterface(new OrientationBridge(), "NativeOrientation");
            view.addJavascriptInterface(new ProgressBridge(), "NativeProgress");
            view.setWebViewClient(new WebViewClient() {
                @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                    return !isLocalAsset(request.getUrl());
                }
                @SuppressWarnings("deprecation")
                @Override public boolean shouldOverrideUrlLoading(WebView v, String url) {
                    return !isLocalAsset(Uri.parse(url));
                }
                @Override public void onPageFinished(WebView v, String url) {
                    if (v == webView) { logStage("pageFinished"); logWebViewProvider(v); updateSafeArea(); }
                }
                @Override public void onReceivedError(WebView v, WebResourceRequest request, WebResourceError error) {
                    if (request.isForMainFrame()) Log.e(DIAG_TAG, "main-frame load error code=" + error.getErrorCode() + " " + error.getDescription());
                }
                @Override public boolean onRenderProcessGone(WebView failed, RenderProcessGoneDetail detail) {
                    if (Build.VERSION.SDK_INT >= 26) {
                        Log.e(DIAG_TAG, "WebView renderer stopped; didCrash=" + detail.didCrash() + " priority=" + detail.rendererPriorityAtExit());
                    } else {
                        Log.e(DIAG_TAG, "WebView renderer stopped (details unavailable)");
                    }
                    logStage("rendererGone");
                    // Returning true prevents Android from killing the whole app after a renderer death.
                    // A deliberate retry (not an unbounded automatic loop) preserves storage and avoids
                    // repeated crashes. This callback is used on API 26+ only.
                    if (failed == webView) {
                        webView = null;
                        root.removeView(failed);
                        failed.destroy();
                        showRecovery("The game display stopped unexpectedly. Try opening it again. If this keeps happening, update Android System WebView and Chrome.");
                    }
                    return true;
                }
            });
            view.setOnApplyWindowInsetsListener((v, insets) -> applyInsets(insets));
            root.addView(view, new FrameLayout.LayoutParams(-1, -1));
            logWebViewProvider(view);
            view.requestApplyInsets();
            view.loadUrl(GAME_URL);
        } catch (RuntimeException e) {
            Log.e("LittleParcelCrew", "Could not start WebView", e);
            if (webView != null) { WebView failed=webView; webView=null; root.removeView(failed); failed.destroy(); }
            showRecovery("The game display could not start. Please update Android System WebView and Chrome, then try again.");
        }
    }

    private static boolean isLocalAsset(Uri uri) {
        return uri != null && "file".equals(uri.getScheme()) && uri.getPath() != null && "/android_asset/index.html".equals(uri.getPath());
    }

    private void showRecovery(String explanation) {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER);
        int padding = Math.round(24 * getResources().getDisplayMetrics().density);
        panel.setPadding(padding, padding, padding, padding);
        TextView title = new TextView(this);
        title.setText("Little Parcel Crew");
        title.setTextColor(Color.rgb(32, 62, 83));
        title.setTextSize(23);
        title.setGravity(Gravity.CENTER);
        panel.addView(title);
        TextView body = new TextView(this);
        body.setText(explanation + "\n\nDo not uninstall the game or clear its data; that can erase your saved progress.");
        body.setTextColor(Color.rgb(32, 62, 83));
        body.setTextSize(16);
        body.setPadding(0, padding / 2, 0, padding / 2);
        body.setGravity(Gravity.CENTER);
        panel.addView(body);
        Button retry = new Button(this);
        retry.setText("Try again");
        retry.setOnClickListener(v -> openGame());
        panel.addView(retry);
        root.addView(panel, new FrameLayout.LayoutParams(-1, -1));
    }

    private final class OrientationBridge {
        @JavascriptInterface public void setMode(String mode) {
            if (!"classic".equals(mode) && !"adventure".equals(mode)) return;
            runOnUiThread(() -> setRequestedOrientation("classic".equals(mode)
                ? ActivityInfo.SCREEN_ORIENTATION_PORTRAIT : ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE));
        }
    }

    /** SAF grants access to one user-selected document, never broad storage access. */
    private final class ProgressBridge {
        @JavascriptInterface public void exportBackup(String text) {
            // Reject huge bridge input before retaining it in an Activity/UI closure.
            if (text == null || text.length() > ProgressFiles.MAX_BYTES) {
                runOnUiThread(() -> notifyProgress(webView, "error", "Backup exceeds the 2 MB limit."));
                return;
            }
            runOnUiThread(() -> requestProgressExport(text));
        }
        @JavascriptInterface public void importBackup() {
            runOnUiThread(() -> requestProgressImport());
        }
    }

    private boolean beginProgress() {
        if (webView == null || !isLocalAsset(Uri.parse(webView.getUrl() == null ? "" : webView.getUrl()))) return false;
        if (progressBusy) {
            notifyProgress(webView, "error", "A document operation is already open. Finish or cancel it first.");
            return false;
        }
        progressBusy = true;
        progressOrigin = webView;
        return true;
    }

    void requestProgressExport(String text) {
        if (!beginProgress()) return;
        try {
            ProgressFiles.encode(text); // Check UTF-8 bytes, not just character count.
            pendingExport = text;
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("application/json");
            intent.putExtra(Intent.EXTRA_TITLE, "little-parcel-crew-progress.json");
            startActivityForResult(intent, EXPORT_PROGRESS);
        } catch (IOException | RuntimeException error) {
            finishProgress("error", "Could not open a backup destination. Existing progress is unchanged.");
        }
    }

    void requestProgressImport() {
        if (!beginProgress()) return;
        try {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("*/*");
            intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
            startActivityForResult(intent, IMPORT_PROGRESS);
        } catch (RuntimeException error) {
            finishProgress("error", "Could not open the document picker. Existing progress is unchanged.");
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request != EXPORT_PROGRESS && request != IMPORT_PROGRESS) return;
        // A recreated Activity deliberately discards an unfinished operation. No restore is automatic.
        if (!progressBusy || progressOrigin != webView || isFinishing()) {
            progressBusy = false; pendingExport = null; progressOrigin = null; return;
        }
        if (result != RESULT_OK || data == null || data.getData() == null) {
            finishProgress("cancel", "File selection cancelled. Existing progress is unchanged.");
            return;
        }
        Uri uri = data.getData();
        if (!"content".equals(uri.getScheme())) {
            finishProgress("error", "Choose a document from the system file picker.");
            return;
        }
        final String exportText = pendingExport;
        final WebView origin = progressOrigin;
        progressIo.execute(() -> {
            String kind, text;
            try {
                if (request == EXPORT_PROGRESS) {
                    try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
                        ProgressFiles.write(output, exportText);
                    }
                    kind = "export"; text = "Backup saved to your selected document. Keep it safe before changing devices.";
                } else {
                    try (InputStream input = getContentResolver().openInputStream(uri)) {
                        text = ProgressFiles.read(input);
                    }
                    kind = "import";
                }
            } catch (IOException | RuntimeException error) {
                kind = "error";
                text = request == EXPORT_PROGRESS
                    ? "Backup could not be written. Do not rely on that file. Existing progress is unchanged."
                    : "Could not read this backup. Choose a UTF-8 JSON file smaller than 2 MB. Existing progress is unchanged.";
            }
            final String finalKind = kind, finalText = text;
            runOnUiThread(() -> {
                if (origin == webView && !isFinishing() && !isDestroyed()) finishProgress(finalKind, finalText);
            });
        });
    }

    private void finishProgress(String kind, String text) {
        WebView origin = progressOrigin;
        progressBusy = false; pendingExport = null; progressOrigin = null;
        notifyProgress(origin, kind, text);
    }

    private void notifyProgress(WebView origin, String kind, String text) {
        if (origin == null || origin != webView || isFinishing() || isDestroyed()) return;
        try {
            JSONObject detail = new JSONObject().put("kind", kind).put("text", text);
            // JSON-encode file content: never interpolate it as executable JavaScript/HTML.
            String script = "window.dispatchEvent(new CustomEvent('parcel-native-progress',{detail:" + detail + "}));";
            safeWebViewOperation("progress document result", () -> origin.evaluateJavascript(script, null));
        } catch (org.json.JSONException error) {
            Log.w(DIAG_TAG, "Could not deliver document result"); // Never log backup content/URI.
        }
    }

    private WindowInsets applyInsets(WindowInsets insets) {
        int left=0, top=0, right=0, bottom=0;
        if (Build.VERSION.SDK_INT >= 30) {
            Insets s = insets.getInsets(WindowInsets.Type.displayCutout() | WindowInsets.Type.systemGestures());
            left=s.left; top=s.top; right=s.right; bottom=s.bottom;
        } else {
            if (Build.VERSION.SDK_INT >= 29) {
                Insets s=insets.getSystemGestureInsets();
                left=s.left; top=s.top; right=s.right; bottom=s.bottom;
            }
            if (Build.VERSION.SDK_INT >= 28) {
                DisplayCutout c=insets.getDisplayCutout();
                if (c != null) {
                    left=Math.max(left,c.getSafeInsetLeft()); top=Math.max(top,c.getSafeInsetTop());
                    right=Math.max(right,c.getSafeInsetRight()); bottom=Math.max(bottom,c.getSafeInsetBottom());
                }
            }
        }
        safeLeft=left; safeTop=top; safeRight=right; safeBottom=bottom;
        updateSafeArea();
        return insets;
    }

    private void updateSafeArea() {
        if (webView == null) return;
        float d = getResources().getDisplayMetrics().density;
        String js="(function(){var s=document.documentElement.style;"+
            "s.setProperty('--native-safe-left','"+(safeLeft/d)+"px');"+
            "s.setProperty('--native-safe-top','"+(safeTop/d)+"px');"+
            "s.setProperty('--native-safe-right','"+(safeRight/d)+"px');"+
            "s.setProperty('--native-safe-bottom','"+(safeBottom/d)+"px');})()";
        webView.evaluateJavascript(js, null);
    }

    @SuppressWarnings("deprecation") private void immersive() {
        View decor=getWindow().getDecorView();
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c=decor.getWindowInsetsController();
            if (c != null) {
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                c.hide(WindowInsets.Type.systemBars());
                return;
            }
        }
        decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    @Override public void onWindowFocusChanged(boolean focused) { super.onWindowFocusChanged(focused); if(focused) immersive(); }
    // Consume the hardware Back pair before WebView can translate it into a
    // DOM key/navigation as well as Activity back. A single release routes once.
    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == KeyEvent.ACTION_UP && !event.isCanceled()) onBackPressed();
            return true;
        }
        return super.dispatchKeyEvent(event);
    }
    @SuppressWarnings("deprecation") @Override public void onBackPressed() {
        WebView current=webView;
        if(current == null) { super.onBackPressed(); return; }
        current.evaluateJavascript("window.gameBack ? window.gameBack() : false", result -> {
            if ((result == null || "false".equals(result) || "null".equals(result)) && !isFinishing()) MainActivity.super.onBackPressed();
        });
    }
    @Override protected void onPause() {
        logStage("onPause");
        WebView current=webView;
        if(current != null) {
            safeWebViewOperation("pause audio", () -> current.evaluateJavascript("window.pauseGameAudio && window.pauseGameAudio()", null));
            safeWebViewOperation("onPause", current::onPause);
        }
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume(); logStage("onResume"); immersive();
        WebView current=webView;
        if(current != null) {
            safeWebViewOperation("onResume", current::onResume);
            safeWebViewOperation("resume audio", () -> current.evaluateJavascript("window.resumeGameAudio && window.resumeGameAudio()", null));
        }
    }
    @Override protected void onDestroy() {
        logStage("onDestroy");
        progressIo.shutdownNow();
        pendingExport = null; progressOrigin = null;
        WebView current=webView; webView=null;
        if(current != null) { root.removeView(current); current.destroy(); }
        super.onDestroy();
    }
}
