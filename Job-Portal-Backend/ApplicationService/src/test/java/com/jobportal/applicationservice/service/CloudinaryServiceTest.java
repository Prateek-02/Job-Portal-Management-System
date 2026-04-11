package com.jobportal.applicationservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;

@ExtendWith(MockitoExtension.class)
class CloudinaryServiceTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @InjectMocks
    private CloudinaryService cloudinaryService;

    @BeforeEach
    void setUp() {
        lenient().when(cloudinary.uploader()).thenReturn(uploader);
    }

    @Test
    void uploadResume_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "test.pdf", "application/pdf", "data".getBytes());
        Map<String, Object> uploadResult = Map.of("secure_url", "http://res.com/pdf");

        when(uploader.upload(any(), anyMap())).thenReturn(uploadResult);

        String url = cloudinaryService.uploadResume(file);

        assertThat(url).isEqualTo("http://res.com/pdf");
    }

    @Test
    void uploadResume_EmptyFile_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile("resume", "", "application/pdf", new byte[0]);
        assertThatThrownBy(() -> cloudinaryService.uploadResume(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("File is empty!");
    }

    @Test
    void uploadResume_NonPdf_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile("resume", "test.txt", "text/plain", "data".getBytes());
        assertThatThrownBy(() -> cloudinaryService.uploadResume(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Only PDF files are allowed!");
    }

    @Test
    void uploadResume_CloudinaryError_ThrowsException() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "test.pdf", "application/pdf", "data".getBytes());
        
        when(uploader.upload(any(), anyMap())).thenThrow(new RuntimeException("Cloudinary down"));

        assertThatThrownBy(() -> cloudinaryService.uploadResume(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to upload file");
    }

    @Test
    void uploadResume_NullFile_ThrowsException() {
        assertThatThrownBy(() -> cloudinaryService.uploadResume(null))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("File is empty!");
    }

    @Test
    void uploadResume_NullFilename_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile("resume", null, "application/pdf", "data".getBytes());
        assertThatThrownBy(() -> cloudinaryService.uploadResume(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Only PDF files are allowed!");
    }

    @Test
    void uploadResume_InvalidExtension_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "test.txt", "text/plain", "data".getBytes());
        assertThatThrownBy(() -> cloudinaryService.uploadResume(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Only PDF files are allowed!");
    }

    @Test
    void uploadResume_FallbackUrl() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "test.pdf", "application/pdf", "data".getBytes());
        // secure_url is null, url is present
        Map<String, Object> uploadResult = Map.of("url", "http://res.com/pdf_fallback");

        when(uploader.upload(any(), anyMap())).thenReturn(uploadResult);

        String url = cloudinaryService.uploadResume(file);

        assertThat(url).isEqualTo("http://res.com/pdf_fallback");
    }

    @Test
    void uploadResume_BothUrlsNull_ThrowsException() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "test.pdf", "application/pdf", "data".getBytes());
        Map<String, Object> uploadResult = Map.of("other", "data");

        when(uploader.upload(any(), anyMap())).thenReturn(uploadResult);

        assertThatThrownBy(() -> cloudinaryService.uploadResume(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Failed to upload file");
    }
}
