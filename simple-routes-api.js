// 전역 변수
let map;
let directionsRenderer;
let routePolylines = [];

// API 키 설정
const API_KEY = 'YOUR_API_KEY';

// 지도 초기화
function initMap() {
    // 기본 중심점: 도쿄, 일본
    const defaultCenter = { lat: 35.6762, lng: 139.6503 };

    // 지도 생성
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultCenter,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapId: "DEMO_MAP_ID"
    });

    // DirectionsRenderer 초기화 (기본 경로 표시용)
    directionsRenderer = new google.maps.DirectionsRenderer({
        draggable: true,
        panel: null
    });
    directionsRenderer.setMap(map);

    console.log('지도가 성공적으로 초기화되었습니다');
}

// Routes API를 사용한 경로 계산
async function computeRoute() {
    const originLat = parseFloat(document.getElementById('originLat').value);
    const originLng = parseFloat(document.getElementById('originLng').value);
    const destLat = parseFloat(document.getElementById('destLat').value);
    const destLng = parseFloat(document.getElementById('destLng').value);
    const travelMode = document.getElementById('travelMode').value;
    const routingPreference = document.getElementById('routingPreference').value;

    // 입력값 검증
    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
        alert('올바른 위도와 경도를 입력해주세요.');
        return;
    }

    // 로딩 상태 표시
    document.getElementById('routeResults').innerHTML = '<div class="loading">경로 계산 중...</div>';

    // 기존 폴리라인 제거
    clearPolylines();

    try {
        // 요청 본문 구성
        const requestBody = {
            origin: {
                location: {
                    latLng: {
                        latitude: originLat,
                        longitude: originLng
                    }
                }
            },
            destination: {
                location: {
                    latLng: {
                        latitude: destLat,
                        longitude: destLng
                    }
                }
            },
            travelMode: travelMode,
            routingPreference: routingPreference,
            computeAlternativeRoutes: true,
            routeModifiers: {
                avoidTolls: false,
                avoidHighways: false,
                avoidFerries: false
            },
            languageCode: "ko",
            units: "METRIC"
        };

        // API 요청
        const response = await fetch('http://mondrian-new.sphinfo.co.kr:8080/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.localizedValues,routes.description'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            displayRouteResults(data.routes);
            drawRoutesOnMap(data.routes, { lat: originLat, lng: originLng }, { lat: destLat, lng: destLng });

            console.log(`${data.routes.length}개의 경로를 찾았습니다`);
        } else {
            document.getElementById('routeResults').innerHTML =
                '<div class="empty-state">경로를 찾을 수 없습니다.</div>';
        }

    } catch (error) {
        console.error('경로 계산 오류:', error);
        document.getElementById('routeResults').innerHTML =
            '<div class="error-state">경로 계산 중 오류가 발생했습니다: ' + error.message + '</div>';
    }
}

