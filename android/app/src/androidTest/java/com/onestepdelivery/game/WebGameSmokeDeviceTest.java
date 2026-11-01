package com.onestepdelivery.game;

import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

/** Real WebView smoke test on a disposable emulator; no private game hooks. */
@RunWith(AndroidJUnit4.class)
public class WebGameSmokeDeviceTest {
    private static WebView find(View v) {
        if(v instanceof WebView)return (WebView)v;
        if(v instanceof ViewGroup) {
            ViewGroup g=(ViewGroup)v;
            for(int i=0;i<g.getChildCount();i++){WebView w=find(g.getChildAt(i));if(w!=null)return w;}
        }
        return null;
    }
    private static String js(ActivityScenario<MainActivity> scene,String script) throws Exception {
        CountDownLatch done=new CountDownLatch(1);AtomicReference<String> value=new AtomicReference<>();
        scene.onActivity(a->{WebView w=find(a.findViewById(android.R.id.content));assertNotNull(w);w.evaluateJavascript(script,v->{value.set(v);done.countDown();});});
        assertTrue("WebView did not respond",done.await(15,TimeUnit.SECONDS));return value.get();
    }
    private static void await(ActivityScenario<MainActivity> scene,String expression) throws Exception {
        long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(45);
        while(System.nanoTime()<deadline){if("true".equals(js(scene,expression)))return;Thread.sleep(250);}
        fail("Timed out: "+expression);
    }
    @Test public void offlineGameStartsPausesAndKeepsProgressThroughRecreation() throws Exception {
        try(ActivityScenario<MainActivity> scene=ActivityScenario.launch(MainActivity.class)) {
            await(scene,"!!document.querySelector('#advHome [data-action=play]') && !!window.ParcelRenderer && ParcelRenderer.ready()");
            assertEquals("false",js(scene,"!!window.__ADV_TEST__"));
            assertEquals("true",js(scene,"location.href==='file:///android_asset/index.html'"));
            js(scene,"document.querySelector('#advHome [data-action=play]').click()");
            await(scene,"!document.querySelector('#advGame').classList.contains('adv-hidden')");
            assertEquals("true",js(scene,"document.querySelector('#advCanvas').width>0 && document.querySelector('#advCanvas').height>0"));
            js(scene,"document.querySelector('#advGame [data-action=pause]').click()");
            await(scene,"!document.querySelector('#advDialog').classList.contains('adv-hidden')");
            js(scene,"document.querySelector('#advCard [data-action=resume]').click()");
            await(scene,"document.querySelector('#advDialog').classList.contains('adv-hidden')");
            String before=js(scene,"localStorage.getItem('delivery-adventure-v1')");
            assertNotEquals("null",before);
            scene.recreate();
            await(scene,"!!document.querySelector('#advHome [data-action=play]') && !!window.ParcelRenderer && ParcelRenderer.ready()");
            assertEquals("Progress changed on Activity recreation",before,js(scene,"localStorage.getItem('delivery-adventure-v1')"));
        }
    }
}
