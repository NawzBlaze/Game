package com.onestepdelivery.game;

import static org.junit.Assert.*;
import android.app.Activity;
import android.view.View;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebView;
import android.widget.Button;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowWebView;
import static org.robolectric.Shadows.shadowOf;

/** JVM simulated Android framework tests, NOT real WebView or device tests. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk={29,33,36})
public class MainActivityTest {
    private static <T> T find(View view, Class<T> type) {
        if (type.isInstance(view)) return type.cast(view);
        if (view instanceof ViewGroup) {
            ViewGroup group=(ViewGroup)view;
            for (int i=0;i<group.getChildCount();i++) {
                T result=find(group.getChildAt(i),type);
                if(result!=null)return result;
            }
        }
        return null;
    }
    private static View content(Activity a){return a.findViewById(android.R.id.content);}
    @Test public void startsAtOriginalLocalStorageOriginAndBlocksRemoteNavigation() {
        MainActivity a=Robolectric.buildActivity(MainActivity.class).setup().get();
        WebView w=find(content(a),WebView.class); assertNotNull(w);
        assertEquals("file:///android_asset/index.html", shadowOf(w).getLastLoadedUrl());
        assertTrue(w.getSettings().getDomStorageEnabled());
        assertTrue(w.getSettings().getJavaScriptEnabled());
        assertTrue(w.getWebViewClient().shouldOverrideUrlLoading(w,"https://example.com/"));
        assertTrue(w.getWebViewClient().shouldOverrideUrlLoading(w,"file:///android_asset/../../data/secret"));
        assertFalse(w.getWebViewClient().shouldOverrideUrlLoading(w,"file:///android_asset/index.html"));
    }
    @Test public void rendererDeathGivesExplicitRetryAndSameAssetOrigin() {
        MainActivity a=Robolectric.buildActivity(MainActivity.class).setup().get();
        WebView old=find(content(a),WebView.class); assertNotNull(old);
        RenderProcessGoneDetail detail=new RenderProcessGoneDetail() {
            @Override public boolean didCrash(){return true;}
            @Override public int rendererPriorityAtExit(){return 0;}
        };
        assertTrue(old.getWebViewClient().onRenderProcessGone(old,detail));
        assertNull(find(content(a),WebView.class));
        Button retry=find(content(a),Button.class);assertNotNull(retry);assertEquals("Try again",retry.getText().toString());
        retry.performClick();
        WebView replacement=find(content(a),WebView.class);assertNotNull(replacement);assertNotSame(old,replacement);
        assertEquals("file:///android_asset/index.html",shadowOf(replacement).getLastLoadedUrl());
    }
    /** Simulates a destroyed/unusable view; does not prove the historical renderer crash cause. */
    static class UnavailableWebView extends WebView {
        UnavailableWebView(Activity a){super(a);}
        @Override public void evaluateJavascript(String script, android.webkit.ValueCallback<String> callback) {
            throw new IllegalStateException("diagnostic: view no longer usable");
        }
        @Override public void onPause(){throw new IllegalStateException("diagnostic: pause on unavailable view");}
        @Override public void onResume(){throw new IllegalStateException("diagnostic: resume on unavailable view");}
    }
    @Test public void lifecycleDoesNotCrashWhenWebViewBecomesUnavailable() throws Exception {
        MainActivity a=Robolectric.buildActivity(MainActivity.class).setup().get();
        java.lang.reflect.Field f=MainActivity.class.getDeclaredField("webView");f.setAccessible(true);
        WebView original=(WebView)f.get(a);UnavailableWebView unavailable=new UnavailableWebView(a);
        f.set(a,unavailable);
        try { a.onPause(); a.onResume(); }
        finally { f.set(a,original); unavailable.destroy(); }
    }

    static class BackCountingWebView extends WebView {
        int backCalls;
        BackCountingWebView(Activity a){super(a);}
        @Override public void evaluateJavascript(String script,android.webkit.ValueCallback<String> callback){
            if(script.contains("window.gameBack")){backCalls++;if(callback!=null)callback.onReceiveValue("true");}
        }
    }
    @Test public void hardwareBackPairRoutesToGameOnlyOnce() throws Exception {
        MainActivity a=Robolectric.buildActivity(MainActivity.class).setup().get();
        java.lang.reflect.Field field=MainActivity.class.getDeclaredField("webView");field.setAccessible(true);
        WebView original=(WebView)field.get(a);BackCountingWebView counting=new BackCountingWebView(a);field.set(a,counting);
        try {
            assertTrue(a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_BACK)));
            assertEquals(0,counting.backCalls);
            assertTrue(a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,KeyEvent.KEYCODE_BACK)));
            assertEquals(1,counting.backCalls);
        } finally {field.set(a,original);counting.destroy();}
    }

}
