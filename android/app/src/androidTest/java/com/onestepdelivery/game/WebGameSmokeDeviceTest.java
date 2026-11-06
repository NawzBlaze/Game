package com.onestepdelivery.game;

import android.view.View;
import android.graphics.Bitmap;
import java.io.File;
import java.io.FileOutputStream;
import android.view.MotionEvent;
import android.view.KeyEvent;
import android.view.InputDevice;
import android.os.SystemClock;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONObject;
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
    private static void capture(String name) throws Exception {
        Bitmap image=InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
        assertNotNull("Emulator screenshot unavailable",image);
        File file=new File(InstrumentationRegistry.getInstrumentation().getTargetContext().getFilesDir(),name);
        try(FileOutputStream output=new FileOutputStream(file)){assertTrue(image.compress(Bitmap.CompressFormat.PNG,100,output));}
        image.recycle();
    }
    private static void touch(ActivityScenario<MainActivity> scene,String selector,long holdMs) throws Exception {
        InstrumentationRegistry.getInstrumentation().waitForIdleSync();
        long focusDeadline=SystemClock.uptimeMillis()+10000;java.util.concurrent.atomic.AtomicBoolean focused=new java.util.concurrent.atomic.AtomicBoolean(false);
        while(!focused.get()&&SystemClock.uptimeMillis()<focusDeadline){scene.onActivity(a->focused.set(a.hasWindowFocus()));if(!focused.get())Thread.sleep(100);}
        assertTrue("App window did not gain focus before "+selector+"; active root="+InstrumentationRegistry.getInstrumentation().getUiAutomation().getRootInActiveWindow(),focused.get());
        CountDownLatch rendered=new CountDownLatch(1);
        scene.onActivity(a->{assertFalse("Activity unexpectedly finishing before "+selector,a.isFinishing());WebView w=find(a.findViewById(android.R.id.content));assertNotNull(w);w.postVisualStateCallback(SystemClock.uptimeMillis(),new WebView.VisualStateCallback(){@Override public void onComplete(long id){rendered.countDown();}});});
        assertTrue("WebView did not present updated UI",rendered.await(15,TimeUnit.SECONDS));
        JSONObject point=new JSONObject(js(scene,"(()=>{const r=document.querySelector('"+selector+"').getBoundingClientRect();return {x:(r.x+r.width/2)/innerWidth,y:(r.y+r.height/2)/innerHeight}})()"));
        AtomicReference<float[]> screenPoint=new AtomicReference<>();
        scene.onActivity(a->{WebView w=find(a.findViewById(android.R.id.content));int[] origin=new int[2];w.getLocationOnScreen(origin);screenPoint.set(new float[]{origin[0]+(float)point.optDouble("x")*w.getWidth(),origin[1]+(float)point.optDouble("y")*w.getHeight()});});
        assertTrue("Target outside WebView: "+selector+" "+point,point.optDouble("x")>0&&point.optDouble("x")<1&&point.optDouble("y")>0&&point.optDouble("y")<1);
        InstrumentationRegistry.getInstrumentation().waitForIdleSync();
        float[] xy=screenPoint.get();long downTime=SystemClock.uptimeMillis();
        MotionEvent down=MotionEvent.obtain(downTime,downTime,MotionEvent.ACTION_DOWN,xy[0],xy[1],0);down.setSource(InputDevice.SOURCE_TOUCHSCREEN);
        assertTrue("Touch-down injection failed",InstrumentationRegistry.getInstrumentation().getUiAutomation().injectInputEvent(down,true));down.recycle();
        Thread.sleep(holdMs);
        MotionEvent up=MotionEvent.obtain(downTime,SystemClock.uptimeMillis(),MotionEvent.ACTION_UP,xy[0],xy[1],0);up.setSource(InputDevice.SOURCE_TOUCHSCREEN);
        assertTrue("Touch-up injection failed",InstrumentationRegistry.getInstrumentation().getUiAutomation().injectInputEvent(up,true));up.recycle();
    }
    @Test public void offlineGameStartsPausesAndKeepsProgressThroughRecreation() throws Exception {
        try(ActivityScenario<MainActivity> scene=ActivityScenario.launch(MainActivity.class)) {
            await(scene,"!!document.querySelector('#advHome [data-action=play]') && !!window.ParcelRenderer && ParcelRenderer.ready()");
            assertEquals("false",js(scene,"!!window.__ADV_TEST__"));
            assertEquals("true",js(scene,"location.href==='file:///android_asset/index.html'"));
            assertEquals("true",js(scene,"!!document.querySelector('#advHome [data-progress=open]') && typeof NativeProgress.importBackup==='function'"));
            assertEquals("true",js(scene,"[...document.querySelectorAll('#advHome button')].filter(b=>b.getClientRects().length).every(b=>{const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1})"));
            capture("mobile-home.png");
            touch(scene,"#advHome [data-progress=open]",80);
            await(scene,"document.querySelector('#progressPanel').open");
            assertEquals("true",js(scene,"!document.querySelector('[data-progress=import]').hidden && document.querySelector('#progressFile').hidden"));
            InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
            await(scene,"!document.querySelector('#progressPanel').open");
            touch(scene,"#advHome [data-action=play]",80);
            await(scene,"!document.querySelector('#advGame').classList.contains('adv-hidden')");
            assertEquals("true",js(scene,"document.querySelector('#advCanvas').width>0 && document.querySelector('#advCanvas').height>0"));
            capture("mobile-game.png");
            double progress=Double.parseDouble(js(scene,"parseFloat(document.querySelector('#advProgress').style.width)||0"));
            touch(scene,"#advGame [data-control=right]",450);
            await(scene,"(parseFloat(document.querySelector('#advProgress').style.width)||0)>"+progress);
            touch(scene,"#advGame [data-action=pause]",80);
            await(scene,"!document.querySelector('#advDialog').classList.contains('adv-hidden')");
            assertEquals("true",js(scene,"[...document.querySelectorAll('#advCard button')].every(b=>{const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1})"));
            capture("mobile-pause.png");
            touch(scene,"#advCard [data-action=settings]",80);
            await(scene,"document.querySelector('#advCard').dataset.dialog==='settings'");
            InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
            await(scene,"document.querySelector('#advCard').dataset.dialog==='pause' && !document.querySelector('#advDialog').classList.contains('adv-hidden')");
            touch(scene,"#advCard [data-action=resume]",80);
            await(scene,"document.querySelector('#advDialog').classList.contains('adv-hidden')");
            String before=js(scene,"localStorage.getItem('delivery-adventure-v1')");
            assertNotEquals("null",before);
            scene.recreate();
            await(scene,"!!document.querySelector('#advHome [data-action=play]') && !!window.ParcelRenderer && ParcelRenderer.ready()");
            assertEquals("Progress changed on Activity recreation",before,js(scene,"localStorage.getItem('delivery-adventure-v1')"));
        }
    }
}
