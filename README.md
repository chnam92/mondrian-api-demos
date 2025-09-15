# Google Maps API 데모 체험하기 🗺️

이 프로젝트는 **고객이 Google Maps API를 쉽게 체험하고 학습할 수 있도록** 제작된 실습용 데모입니다.
Places API와 Routes API의 핵심 기능을 직관적인 웹 인터페이스로 경험해보세요.

## ⭐ 시작하기 전에 - 총괄 테스트 파일!

**`mondrian-test.html`** 파일은 **메인 테스트 파일**입니다!
- **모든 Google Maps API 기능을 한 곳에서 테스트** 가능
- Legacy API와 New API (v1/v2) 모두 지원
- 서버 상태 확인부터 고급 기능까지 원스톱 테스트
- **실제 API 동작을 확인하는 핵심 도구**

---

## 🎯 데모 목적

- **Google Maps Places API 기능 체험**: 텍스트 검색, 주변 검색, 실시간 결과 확인
- **Google Maps Routes API 기능 체험**: 경로 계산, 거리 매트릭스, 교통정보 연동
- **API 통합 테스트**: Legacy와 New API 버전 비교 체험
- **API 사용법 학습**: 실제 코드를 통한 구현 방법 이해
- **개발 참조**: 실제 프로젝트에 적용할 수 있는 코드 샘플 제공

---

## 🚀 빠른 시작

### 1단계: API 키 설정
```javascript
// 🧪 mondrian-test.html
// 페이지에서 API Key 입력 필드에 직접 입력

// 또는 다른 파일들에서
// simple-places-api.js 파일에서
const API_KEY = '여기에_실제_API_키_입력';

// simple-routes-api.js 파일에서
const API_KEY = '여기에_실제_API_키_입력';
```

### 2단계: 웹서버로 실행
```bash
# Python 사용 (포트 변경 가능)
python -m http.server 8000 

# Node.js 사용
npx serve .

# 브라우저에서 접속 - 메인 테스트 파일부터 시작!
http://localhost:8000/mondrian-test.html
# 또는 개별 데모 파일
http://localhost:8000/simple-places-api.html
http://localhost:8000/simple-routes-api.html
```

---

## 📋 체험 가능한 기능

### 🔍 Places API 데모 (`simple-places-api.html`)

#### **텍스트 검색 기능**
- **사용법**: 검색창에 "서울 카페", "도쿄 라멘" 등 자연어로 입력
- **필터링**: 장소 유형별 검색 (레스토랑, 카페, 병원 등)
- **결과**: 실시간 지도 마커 표시 및 상세 정보

#### **주변 검색 기능**
- **사용법**: 지도 클릭 또는 반경 설정으로 주변 장소 찾기
- **고급 필터**: 최소 평점, 현재 영업 중인 곳만 검색
- **인터랙션**: 마커 클릭시 상세 정보창 표시

### 🛣️ Routes API 데모 (`simple-routes-api.html`)

#### **경로 계산 기능**
- **사용법**: 출발지/도착지 좌표 입력으로 최적 경로 계산
- **이동 수단**: 자동차, 도보, 자전거, 대중교통 선택
- **교통 정보**: 실시간 교통상황 반영 옵션
- **시각화**: 지도에 경로 폴리라인 표시

#### **거리 매트릭스 기능**
- **사용법**: 여러 출발지와 도착지 간 거리/시간 일괄 계산
- **결과 형태**: 테이블 형태로 모든 조합의 거리/시간 표시
- **실용성**: 배송 최적화, 여행 계획 등에 활용 가능

---

## 🌍 지역 지원 정보

### Places API
✅ **전 세계 지원** - 어떤 지역이든 테스트 가능

### Routes API
⚠️ **지역 제한 있음**
- ✅ **지원 지역**: 일본, 미국, 유럽 등
- ❌ **미지원**: 한국
- 📍 **데모 설정**: 도쿄 좌표로 기본 설정됨

---

## 📁 프로젝트 구조

