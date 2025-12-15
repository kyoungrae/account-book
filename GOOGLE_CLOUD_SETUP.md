# Google Cloud Vision API 설정 가이드

## 1. Google Cloud 프로젝트 생성 및 API 활성화

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "라이브러리"로 이동
4. "Cloud Vision API" 검색 후 활성화

## 2. 서비스 계정 키 생성

1. "API 및 서비스" > "사용자 인증 정보"로 이동
2. "사용자 인증 정보 만들기" > "서비스 계정" 선택
3. 서비스 계정 이름 입력 후 생성
4. "키" 탭에서 "키 추가" > "새 키 만들기" > "JSON" 선택
5. 다운로드된 JSON 파일을 프로젝트 루트에 저장 (예: `google-credentials.json`)

## 3. 환경 변수 설정

### macOS/Linux:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/절대경로/account-book/google-credentials.json"
```

### Windows:
```cmd
set GOOGLE_APPLICATION_CREDENTIALS=C:\절대경로\account-book\google-credentials.json
```

### 또는 application.properties에 추가:
```properties
spring.cloud.gcp.credentials.location=file:google-credentials.json
```

## 4. .gitignore에 추가
```
google-credentials.json
```

## 주의사항
- 서비스 계정 키 파일은 절대 Git에 커밋하지 마세요!
- 무료 할당량: 월 1,000건까지 무료
- 초과 시 비용 발생 가능

## OCR 작동 방식
1. 이미지 업로드 → Google Vision API로 텍스트 추출
2. 추출된 텍스트에서 날짜, 금액, 상호명 파싱
3. 자동으로 카테고리 분류
4. API 실패 시 자동으로 폴백 데이터 생성
