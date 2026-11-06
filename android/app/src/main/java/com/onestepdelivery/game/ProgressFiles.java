package com.onestepdelivery.game;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

/** Bounded UTF-8 transport only. The game validates records before confirmed restore. */
final class ProgressFiles {
    static final int MAX_BYTES = 2_000_000;
    private ProgressFiles() {}

    static byte[] encode(String text) throws IOException {
        if (text == null || text.length() > MAX_BYTES) throw new IOException("Backup too large");
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        if (bytes.length == 0 || bytes.length > MAX_BYTES) throw new IOException("Invalid backup size");
        return bytes;
    }

    static String read(InputStream input) throws IOException {
        if (input == null) throw new IOException("Document unavailable");
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int count;
        while ((count = input.read(buffer)) != -1) {
            if (bytes.size() + count > MAX_BYTES) throw new IOException("Backup too large");
            bytes.write(buffer, 0, count);
        }
        if (bytes.size() == 0) throw new IOException("Empty backup");
        return StandardCharsets.UTF_8.newDecoder().decode(ByteBuffer.wrap(bytes.toByteArray())).toString();
    }

    static void write(OutputStream output, String text) throws IOException {
        if (output == null) throw new IOException("Document unavailable");
        output.write(encode(text));
        output.flush();
    }
}
