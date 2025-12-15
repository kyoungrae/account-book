package com.kyoungtae.accountbook.service;

import com.kyoungtae.accountbook.model.Transaction;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Service
public class OcrService {

    public Transaction parseReceipt(MultipartFile file) {
        // TODO: Integrate actual OCR API here (e.g., Google Vision API, Tesseract)
        // Currently mocking the extraction for demonstration purposes.

        System.out.println("Processing file: " + file.getOriginalFilename());

        Transaction t = new Transaction();
        // Simulating extraction
        t.setDate(LocalDate.now().toString());
        t.setAmount(12500);
        t.setPlace("Restaurant Mock");
        t.setCategory("Food");
        t.setType("EXPENSE");

        return t;
    }
}
