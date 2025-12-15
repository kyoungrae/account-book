# Smart Account Book

Trendy household account management service.

## Features
- **Dashboard**: Visualize income, expense, and balance.
- **Upload Receipt**: Extract text from receipt images (Date, Amount, Place, Category).
- **Statistics**: Interactive graphs.
- **Git Sync**: Automatically saves data to JSON and syncs with Git repository.

## Prerequisites
- Java 17 or higher
- IntelliJ IDEA (Recommended) or CLI with Gradle installed.

## How to Run

### Using IntelliJ IDEA
1. Open this folder as a project.
2. Wait for Gradle to sync.
3. Run `AccountBookApplication.main()`.

### Using CLI (if Gradle is installed)
```bash
gradle bootRun
```

## Configuration
- **Data Storage**: `transactions.json` in the project root.
- **Git Integration**: Ensure this folder is a valid Git repository.
  ```bash
  git init
  # Add remote if needed
  # git remote add origin <URL>
  ```
  The app will attempt to `git add`, `commit`, and `push` on every change.

## Project Structure
- Backend: Spring Boot 3.2 (Java 17)
- Frontend: Thymeleaf + HTML5 + CSS3 + jQuery + Axios
- Styling: Custom Glassmorphism Design
