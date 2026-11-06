package com.onestepdelivery.game;

import static org.junit.Assert.*;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.Test;

/** Actual stream bounds/encoding tests; not an Android document-provider approval. */
public class ProgressFilesTest {
    @Test public void roundTripsUnicodeAndScriptLikeTextAsData() throws Exception {
        String text = "{\"note\":\"नमस्ते \\u2028 </script> ' \\\"\"}";
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ProgressFiles.write(output, text);
        assertEquals(text, ProgressFiles.read(new ByteArrayInputStream(output.toByteArray())));
    }
    @Test public void acceptsExactByteLimitAndRejectsOverLimit() throws Exception {
        byte[] limit = new byte[ProgressFiles.MAX_BYTES];
        java.util.Arrays.fill(limit, (byte)'a');
        assertEquals(ProgressFiles.MAX_BYTES, ProgressFiles.read(new ByteArrayInputStream(limit)).length());
        assertThrows(IOException.class, () -> ProgressFiles.read(new ByteArrayInputStream(new byte[ProgressFiles.MAX_BYTES+1])));
        assertThrows(IOException.class, () -> ProgressFiles.encode("é".repeat(ProgressFiles.MAX_BYTES/2+1)));
    }
    @Test public void rejectsEmptyMissingAndMalformedUtf8() {
        assertThrows(IOException.class, () -> ProgressFiles.read(null));
        assertThrows(IOException.class, () -> ProgressFiles.read(new ByteArrayInputStream(new byte[0])));
        assertThrows(IOException.class, () -> ProgressFiles.read(new ByteArrayInputStream(new byte[]{(byte)0xc3,0x28})));
        assertThrows(IOException.class, () -> ProgressFiles.encode(null));
        assertThrows(IOException.class, () -> ProgressFiles.write(null, "{}"));
    }
    @Test public void propagatesWriteFailuresInsteadOfClaimingSuccess() {
        java.io.OutputStream broken = new java.io.OutputStream() {
            @Override public void write(int value) throws IOException { throw new IOException("disk full"); }
        };
        assertThrows(IOException.class, () -> ProgressFiles.write(broken, "{}"));
    }
}
