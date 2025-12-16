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

    public synchronized Transaction addTransaction(Transaction transaction) {
        List<Transaction> transactions = loadData();
        if (transaction.getId() == null) {
            transaction.setId(UUID.randomUUID().toString());
        }
        transactions.add(transaction);
        saveData(transactions);
        return transaction;
    }

    public synchronized List<Transaction> addTransactions(List<Transaction> newTransactions) {
        List<Transaction> transactions = loadData();
        for (Transaction transaction : newTransactions) {
            if (transaction.getId() == null) {
                transaction.setId(UUID.randomUUID().toString());
            }
            transactions.add(transaction);
        }
        saveData(transactions);
        return newTransactions;
    }

    public synchronized Transaction updateTransaction(String id, Transaction updatedTransaction) {
        List<Transaction> transactions = loadData();
        for (int i = 0; i < transactions.size(); i++) {
            if (transactions.get(i).getId().equals(id)) {
                // Keep the ID, update other fields
                updatedTransaction.setId(id);
                transactions.set(i, updatedTransaction);
                saveData(transactions);
                return updatedTransaction;
            }
        }
        throw new RuntimeException("Transaction not found: " + id);
    }

    public synchronized void deleteTransaction(String id) {
        List<Transaction> transactions = loadData();
        transactions.removeIf(t -> t.getId().equals(id));
        saveData(transactions);
    }

    public synchronized void deleteTransactions(List<String> ids) {
        List<Transaction> transactions = loadData();
        transactions.removeIf(t -> ids.contains(t.getId()));
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
            // Git sync removed - now manual via sync button
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public synchronized void syncWithGit() {
        try {
            File projectDir = new File(".");

            // Check if git is available
            if (runCommand(projectDir, "git", "status").exitCode != 0) {
                System.err.println("Not a git repository");
                return;
            }

            // 0. Get current branch name
            String branch = runCommand(projectDir, "git", "symbolic-ref", "--short", "HEAD").output.trim();
            if (branch.isEmpty())
                branch = "main";

            System.out.println("Syncing on branch: " + branch);

            // 1. Load current local data (Backup in memory)
            List<Transaction> localData = loadData();

            // 2. Fetch remote changes
            runCommand(projectDir, "git", "fetch", "origin", branch);

            // 3. Read remote data directly from git object
            // This prevents overwriting local file and avoids conflicts
            CommandResult showResult = runCommand(projectDir, "git", "show", "origin/" + branch + ":" + DATA_FILE);
            String remoteJson = showResult.output;

            List<Transaction> remoteData = new ArrayList<>();
            if (showResult.exitCode == 0 && !remoteJson.trim().isEmpty()) {
                try {
                    Type listType = new TypeToken<ArrayList<Transaction>>() {
                    }.getType();
                    remoteData = gson.fromJson(remoteJson, listType);
                } catch (Exception e) {
                    System.err.println("Failed to parse remote JSON: " + e.getMessage());
                }
            }
            if (remoteData == null)
                remoteData = new ArrayList<>();

            // 4. Merge Data (Union by ID)
            // Strategy: Remote data first, then overwrite with Local data (Local changes
            // have priority)
            java.util.Map<String, Transaction> mergeMap = new java.util.HashMap<>();

            for (Transaction t : remoteData) {
                mergeMap.put(t.getId(), t);
            }
            for (Transaction t : localData) {
                mergeMap.put(t.getId(), t);
            }

            List<Transaction> mergedList = new ArrayList<>(mergeMap.values());
            System.out.println("Merged " + localData.size() + " local items and " + remoteData.size()
                    + " remote items into " + mergedList.size() + " items.");

            // 5. Save merged data to file
            saveData(mergedList);

            // 6. Add, Commit, Push
            runCommand(projectDir, "git", "add", DATA_FILE);

            // Commit only if there are changes
            CommandResult statusResult = runCommand(projectDir, "git", "status", "--porcelain");
            if (!statusResult.output.isEmpty()) {
                runCommand(projectDir, "git", "commit", "-m",
                        "Sync transactions: Smart merge of local and remote data");
            }

            // Pull --rebase to ensure we are up to date before pushing (though we just
            // merged)
            runCommand(projectDir, "git", "pull", "--rebase", "origin", branch);

            CommandResult pushResult = runCommand(projectDir, "git", "push", "origin", branch);
            if (pushResult.exitCode != 0) {
                throw new RuntimeException("Push failed: " + pushResult.error);
            }

            System.out.println("Successfully synced with Git (Smart Merge)");

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Git sync warning: " + e.getMessage());
        }
    }

    private static class CommandResult {
        int exitCode;
        String output;
        String error;

        CommandResult(int exitCode, String output, String error) {
            this.exitCode = exitCode;
            this.output = output;
            this.error = error;
        }
    }

    private CommandResult runCommand(File dir, String... command) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(dir);
        Process p = pb.start();

        StringBuilder output = new StringBuilder();
        StringBuilder error = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null)
                output.append(line).append("\n");
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(p.getErrorStream()))) {
            String line;
            while ((line = reader.readLine()) != null)
                error.append(line).append("\n");
        }

        int exitCode = p.waitFor();
        return new CommandResult(exitCode, output.toString(), error.toString());
    }
}
