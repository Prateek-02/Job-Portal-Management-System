package com.jobportal.applicationservice.service;

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
	
	public String uploadResume(MultipartFile file) throws IOException{
		
		//upload file to Cloudinary
		Map uploadResult = cloudinary.uploader().upload(
				file.getBytes(),
				ObjectUtils.asMap(
						"resource_type", "raw",//for PDF
						"folder" , "job-portal/resumes",
						"format", "pdf"
				)
		);
		
		// Return the URL
		return uploadResult.get("secure_url").toString();
				
	}
}
