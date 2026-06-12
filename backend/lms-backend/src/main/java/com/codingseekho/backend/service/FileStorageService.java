package com.codingseekho.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {
    private final Path root;

    public FileStorageService(@Value("${app.upload-dir}") String uploadDir) throws IOException {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    public String store(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) return null;
        try {
            String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String safeName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path directory = root.resolve(folder).normalize();
            Files.createDirectories(directory);
            Path target = directory.resolve(UUID.randomUUID() + "-" + safeName).normalize();
            if (!target.startsWith(root)) throw new IllegalArgumentException("Invalid file path");
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return target.toString();
        } catch (IOException ex) {
            throw new IllegalArgumentException("Unable to save uploaded file");
        }
    }
}