```
📦 Google Maps API 데모
├── 🧪 총괄 테스트 파일 (가장 중요!)
│   ├── mondrian-test.html        # API 통합 테스트 메인 페이지
│   ├── mondrian-test.js          # 모든 API 테스트 로직
│   └── mondrian-test.css         # 테스트 UI 스타일링
│
├── 🌟 Places API 데모
│   ├── simple-places-api.html    # Places API 메인 페이지
│   ├── simple-places-api.js      # Places API 로직 구현
│   └── simple-places-api.css     # Places API 스타일링
│
├── 🛣️ Routes API 데모
│   ├── simple-routes-api.html    # Routes API 메인 페이지
│   ├── simple-routes-api.js      # Routes API 로직 구현
│   └── simple-routes-api.css     # Routes API 스타일링
│
├── 🗺️ 기본 지도 로드 테스트
│   ├── simple-map-load.html      # 간단한 지도 로드 테스트
│   ├── simple-map-load.js        # 기본 지도 로딩 로직
│   └── simple-map-load.css       # 기본 지도 스타일
│
└── 📖 README.md
```

---

## 🛠️ 기술적 구현 특징

### **현대적 웹 기술 사용**
- **Web Service API**: REST API 방식의 최신 Google Maps API 활용
- **ES6+ JavaScript**: async/await, fetch API 등 모던 자바스크립트
- **AdvancedMarkerElement**: 최신 마커 라이브러리 사용
- **반응형 디자인**: 모바일/태블릿/데스크톱 모든 환경 지원

### **사용자 경험 최적화**
- **실시간 로딩 상태**: API 호출 중 로딩 애니메이션 표시
- **오류 처리**: 명확한 오류 메시지와 해결 방법 안내
- **인터랙티브 지도**: 클릭, 드래그, 줌 등 자유로운 조작
- **직관적 UI**: 초보자도 쉽게 사용할 수 있는 인터페이스

---

## 💡 학습 포인트

### **API 호출 방법**
```javascript
// Places API 텍스트 검색 예시
const response = await fetch('http://mondrian-new.sphinfo.co.kr:8080/v1/places:searchText', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location'
    },
    body: JSON.stringify({
        textQuery: "서울 카페",
        pageSize: 10
    })
});
```

### **마커 추가 방법**
```javascript
// AdvancedMarkerElement 사용
const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
const marker = new AdvancedMarkerElement({
    position: { lat: 37.5665, lng: 126.9780 },
    map: map,
    title: "서울"
});
```

---

## ⚠️ 실습 시 주의사항

### **API 키 관리**
- 실제 API 키를 코드에 하드코딩하지 마세요
- 개발 환경에서만 사용하고, 프로덕션에서는 환경변수 사용
- API 키에 적절한 제한(HTTP 리퍼러, IP 주소) 설정

### **사용량 모니터링**
- Google Cloud Console에서 API 사용량 확인
- 무료 할당량 초과 시 과금 발생 가능
- 테스트 시에는 적당한 횟수로 제한

### **지역별 테스트**
- Routes API는 지원 지역에서만 테스트
- Places API는 전 세계 어디든 테스트 가능
- 실제 서비스 지역을 고려한 테스트 필요

---

## 🎓 추천 학습 순서

1. **Places API 데모 체험** → 기본적인 장소 검색 이해
2. **Routes API 데모 체험** → 경로 계산과 매트릭스 기능 이해
3. **코드 분석** → 실제 구현 방법과 best practice 학습
4. **커스터마이징** → 필요에 맞게 코드 수정 및 확장
5. **실제 프로젝트 적용** → 학습한 내용을 실제 개발에 활용

---

## 📞 지원 및 문의

- **Google Maps API 문서**: [developers.google.com/maps](https://developers.google.com/maps)
- **Places API 가이드**: [Places API (New) 문서](https://developers.google.com/maps/documentation/places/web-service)
- **Routes API 가이드**: [Routes API 문서](https://developers.google.com/maps/documentation/routes)

---

**🎉 Google Maps API로 위치 기반 서비스의 무한한 가능성을 체험해보세요!**