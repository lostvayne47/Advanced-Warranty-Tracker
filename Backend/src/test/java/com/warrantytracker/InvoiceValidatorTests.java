package com.warrantytracker;

import java.awt.image.BufferedImage;
import java.io.*;
import java.util.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;

class InvoiceValidatorTests {
    final InvoiceValidator validator = new InvoiceValidator();

    @Test void jpegAndPngAreDecodedAndReencodedWithoutTrailingPayload() throws Exception {
        for (String format : List.of("jpeg", "png")) {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            ImageIO.write(new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB), format, bytes);
            bytes.write("UNTRUSTED_TRAILING_PAYLOAD".getBytes());
            InvoiceValidator.Image image = validator.validate(new MockMultipartFile(
                "invoiceImage", "C:\\fakepath\\receipt." + format, "image/" + format, bytes.toByteArray()));
            assertThat(image.filename()).isEqualTo("receipt." + format);
            assertThat(new String(image.bytes(), java.nio.charset.StandardCharsets.ISO_8859_1)).doesNotContain("UNTRUSTED_TRAILING_PAYLOAD");
            assertThat(ImageIO.read(new ByteArrayInputStream(image.bytes())).getWidth()).isEqualTo(8);
        }
    }
    @Test void webpIsDecodedAndStoredAsSanitizedPng() throws Exception {
        byte[] webp = Base64.getDecoder().decode("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA");
        InvoiceValidator.Image image = validator.validate(new MockMultipartFile("invoiceImage", "receipt.webp", "image/webp", webp));
        assertThat(image.contentType()).isEqualTo("image/png");
        assertThat(image.extension()).isEqualTo("png");
        assertThat(ImageIO.read(new ByteArrayInputStream(image.bytes())).getWidth()).isEqualTo(1);
    }
    @Test void excessivePixelDimensionsAreRejectedBeforeDecoding() throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(4, 3, BufferedImage.TYPE_INT_RGB), "png", output);
        byte[] image = output.toByteArray();
        // PNG IHDR width is bytes 16..19. This must fail without allocating that raster.
        java.nio.ByteBuffer.wrap(image, 16, 4).putInt(100000);
        assertThatThrownBy(() -> validator.validate(new MockMultipartFile("invoiceImage", "huge.png", "image/png", image)))
            .isInstanceOf(ResponseStatusException.class);
    }
}
