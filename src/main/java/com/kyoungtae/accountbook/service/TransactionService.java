package com.kyoungtae.accountbook.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.kyoungtae.accountbook.model.Transaction;
import org.springframework.stereotype.Service;

import java.io.*;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionService {

    private static final String DATA_FILE = "transactions.json";
    private final Gson gson = new Gson();

    public List<Transaction> getAllTransactions() {
        return loadData();
    }

    public Transaction addTransaction(Transaction transaction) {
        List<Transaction> transactions = loadData();
        if (transaction.getId() == null) {
            transaction.setId(UUID.randomUUID().toString());
        }
        transactions.add(transaction);
        saveData(transactions);
        return transaction;
    }

    public void deleteTransaction(String id) {
        List<Transaction> transactions = loadData();
        transactions.removeIf(t -> t.getId().equals(id));
        saveData(transactions);
    }

    private synchronized List<Transaction> loadData() {
        File file = new File(DATA_FILE);
        if (!file.exists()) {
            return new ArrayList<>();
        }
        try (Reader reader = new FileReader(file)) {
            Type listType = new TypeToken<ArrayList<Transaction>>() {
            }.getType();
            List<Transaction> data = gson.fromJson(reader, listType);
            return data != null ? data : new ArrayList<>();
        } catch (IOException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private synchronized void saveData(List<Transaction> transactions) {
        try (Writer writer = new FileWriter(DATA_FILE)) {
            gson.toJson(transactions, writer);
            syncWithGit();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void syncWithGit() {
        try {
            // Check if git is available and this is a repo
            ProcessBuilder check = new ProcessBuilder("git", "status");
            check.directory(new File("."));
            if (check.start().waitFor() != 0)
                return; // Not a git repo

            // Add, Commit, Push
            new ProcessBuilder("git", "add", DATA_FILE).start().waitFor();
            new ProcessBuilder("git", "commit", "-m", "Auto-save: Update transactions").start().waitFor();
            // Pushing might require auth, so we attempt it but don't crash if it fails
            // In a real app, we might need a more robust credential manager
            new ProcessBuilder("git", "push").start().waitFor();

        } catch (Exception e) {
            System.err.println("Git sync warning: " + e.getMessage());
        }
    }
}
