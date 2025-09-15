// 전역 변수
let map;
let infoWindow;
let textSearchMarkers = [];
let nearbySearchMarkers = [];

// API 키 설정
const API_KEY = 'YOUR_API_KEY';

// 지도 초기화
function initMap() {
    // 기본 중심점: 서울, 대한민국
    const defaultCenter = { lat: 37.5665, lng: 126.9780 };

    // 지도 생성
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultCenter,
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapId: "DEMO_MAP_ID",
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ]
    });

    // 정보창 생성
    infoWindow = new google.maps.InfoWindow();

    // 지도 클릭 리스너 추가 (주변 검색용)
    map.addListener('click', function(event) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        map.setCenter(event.latLng);
        performNearbySearch(lat, lng);
    });
}

// Places Web Service API를 사용한 텍스트 검색
async function performTextSearch() {
    const query = document.getElementById('textQuery').value.trim();
    const includedType = document.getElementById('includedType').value;

    if (!query) {
        alert('검색어를 입력해주세요.');
        return;
    }

    // 이전 텍스트 검색 마커 제거
    clearMarkers(textSearchMarkers);

    // 로딩 상태 표시
    document.getElementById('textResults').innerHTML = '<div class="loading">검색 중...</div>';

    try {
        // 요청 본문 구성
        const requestBody = {
            textQuery: query,
            pageSize: 10,
            languageCode: 'ko'
        };

        // 장소 유형 필터 추가
        if (includedType) {
            requestBody.includedType = includedType;
        }

        // 지도 중심 기준으로 location bias 설정
        const center = map.getCenter();
        requestBody.locationBias = {
            circle: {
                center: {
                    latitude: center.lat(),
                    longitude: center.lng()
                },
                radius: 50000.0
            }
        };

        // API 요청
        const response = await fetch('http://mondrian-new.sphinfo.co.kr:8080/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.currentOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.businessStatus,places.types,places.photos'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.places && data.places.length > 0) {
            displayTextSearchResults(data.places);
            await addMarkersToMap(data.places, textSearchMarkers, 'blue', 'T');

            // 첫 번째 결과로 지도 중심 이동
            const firstPlace = data.places[0];
            map.setCenter({
                lat: firstPlace.location.latitude,
                lng: firstPlace.location.longitude
            });

            console.log(`텍스트 검색에서 ${data.places.length}개의 장소를 찾았습니다`);
        } else {
            document.getElementById('textResults').innerHTML =
                '<div class="empty-state">검색 결과가 없습니다.</div>';
        }

    } catch (error) {
        console.error('텍스트 검색 오류:', error);
        document.getElementById('textResults').innerHTML =
            '<div class="empty-state">검색 중 오류가 발생했습니다.</div>';
    }
}

// Places Web Service API를 사용한 주변 검색
async function performNearbySearch(customLat = null, customLng = null) {
    const center = map.getCenter();
    const lat = customLat || center.lat();
    const lng = customLng || center.lng();
    const radius = parseInt(document.getElementById('radius').value) || 2000;
    const nearbyType = document.getElementById('nearbyType').value;
    const minRating = parseFloat(document.getElementById('minRating').value);

    // 이전 주변 검색 마커 제거
    clearMarkers(nearbySearchMarkers);

    // 로딩 상태 표시
    document.getElementById('nearbyResults').innerHTML = '<div class="loading">검색 중...</div>';

    try {
        // 요청 본문 구성
        const requestBody = {
            locationRestriction: {
                circle: {
                    center: {
                        latitude: lat,
                        longitude: lng
                    },
                    radius: radius
                }
            },
            maxResultCount: 20,
            languageCode: 'ko'
        };

        // 필터 추가
        if (nearbyType) {
            requestBody.includedTypes = [nearbyType];
        }

        if (minRating && minRating > 0) {
            requestBody.minRating = minRating;
        }

        // API 요청
        const response = await fetch('http://mondrian-new.sphinfo.co.kr:8080/v1/places:searchNearby', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.currentOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.businessStatus,places.types,places.photos'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.places && data.places.length > 0) {
            displayNearbySearchResults(data.places);
            await addMarkersToMap(data.places, nearbySearchMarkers, 'red', 'N');

            console.log(`주변 검색에서 ${data.places.length}개의 장소를 찾았습니다`);
        } else {
            document.getElementById('nearbyResults').innerHTML =
                '<div class="empty-state">주변에 검색 결과가 없습니다.</div>';
        }

    } catch (error) {
        console.error('주변 검색 오류:', error);
        document.getElementById('nearbyResults').innerHTML =
            '<div class="empty-state">주변 검색 중 오류가 발생했습니다.</div>';
    }
}

// 텍스트 검색 결과 표시
function displayTextSearchResults(places) {
    const resultsContainer = document.getElementById('textResults');
    resultsContainer.innerHTML = '';

    places.forEach((place, index) => {
        const resultElement = createResultElement(place, index, 'text');
        resultsContainer.appendChild(resultElement);
    });
}