// Routes API를 사용한 거리 매트릭스 계산
async function computeRouteMatrix() {
    const originsText = document.getElementById('origins').value.trim();
    const destinationsText = document.getElementById('destinations').value.trim();
    const travelMode = document.getElementById('matrixTravelMode').value;

    if (!originsText || !destinationsText) {
        alert('출발지와 도착지를 입력해주세요.');
        return;
    }

    // 로딩 상태 표시
    document.getElementById('matrixResults').innerHTML = '<div class="loading">매트릭스 계산 중...</div>';

    try {
        // 좌표 파싱
        const origins = parseCoordinates(originsText);
        const destinations = parseCoordinates(destinationsText);

        // 요청 본문 구성
        const requestBody = {
            origins: origins.map(coord => ({
                waypoint: {
                    location: {
                        latLng: {
                            latitude: coord.lat,
                            longitude: coord.lng
                        }
                    }
                }
            })),
            destinations: destinations.map(coord => ({
                waypoint: {
                    location: {
                        latLng: {
                            latitude: coord.lat,
                            longitude: coord.lng
                        }
                    }
                }
            })),
            travelMode: travelMode,
            languageCode: "ko",
            units: "METRIC"
        };

        // API 요청
        const response = await fetch('http://mondrian-new.sphinfo.co.kr:8080/distanceMatrix/v2:computeRouteMatrix', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status,condition'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();


        // 응답 구조 확인 및 적절한 필드 접근
        let matrixResults = data;
        if (data.results) {
            matrixResults = data.results;
        } else if (data.rows) {
            matrixResults = data.rows;
        } else if (Array.isArray(data)) {
            matrixResults = data;
        }

        if (matrixResults && matrixResults.length > 0) {
            displayMatrixResults(matrixResults, origins, destinations);
            console.log(`${matrixResults.length}개의 매트릭스 결과를 받았습니다`);
        } else {
            document.getElementById('matrixResults').innerHTML =
                '<div class="empty-state">매트릭스 결과가 없습니다.</div>';
        }

    } catch (error) {
        console.error('매트릭스 계산 오류:', error);
        document.getElementById('matrixResults').innerHTML =
            '<div class="error-state">매트릭스 계산 중 오류가 발생했습니다: ' + error.message + '</div>';
    }
}

// 좌표 문자열 파싱
function parseCoordinates(coordsText) {
    const lines = coordsText.split('\n');
    const coordinates = [];

    lines.forEach(line => {
        const parts = line.trim().split(',');
        if (parts.length === 2) {
            const lat = parseFloat(parts[0].trim());
            const lng = parseFloat(parts[1].trim());
            if (!isNaN(lat) && !isNaN(lng)) {
                coordinates.push({ lat, lng });
            }
        }
    });

    return coordinates;
}

// 경로 결과 표시
function displayRouteResults(routes) {
    const resultsContainer = document.getElementById('routeResults');
    resultsContainer.innerHTML = '';

    routes.forEach((route, index) => {
        const routeDiv = document.createElement('div');
        routeDiv.className = 'route-info';

        const distance = (route.distanceMeters / 1000).toFixed(2);
        const duration = formatDuration(route.duration);

        routeDiv.innerHTML = `
            <h4>경로 ${index + 1} ${route.description ? `(${route.description})` : ''}</h4>
            <div class="route-summary">
                <div class="summary-item">
                    <div class="label">거리</div>
                    <div class="value">${distance} km</div>
                </div>
                <div class="summary-item">
                    <div class="label">소요시간</div>
                    <div class="value">${duration}</div>
                </div>
            </div>
        `;

        // 단계별 안내 추가
        if (route.legs && route.legs.length > 0) {
            const stepsDiv = document.createElement('div');
            stepsDiv.className = 'route-steps';
            stepsDiv.innerHTML = '<h5>경로 안내:</h5>';

            route.legs.forEach(leg => {
                if (leg.steps) {
                    leg.steps.forEach(step => {
                        if (step.navigationInstruction && step.navigationInstruction.instructions) {
                            const stepDiv = document.createElement('div');
                            stepDiv.className = 'route-step';
                            stepDiv.innerHTML = step.navigationInstruction.instructions;
                            stepsDiv.appendChild(stepDiv);
                        }
                    });
                }
            });

            routeDiv.appendChild(stepsDiv);
        }

        resultsContainer.appendChild(routeDiv);
    });
}

// 매트릭스 결과 표시
function displayMatrixResults(matrixData, origins, destinations) {
    const resultsContainer = document.getElementById('matrixResults');


    // 매트릭스 테이블 생성
    let tableHTML = `
        <table class="matrix-table">
            <thead>
                <tr>
                    <th>출발지 → 도착지</th>
    `;

    destinations.forEach((dest, index) => {
        tableHTML += `<th>도착지 ${index + 1}<br><small>(${dest.lat.toFixed(4)}, ${dest.lng.toFixed(4)})</small></th>`;
    });

    tableHTML += `
                </tr>
            </thead>
            <tbody>
    `;

    origins.forEach((origin, originIndex) => {
        tableHTML += `
            <tr>
                <td><strong>출발지 ${originIndex + 1}</strong><br><small>(${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)})</small></td>
        `;

        destinations.forEach((dest, destIndex) => {
            // 다양한 응답 구조에 대응
            let result = null;

            // 1. 배열 형태로 인덱스 기반 접근
            if (Array.isArray(matrixData)) {
                result = matrixData.find(item => {
                    // originIndex와 destinationIndex 확인
                    if (item.originIndex === originIndex && item.destinationIndex === destIndex) {
                        return true;
                    }
                    // 또는 배열의 순서 기반
                    const expectedIndex = originIndex * destinations.length + destIndex;
                    return matrixData.indexOf(item) === expectedIndex;
                });
            }

            // 2. 중첩 배열 구조 (rows[originIndex].elements[destIndex])
            if (!result && matrixData[originIndex] && matrixData[originIndex].elements) {
                result = matrixData[originIndex].elements[destIndex];
            }

            // 3. 단순 배열 접근
            if (!result && matrixData[originIndex * destinations.length + destIndex]) {
                result = matrixData[originIndex * destinations.length + destIndex];
            }


            if (result) {
                // 상태 확인 - condition 필드 사용
                const condition = result.condition || 'UNKNOWN';
                const isRouteExists = condition === 'ROUTE_EXISTS';

                if (isRouteExists && result.distanceMeters && result.duration) {
                    // 거리 계산 (미터를 킬로미터로 변환)
                    const distance = (result.distanceMeters / 1000).toFixed(2);

                    // 시간 포맷팅
                    const duration = formatDuration(result.duration);

                    tableHTML += `
                        <td>
                            <div class="matrix-cell">
                                <span class="distance">${distance} km</span>
                                <span class="duration">${duration}</span>
                            </div>
                        </td>
                    `;
                } else {
                    tableHTML += `
                        <td>
                            <div class="matrix-cell">
                                <span class="error">경로 없음</span>
                                <small>상태: ${condition}</small>
                            </div>
                        </td>
                    `;
                }
            } else {
                tableHTML += `<td><div class="matrix-cell"><span class="error">결과 없음</span></div></td>`;
            }
        });

        tableHTML += '</tr>';
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    resultsContainer.innerHTML = tableHTML;
}

// 지도에 경로 그리기
function drawRoutesOnMap(routes, origin, destination) {
    const bounds = new google.maps.LatLngBounds();

    // 출발지와 도착지 마커 추가
    new google.maps.Marker({
        position: origin,
        map: map,
        title: '출발지',
        icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }
    });

    new google.maps.Marker({
        position: destination,
        map: map,
        title: '도착지',
        icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
    });

    bounds.extend(origin);
    bounds.extend(destination);

    // 경로 폴리라인 그리기
    routes.forEach((route, index) => {
        if (route.polyline && route.polyline.encodedPolyline) {
            const decodedPath = google.maps.geometry.encoding.decodePath(route.polyline.encodedPolyline);

            const polyline = new google.maps.Polyline({
                path: decodedPath,
                geodesic: true,
                strokeColor: index === 0 ? '#4285F4' : '#DB4437',
                strokeOpacity: index === 0 ? 1.0 : 0.7,
                strokeWeight: index === 0 ? 4 : 2
            });

            polyline.setMap(map);
            routePolylines.push(polyline);

            // 경로 경계 확장
            decodedPath.forEach(point => bounds.extend(point));
        }
    });

    // 지도 뷰 조정
    map.fitBounds(bounds);
}

// 폴리라인 제거
function clearPolylines() {
    routePolylines.forEach(polyline => {
        polyline.setMap(null);
    });
    routePolylines = [];
}

// 시간 포맷팅
function formatDuration(duration) {
    if (!duration) return 'N/A';

    // duration이 문자열 형태 "123s"인 경우 처리
    let seconds;
    if (typeof duration === 'string') {
        seconds = parseInt(duration.replace('s', ''));
    } else if (duration.seconds) {
        seconds = parseInt(duration.seconds);
    } else {
        return 'N/A';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}시간 ${minutes}분`;
    } else {
        return `${minutes}분`;
    }
}

// 현재 위치 설정
function setCurrentLocation(type) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                if (type === 'origin') {
                    document.getElementById('originLat').value = lat.toFixed(6);
                    document.getElementById('originLng').value = lng.toFixed(6);
                } else if (type === 'destination') {
                    document.getElementById('destLat').value = lat.toFixed(6);
                    document.getElementById('destLng').value = lng.toFixed(6);
                }

                // 지도 중심 이동
                map.setCenter({ lat, lng });
                map.setZoom(15);
            },
            (error) => {
                alert('현재 위치를 가져올 수 없습니다: ' + error.message);
            }
        );
    } else {
        alert('브라우저에서 위치 서비스를 지원하지 않습니다.');
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