package com.onestepdelivery.game;

import android.app.Activity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.Button;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

/** Real WebView renderer failure test. Run only on a dedicated test device.
 *  Deliberately requests chrome://crash. Does not clear app data or progress. */
@RunWith(AndroidJUnit4.class)
public class RendererRecoveryDeviceTest {
    private static <T> T find(View v, Class<T> type) {
        if (type.isInstance(v)) return type.cast(v);
        if (v instanceof ViewGroup) {
            ViewGroup g=(ViewGroup)v;
            for(int i=0;i<g.getChildCount();i++) { T found=find(g.getChildAt(i),type); if(found!=null)return found; }
        }
        return null;
    }
    private static <T> T find(Activity a,Class<T> type){return find(a.findViewById(android.R.id.content),type);}
    private static String js(ActivityScenario<MainActivity> scene,String script) throws Exception {
        CountDownLatch done=new CountDownLatch(1); AtomicReference<String> value=new AtomicReference<>();
        scene.onActivity(a->{ WebView w=find(a,WebView.class); assertNotNull(w); w.evaluateJavascript(script, v->{value.set(v);done.countDown();}); });
        assertTrue("JavaScript did not respond",done.await(15,TimeUnit.SECONDS)); return value.get();
    }
    private static void awaitWebPage(ActivityScenario<MainActivity> scene) throws Exception {
        long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(30);
        while(System.nanoTime()<deadline){
            try { if("true".equals(js(scene,"document.readyState==='complete' && !!document.body")))return; }
            catch(AssertionError ignored) { /* page still starting */ }
            Thread.sleep(250);
        }
        fail("Page did not load in 30 seconds");
    }
    @Test public void crashedRendererCanBeRetriedWithoutChangingStorageOrigin() throws Exception {
        try(ActivityScenario<MainActivity> scene=ActivityScenario.launch(MainActivity.class)) {
            awaitWebPage(scene);
            js(scene,"localStorage.setItem('__lpc_recovery_test__','kept')");
            scene.onActivity(a->{WebView w=find(a,WebView.class);assertNotNull(w);w.loadUrl("chrome://crash");});
            long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(30);AtomicBoolean found=new AtomicBoolean(false);
            while(System.nanoTime()<deadline&&!found.get()) {
                scene.onActivity(a->{Button b=find(a,Button.class);found.set(b!=null&&"Try again".contentEquals(b.getText()));});
                if(!found.get()) Thread.sleep(250);
            }
            assertTrue("Renderer crash did not show retry",found.get());
            scene.onActivity(a->find(a,Button.class).performClick());
            awaitWebPage(scene);
            assertEquals("\"kept\"",js(scene,"localStorage.getItem('__lpc_recovery_test__')"));
            js(scene,"localStorage.removeItem('__lpc_recovery_test__')");
        }
    }
}
