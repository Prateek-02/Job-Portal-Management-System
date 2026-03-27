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

       
        File tempFile = File.createTempFile("resume-", ".pdf");
        file.transferTo(tempFile);

        try {
        	Map<?, ?> uploadResult = cloudinary.uploader().upload(
        	        tempFile,
        	        ObjectUtils.asMap(
        	                "resource_type", "auto",
        	                "folder", "job-portal/resumes"
        	        )
        	);

            
            return uploadResult.get("secure_url").toString();

        } finally {
           
            if (tempFile.exists()) {
                tempFile.delete();
            }
        }
    }
}

