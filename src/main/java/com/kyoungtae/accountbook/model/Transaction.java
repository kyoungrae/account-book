package com.kyoungtae.accountbook.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Transaction {
    private String id;
    private String date; // YYYY-MM-DD
    private double amount;
    private String category;
    private String place; // Sangyongcheo
    private String type; // INCOME or EXPENSE
}
