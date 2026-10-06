package com.warrantytracker;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.*;
import javax.imageio.*;
import javax.imageio.stream.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Component
class InvoiceValidator {
    static final int MAX_BYTES = 10 * 1024 * 1024;
    private static final long MAX_PIXELS = 20_000_000;
    record Image(byte[] bytes, String contentType, String extension, String filename) {}

    Image validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw bad("Choose a non-empty invoice image.");
        if (file.getSize() > MAX_BYTES)
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Invoice must be at most 10 MB.");
        String declared = Objects.toString(file.getContentType(), "").toLowerCase(Locale.ROOT);
        if (!Set.of("image/jpeg", "image/png", "image/webp").contains(declared))
            throw bad("Invoice must be a JPEG, PNG, or WebP image.");
        try (InputStream stream = file.getInputStream()) {
            byte[] bytes = stream.readNBytes(MAX_BYTES + 1);
            if (bytes.length > MAX_BYTES)
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Invoice must be at most 10 MB.");
            try (ImageInputStream input = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
                Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
                if (!readers.hasNext()) throw bad("Invoice is not a readable image.");
                ImageReader reader = readers.next();
                try {
                    reader.setInput(input, false, true);
                    String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                    String detected = switch (format) {
                        case "jpeg", "jpg" -> "image/jpeg";
                        case "png" -> "image/png";
                        case "webp" -> "image/webp";
                        default -> "";
                    };
                    if (!detected.equals(declared)) throw bad("Invoice content does not match its image type.");
                    int width = reader.getWidth(0), height = reader.getHeight(0);
                    if (width <= 0 || height <= 0 || width > 12000 || height > 12000 ||
                        (long) width * height > MAX_PIXELS) throw bad("Invoice dimensions exceed the 20 megapixel limit.");
                    if (reader.getNumImages(true) != 1) throw bad("Use a single still invoice image.");
                    BufferedImage source = reader.read(0);
                    boolean jpeg = detected.equals("image/jpeg");
                    BufferedImage sanitized = new BufferedImage(width, height,
                        jpeg ? BufferedImage.TYPE_INT_RGB : BufferedImage.TYPE_INT_ARGB);
                    Graphics2D graphics = sanitized.createGraphics();
                    try { graphics.drawImage(source, 0, 0, null); }
                    finally { graphics.dispose(); source.flush(); }
                    BoundedOutput output = new BoundedOutput();
                    // Decode and re-encode pixels; original metadata and trailing payloads are discarded.
                    try {
                        if (!ImageIO.write(sanitized, jpeg ? "jpeg" : "png", output))
                            throw bad("Invoice could not be processed.");
                    } finally { sanitized.flush(); }
                    return new Image(output.toByteArray(), jpeg ? "image/jpeg" : "image/png",
                        jpeg ? "jpg" : "png", filename(file.getOriginalFilename()));
                } finally { reader.dispose(); }
            }
        } catch (IOException | IllegalArgumentException ex) {
            throw bad("Invoice is corrupt or cannot be processed within the image limits.");
        }
    }
    private String filename(String original) {
        String name = Objects.toString(original, "invoice").replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "").trim();
        if (name.isEmpty()) name = "invoice";
        return name.substring(0, Math.min(name.length(), 255));
    }
    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
    private static class BoundedOutput extends ByteArrayOutputStream {
        @Override public synchronized void write(int value) {
            check(1); super.write(value);
        }
        @Override public synchronized void write(byte[] bytes, int offset, int length) {
            check(length); super.write(bytes, offset, length);
        }
        private void check(int length) {
            if ((long) count + length > MAX_BYTES)
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Processed invoice exceeds 10 MB. Use a smaller image.");
        }
    }
}

