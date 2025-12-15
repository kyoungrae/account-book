package com.kyoungtae.accountbook.controller;

import com.kyoungtae.accountbook.model.Transaction;
import com.kyoungtae.accountbook.service.OcrService;
import com.kyoungtae.accountbook.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final OcrService ocrService;

    @GetMapping("/transactions")
    public List<Transaction> getTransactions() {
        return transactionService.getAllTransactions();
    }

    @PostMapping("/transactions")
    public Transaction addTransaction(@RequestBody Transaction transaction) {
        return transactionService.addTransaction(transaction);
    }

    @DeleteMapping("/transactions/{id}")
    public void deleteTransaction(@PathVariable String id) {
        transactionService.deleteTransaction(id);
    }

    @PostMapping("/transactions/delete-batch")
    public ResponseEntity<Void> deleteTransactionsBatch(@RequestBody List<String> ids) {
        transactionService.deleteTransactions(ids);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/upload")
    public ResponseEntity<List<Transaction>> uploadReceipt(@RequestParam("file") MultipartFile file) {
        List<Transaction> extractedTransactions = ocrService.parseReceipt(file);
        return ResponseEntity.ok(extractedTransactions);
    }

    @PostMapping("/transactions/batch")
    public ResponseEntity<List<Transaction>> addTransactionsBatch(@RequestBody List<Transaction> transactions) {
        List<Transaction> saved = transactionService.addTransactions(transactions);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncWithGit() {
        try {
            transactionService.syncWithGit();
            return ResponseEntity.ok("Git 동기화가 완료되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Git 동기화 실패: " + e.getMessage());
        }
    }
}