// 주변 검색 결과 표시
function displayNearbySearchResults(places) {
    const resultsContainer = document.getElementById('nearbyResults');
    resultsContainer.innerHTML = '';

    places.forEach((place, index) => {
        const resultElement = createResultElement(place, index, 'nearby');
        resultsContainer.appendChild(resultElement);
    });
}

// 결과 요소 생성
function createResultElement(place, index, searchType) {
    const div = document.createElement('div');
    div.className = 'result-item';

    // 영업 상태 확인
    let statusElement = '';
    if (place.currentOpeningHours) {
        const isOpen = place.currentOpeningHours.openNow;
        if (isOpen === true) {
            statusElement = '<span class="place-status status-open">영업 중</span>';
        } else if (isOpen === false) {
            statusElement = '<span class="place-status status-closed">영업 종료</span>';
        } else {
            statusElement = '<span class="place-status status-unknown">영업시간 불명</span>';
        }
    } else {
        statusElement = '<span class="place-status status-unknown">영업시간 불명</span>';
    }

    // 평점 표시 생성
    const ratingElement = place.rating
        ? `<span class="place-rating">★ ${place.rating}</span>`
        : '<span class="place-rating">평점 없음</span>';

    // 타입 표시 생성
    const typesElement = place.types && place.types.length > 0
        ? `<div class="place-types">${place.types.slice(0, 3).join(', ')}</div>`
        : '';

    div.innerHTML = `
        <div class="place-name">${place.displayName?.text || '이름 없음'}</div>
        <div class="place-details">
            <div class="place-address">${place.formattedAddress || '주소 정보 없음'}</div>
            ${ratingElement}
            ${statusElement}
            ${typesElement}
        </div>
    `;

    // 클릭 이벤트 추가
    div.addEventListener('click', () => {
        const lat = place.location.latitude;
        const lng = place.location.longitude;
        map.setCenter({ lat, lng });
        map.setZoom(16);

        const markers = searchType === 'text' ? textSearchMarkers : nearbySearchMarkers;
        showPlaceDetails(place, markers[index]);
    });

    return div;
}

// 지도에 마커 추가
async function addMarkersToMap(places, markersArray, color, label) {
    // AdvancedMarkerElement 라이브러리 가져오기
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    places.forEach((place, index) => {
        const lat = place.location.latitude;
        const lng = place.location.longitude;

        // 마커 라벨 콘텐츠 생성
        const markerContent = document.createElement('div');
        markerContent.innerHTML = `
            <div style="
                background-color: ${color === 'blue' ? '#4285f4' : '#ea4335'};
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
                ${label}${index + 1}
            </div>
        `;

        const marker = new AdvancedMarkerElement({
            position: { lat, lng },
            map: map,
            title: place.displayName?.text || '이름 없음',
            content: markerContent
        });

        // 마커 클릭 리스너 추가
        marker.addListener('click', () => {
            showPlaceDetails(place, marker);
        });

        markersArray.push(marker);
    });
}

// 정보창에 장소 세부 정보 표시
function showPlaceDetails(place, marker) {
    // 내용 준비
    let content = `
        <div style="max-width: 300px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: #1a73e8; font-size: 16px;">
                ${place.displayName?.text || '이름 없음'}
            </h3>
    `;

    if (place.formattedAddress) {
        content += `<p style="margin: 5px 0;"><strong>주소:</strong> ${place.formattedAddress}</p>`;
    }

    if (place.rating) {
        content += `<p style="margin: 5px 0;"><strong>평점:</strong> <span style="color: #f4b400;">★ ${place.rating}</span></p>`;
    }

    if (place.nationalPhoneNumber) {
        content += `<p style="margin: 5px 0;"><strong>전화:</strong> ${place.nationalPhoneNumber}</p>`;
    }

    if (place.websiteUri) {
        content += `<p style="margin: 5px 0;"><strong>웹사이트:</strong> <a href="${place.websiteUri}" target="_blank" style="color: #1a73e8;">방문하기</a></p>`;
    }

    if (place.currentOpeningHours) {
        const isOpen = place.currentOpeningHours.openNow;
        const statusText = isOpen === true ? '영업 중' : isOpen === false ? '영업 종료' : '영업시간 불명';
        const statusColor = isOpen === true ? '#28a745' : isOpen === false ? '#dc3545' : '#6c757d';
        content += `<p style="margin: 5px 0;"><strong>영업상태:</strong> <span style="color: ${statusColor};">${statusText}</span></p>`;
    }

    if (place.businessStatus) {
        content += `<p style="margin: 5px 0;"><strong>상태:</strong> ${place.businessStatus}</p>`;
    }

    content += '</div>';

    // 정보창 표시
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

// 지도에서 마커 제거
function clearMarkers(markersArray) {
    markersArray.forEach(marker => {
        marker.setMap(null);
    });
    markersArray.length = 0;

    if (infoWindow) {
        infoWindow.close();
    }
}

// 오류 처리
window.addEventListener('error', function(event) {
    console.error('JavaScript 오류:', event.error);
});

// Google Maps API 인증 실패 처리기
window.gm_authFailure = function() {
    alert('Google Maps API 인증에 실패했습니다. API 키를 확인해주세요.');
    console.error('Google Maps API 인증 실패');
};