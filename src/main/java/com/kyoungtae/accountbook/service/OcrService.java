package com.kyoungtae.accountbook.service;

import com.kyoungtae.accountbook.model.Transaction;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class OcrService {

    public List<Transaction> parseReceipt(MultipartFile file) {
        // TODO: Integrate actual OCR API here (e.g., Google Vision API, Tesseract)
        // Currently mocking the extraction for demonstration purposes.
        // In real implementation, this would extract multiple transactions from the
        // image

        System.out.println("Processing file: " + file.getOriginalFilename());

        List<Transaction> transactions = new ArrayList<>();

        // Simulating multiple transactions extracted from one receipt image
        // Example based on the uploaded image showing multiple transactions on
        // 2025-11-01

        Transaction t1 = new Transaction();
        t1.setId(UUID.randomUUID().toString());
        t1.setDate("2025-11-01");
        t1.setAmount(19100);
        t1.setPlace("쿠팡이츠 - 쿠팡");
        t1.setCategory("Food");
        t1.setType("EXPENSE");
        transactions.add(t1);

        Transaction t2 = new Transaction();
        t2.setId(UUID.randomUUID().toString());
        t2.setDate("2025-11-01");
        t2.setAmount(19000);
        t2.setPlace("올리브영신촌명물거리점");
        t2.setCategory("Shopping");
        t2.setType("EXPENSE");
        transactions.add(t2);

        Transaction t3 = new Transaction();
        t3.setId(UUID.randomUUID().toString());
        t3.setDate("2025-11-01");
        t3.setAmount(3000);
        t3.setPlace("티머니버스");
        t3.setCategory("Transportation");
        t3.setType("EXPENSE");
        transactions.add(t3);

        Transaction t4 = new Transaction();
        t4.setId(UUID.randomUUID().toString());
        t4.setDate("2025-11-01");
        t4.setAmount(1550);
        t4.setPlace("티머니지하철");
        t4.setCategory("Transportation");
        t4.setType("EXPENSE");
        transactions.add(t4);

        return transactions;
    }
}
