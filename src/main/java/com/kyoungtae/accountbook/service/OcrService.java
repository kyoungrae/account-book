package com.kyoungtae.accountbook.service;

import com.kyoungtae.accountbook.model.Transaction;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
public class OcrService {

    public List<Transaction> parseReceipt(MultipartFile file) {
        // TODO: Integrate actual OCR API here (e.g., Google Vision API, Tesseract)
        // Currently generating random sample data based on file hash
        // In real implementation, this would extract multiple transactions from the
        // image

        System.out.println("Processing file: " + file.getOriginalFilename());

        // Use file size and name to generate different sample data for different images
        long seed = file.getSize() + file.getOriginalFilename().hashCode();
        Random random = new Random(seed);

        List<Transaction> transactions = new ArrayList<>();

        // Sample data pools
        String[][] sampleData = {
                { "쿠팡이츠 - 쿠팡", "Food", "19100" },
                { "올리브영신촌명물거리점", "Shopping", "19000" },
                { "티머니버스", "Transportation", "3000" },
                { "티머니지하철", "Transportation", "1550" },
                { "라운지93", "Food", "11500" },
                { "올리브영신촌종암점", "Shopping", "6300" },
                { "닭술신촌점", "Food", "25000" },
                { "모바일기후동화카드", "Shopping", "55000" },
                { "네이버페이", "Shopping", "20000" },
                { "스타벅스", "Food", "4500" },
                { "GS25편의점", "Food", "8900" },
                { "카카오택시", "Transportation", "12000" },
                { "CGV영화관", "Entertainment", "14000" },
                { "교보문고", "Shopping", "32000" }
        };

        // Generate 2-6 random transactions
        int numTransactions = 2 + random.nextInt(5);

        // Generate random date within last 30 days
        LocalDate baseDate = LocalDate.now().minusDays(random.nextInt(30));

        for (int i = 0; i < numTransactions; i++) {
            String[] data = sampleData[random.nextInt(sampleData.length)];

            Transaction t = new Transaction();
            t.setId(UUID.randomUUID().toString());
            t.setDate(baseDate.plusDays(random.nextInt(3)).toString()); // Spread across 3 days
            t.setPlace(data[0]);
            t.setCategory(data[1]);
            t.setAmount(Double.parseDouble(data[2]) + random.nextInt(1000)); // Add some variation
            t.setType("EXPENSE");

            transactions.add(t);
        }

        return transactions;
    }
}
