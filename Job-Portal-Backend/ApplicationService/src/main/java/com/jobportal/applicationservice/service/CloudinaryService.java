package com.jobportal.applicationservice.service;

import java.io.File;
import java.io.IOException;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;
    
    public String uploadResume(MultipartFile file) throws IOException {

        
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty!");
        }

        if (file.getOriginalFilename() == null ||
            !file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("Only PDF files are allowed!");
        }

        // Security Hardening: Use Files.createTempFile for more secure permissions
        java.nio.file.Path tempPath = java.nio.file.Files.createTempFile("resume-", ".pdf");
        File tempFile = tempPath.toFile();
        tempFile.deleteOnExit(); 
        file.transferTo(tempPath);


        try {
        	Map<?, ?> uploadResult = cloudinary.uploader().upload(
        	        tempFile,
        	        ObjectUtils.asMap(
        	                "resource_type", "auto",
        	                "folder", "job-portal/resumes"
        	        )
        	);

            
            Object url = uploadResult.get("secure_url");
            if (url == null) {
                url = uploadResult.get("url");
            }
            if (url == null) {
                throw new RuntimeException("No URL returned from Cloudinary");
            }
            return url.toString();

        } 
        catch (Exception e) {
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }

        finally {
           
            if (tempFile.exists()) {
                tempFile.delete();
            }
        }
    }
}

