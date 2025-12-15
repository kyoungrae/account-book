# Tesseract OCR 설치 가이드

## 🎯 Tesseract란?
- **무료 오픈소스** OCR 엔진 (Google에서 개발)
- 클라우드 인증 불필요
- 로컬에서 완전히 작동
- 100개 이상의 언어 지원 (한국어 포함)

## 📦 설치 방법

### macOS (Homebrew 사용)
```bash
# Tesseract 설치
brew install tesseract

# 한국어 언어 데이터 설치
brew install tesseract-lang
```

### Windows
1. [Tesseract 설치 파일 다운로드](https://github.com/UB-Mannheim/tesseract/wiki)
2. 설치 시 "Additional language data" 옵션에서 **Korean** 선택
3. 환경 변수 PATH에 Tesseract 경로 추가 (예: `C:\Program Files\Tesseract-OCR`)

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install tesseract-ocr
sudo apt install tesseract-ocr-kor  # 한국어 언어 데이터
```

## ✅ 설치 확인
터미널에서 다음 명령어 실행:
```bash
tesseract --version
```

출력 예시:
```
tesseract 5.3.0
```

## 🔧 언어 데이터 확인
```bash
tesseract --list-langs
```

출력에 `kor` (한국어)가 포함되어 있어야 합니다.

## 📁 언어 데이터 수동 설치 (필요시)

언어 데이터가 없는 경우:

1. [Tesseract 언어 데이터 다운로드](https://github.com/tesseract-ocr/tessdata)
2. `kor.traineddata` 파일 다운로드
3. Tesseract의 `tessdata` 폴더에 복사:
   - **macOS**: `/usr/local/share/tessdata/` 또는 `/opt/homebrew/share/tessdata/`
   - **Windows**: `C:\Program Files\Tesseract-OCR\tessdata\`
   - **Linux**: `/usr/share/tesseract-ocr/5/tessdata/`

## 🚀 사용 방법

설치 후 애플리케이션을 재시작하면:
1. 영수증 이미지 업로드
2. Tesseract가 자동으로 텍스트 추출
3. 날짜, 금액, 상호명 자동 파싱
4. 거래 내역 생성

## 💡 참고사항

- **첫 실행 시**: Tesseract 초기화에 몇 초 소요될 수 있습니다
- **OCR 정확도**: 이미지 품질에 따라 달라집니다
  - 선명한 이미지: 90%+ 정확도
  - 흐린 이미지: 정확도 낮음
- **실패 시**: 자동으로 폴백 데이터 생성

## 🔍 문제 해결

### "Tesseract not found" 오류
- Tesseract가 설치되지 않았거나 PATH에 없음
- 위의 설치 방법 다시 확인

### 한국어 인식 안 됨
- 한국어 언어 데이터(`kor.traineddata`)가 없음
- 위의 언어 데이터 설치 방법 확인

### OCR 정확도가 낮음
- 이미지 품질 향상 (해상도, 밝기, 대비)
- 이미지 전처리 필요 시 별도 구현 가능
