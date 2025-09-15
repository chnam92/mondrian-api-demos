let resultCounter = 0;

// 이전에 검색된 마커들을 저장하기 위한 전역 변수
window.currentPlaceMarker = null;
window.searchMarkers = [];

// 공통 함수
function getApiKey() {
  const apiKey = document.getElementById("apiKey").value.trim();
  const clientId = document.getElementById("clientId").value.trim();

  if (!apiKey && !clientId) {
    alert("API Key 또는 Client ID를 입력해주세요.");
    return null;
  }
  return apiKey || clientId;
}

function getAuthParam() {
  const apiKey = document.getElementById("apiKey").value.trim();
  const clientId = document.getElementById("clientId").value.trim();

  if (apiKey) {
    return `key=${encodeURIComponent(apiKey)}`;
  } else if (clientId) {
    return `client=${encodeURIComponent(clientId)}`;
  }
  return null;
}

function getServerUrl() {
  return (
    document.getElementById("serverUrl").value.trim() || "http://mondrian-new.sphinfo.co.kr:8080"
  );
}

function addResult(title, url, response, isError = false, duration = 0) {
  resultCounter++;
  const resultsDiv = document.getElementById("results");
  const resultItem = document.createElement("div");
  resultItem.className = `result-item ${isError ? "error" : "success"}`;
  resultItem.innerHTML = `
            <div class="title">
                <span class="status-indicator ${isError ? "status-error" : "status-success"}"></span>
                ${resultCounter}. ${title} ${duration > 0 ? `(${duration}ms)` : ""}
            </div>
            <div class="content">URL: ${url}
            
응답:
${typeof response === "object" ? JSON.stringify(response, null, 2) : response}</div>
        `;
  resultsDiv.insertBefore(resultItem, resultsDiv.firstChild);
}

function addLoadingResult(title, url) {
  resultCounter++;
  const resultsDiv = document.getElementById("results");
  const resultItem = document.createElement("div");
  resultItem.className = "result-item loading";
  resultItem.id = `loading-${resultCounter}`;
  resultItem.innerHTML = `
            <div class="title">
                <span class="status-indicator status-loading"></span>
                ${resultCounter}. ${title} - 요청 중...
            </div>
            <div class="content">URL: ${url}
            
응답 대기 중...</div>
        `;
  resultsDiv.insertBefore(resultItem, resultsDiv.firstChild);
  return resultCounter;
}

function updateLoadingResult(
  id,
  title,
  url,
  response,
  isError = false,
  duration = 0
) {
  const loadingItem = document.getElementById(`loading-${id}`);
  if (loadingItem) {
    loadingItem.className = `result-item ${isError ? "error" : "success"}`;
    loadingItem.id = "";
    loadingItem.innerHTML = `
                <div class="title">
                    <span class="status-indicator ${isError ? "status-error" : "status-success"}"></span>
                    ${id}. ${title} ${duration > 0 ? `(${duration}ms)` : ""}
                </div>
                <div class="content">URL: ${url}
                
응답:
${typeof response === "object" ? JSON.stringify(response, null, 2) : response}</div>
            `;
  }
}

async function makeApiCall(url, title) {
  const loadingId = addLoadingResult(title, url);
  const startTime = Date.now();

  try {
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    const data = await response.json();

    if (response.ok) {
      updateLoadingResult(loadingId, title, url, data, false, duration);
    } else {
      updateLoadingResult(loadingId, title, url, data, true, duration);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    updateLoadingResult(
      loadingId,
      title,
      url,
      `오류: ${error.message}`,
      true,
      duration
    );
  }
}

function clearResults() {
  document.getElementById("results").innerHTML = "";
  resultCounter = 0;
}

// 서버 상태 확인
async function checkHealth() {
  const serverUrl = getServerUrl();
  const url = `${serverUrl}/health`;
  const loadingId = addLoadingResult("서버 상태 확인", url);
  const startTime = Date.now();

  try {
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    const data = await response.json();

    const healthStatus = document.getElementById("healthStatus");
    healthStatus.style.display = "block";

    if (response.ok && data.status === "OK") {
      healthStatus.className = "health-status health-healthy";
      healthStatus.textContent = `✅ 서버가 정상 작동 중입니다 (응답시간: ${duration}ms)`;
      updateLoadingResult(
        loadingId,
        "서버 상태 확인",
        url,
        data,
        false,
        duration
      );
    } else {
      healthStatus.className = "health-status health-unhealthy";
      healthStatus.textContent = "❌ 서버에 문제가 있습니다";
      updateLoadingResult(
        loadingId,
        "서버 상태 확인",
        url,
        data,
        true,
        duration
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const healthStatus = document.getElementById("healthStatus");
    healthStatus.style.display = "block";
    healthStatus.className = "health-status health-unhealthy";
    healthStatus.textContent = `❌ 서버에 연결할 수 없습니다: ${error.message}`;
    updateLoadingResult(
      loadingId,
      "서버 상태 확인",
      url,
      `연결 오류: ${error.message}`,
      true,
      duration
    );
  }
}

// Google Maps JavaScript API 로드
function loadGoogleMapsJs() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const mapScript = document.createElement("script");
  const authParam = getAuthParam();
  mapScript.src = `http://mondrian-new.sphinfo.co.kr:9443/google/jsapi/maps/api/js?${authParam}&callback=initMap&libraries=places,marker&pass=icFBM82OWZvesSkQ7dxg`;
  mapScript.async = true;
  mapScript.defer = true;

  // 이미 로드된 스크립트가 있으면 제거
  const existingScript = document.querySelector(
    'script[src*="/google/jsapi/maps/api/js"]'
  );
  if (existingScript) {
    existingScript.remove();
  }

  document.head.appendChild(mapScript);

  addResult(
    "Google Maps JavaScript API 로드",
    mapScript.src,
    "스크립트 로드 시작"
  );
}

// 지도 초기화 콜백
async function initMap() {
  const mapDiv = document.getElementById("map");
  mapDiv.style.display = "block";

  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement, PinElement } =
    await google.maps.importLibrary("marker");

  const map = new Map(mapDiv, {
    center: { lat: 37.5665, lng: 126.978 },
    zoom: 13,
    mapId: "DEMO_MAP_ID",
  });

  new AdvancedMarkerElement({
    position: { lat: 37.5665, lng: 126.978 },
    map: map,
    title: "서울시청",
  });

  initPlacesLibrary(map);

  addResult(
    "Google Maps JavaScript API",
    "Google Maps JS API",
    "지도가 성공적으로 로드되었습니다!"
  );
}

// Places Library 초기화
function initPlacesLibrary(map) {
  const autocompleteInput = document.getElementById("autocomplete-widget");
  const autocomplete = new google.maps.places.Autocomplete(autocompleteInput, {
    componentRestrictions: { country: "kr" },
    fields: [
      "place_id",
      "name",
      "formatted_address",
      "geometry",
      "types",
      "rating",
      "opening_hours",
    ],
    types: ["establishment"],
  });

  autocomplete.addListener("place_changed", function () {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      document.getElementById("autocomplete-result").innerHTML =
        "선택된 장소에 대한 위치 정보가 없습니다.";
      document.getElementById("autocomplete-result").style.display = "block";
      return;
    }

    const result = {
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      },
      types: place.types,
      rating: place.rating || "평점 없음",
      opening_hours: place.opening_hours,
    };

    document.getElementById("autocomplete-result").innerHTML = `
                  <strong>선택된 장소:</strong><br>
                  <strong>이름:</strong> ${result.name}<br>
                  <strong>주소:</strong> ${result.formatted_address}<br>
                  <strong>위치:</strong> ${result.location.lat}, ${result.location.lng}<br>
                  <strong>평점:</strong> ${result.rating}<br>
                  <strong>타입:</strong> ${result.types.join(", ")}<br>
                  <strong>Place ID:</strong> ${result.place_id}
              `;
    document.getElementById("autocomplete-result").style.display = "block";

    if (window.currentPlaceMarker) {
      window.currentPlaceMarker.map = null;
    }

    const pin = new google.maps.marker.PinElement({
      background: "#4285F4",
      borderColor: "#FFFFFF",
      glyphColor: "#FFFFFF",
    });

    window.currentPlaceMarker = new google.maps.marker.AdvancedMarkerElement({
      position: result.location,
      map: map,
      title: result.name,
      content: pin.element,
    });

    map.setCenter(result.location);
    map.setZoom(16);

    addResult("Places Autocomplete Widget", "client-side", result);
  });

  const placesService = new google.maps.places.PlacesService(map);

  document
    .getElementById("search-places")
    .addEventListener("click", function () {
      const query = document.getElementById("places-query").value.trim();
      if (!query) {
        alert("검색어를 입력해주세요.");
        return;
      }

      document.getElementById("places-results").innerHTML = "검색 중...";

      const request = {
        query: query,
        location: { lat: 37.5665, lng: 126.978 },
        radius: 5000,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "geometry",
          "rating",
          "price_level",
          "opening_hours",
          "photos",
        ],
      };

      placesService.textSearch(request, function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          let html = `<strong>검색 결과 (${results.length}개):</strong><br><br>`;

          if (window.searchMarkers) {
            window.searchMarkers.forEach((marker) => (marker.map = null));
          }
          window.searchMarkers = [];

          results.slice(0, 5).forEach((place, index) => {
            const photoUrl =
              place.photos && place.photos.length > 0
                ? place.photos[0].getUrl({
                    maxWidth: 100,
                    maxHeight: 100,
                  })
                : null;

            html += `
                              <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 6px;">
                                  <strong>${index + 1}. ${place.name}</strong><br>
                                  <small>${place.formatted_address}</small><br>
                                  ${place.rating ? `⭐ ${place.rating}` : "평점 없음"}
                                  ${place.price_level !== undefined ? ` | 💰 ${"$".repeat(place.price_level + 1)}` : ""}
                                  <br><small>Place ID: ${place.place_id}</small>
                                  ${photoUrl ? `<br><img src="${photoUrl}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-top: 5px;">` : ""}
                              </div>
                          `;

            const pinGlyph = new google.maps.marker.PinElement({
              glyph: String(index + 1),
            });
            const marker = new google.maps.marker.AdvancedMarkerElement({
              position: place.geometry.location,
              map: map,
              title: `${index + 1}. ${place.name}`,
              content: pinGlyph.element,
            });

            window.searchMarkers.push(marker);

            marker.addListener("click", function () {
              const infoWindow = new google.maps.InfoWindow({
                content: `
                                      <div style="max-width: 200px;">
                                          <h4>${place.name}</h4>
                                          <p>${place.formatted_address}</p>
                                          ${place.rating ? `<p>⭐ ${place.rating}</p>` : ""}
                                      </div>
                                  `,
              });
              infoWindow.open(map, marker);
            });
          });

          document.getElementById("places-results").innerHTML = html;

          if (results.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            results.slice(0, 5).forEach((place) => {
              bounds.extend(place.geometry.location);
            });
            map.fitBounds(bounds);
          }

          addResult("PlacesService Text Search", "client-side", {
            query: query,
            results_count: results.length,
            first_result: results[0]
              ? {
                  name: results[0].name,
                  address: results[0].formatted_address,
                  rating: results[0].rating,
                }
              : null,
          });
        } else {
          document.getElementById("places-results").innerHTML =
            `검색 실패: ${status}`;
          addResult(
            "PlacesService Text Search",
            "client-side",
            `검색 실패: ${status}`,
            true
          );
        }
      });
    });
}

// API 테스트 함수들
async function testGeocodingForward() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const address = document.getElementById("geocode-address").value.trim();
  if (!address) {
    alert("주소를 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const authParam = getAuthParam();
  const url = `${serverUrl}/google/wsapi/maps/api/geocode/json?${authParam}&address=${encodeURIComponent(address)}`;
  await makeApiCall(url, "순방향 지오코딩");
}

async function testGeocodingReverse() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const latlng = document.getElementById("geocode-latlng").value.trim();
  if (!latlng) {
    alert("위도,경도를 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const authParam = getAuthParam();
  const url = `${serverUrl}/google/wsapi/maps/api/geocode/json?${authParam}&latlng=${encodeURIComponent(latlng)}`;
  await makeApiCall(url, "역방향 지오코딩");
}

async function testAutocomplete() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const input = document.getElementById("autocomplete-input").value.trim();
  const language = document.getElementById("autocomplete-language").value;

  if (!input) {
    alert("검색어를 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const authParam = getAuthParam();
  const url = `${serverUrl}/google/wsapi/maps/api/place/autocomplete/json?${authParam}&input=${encodeURIComponent(input)}&language=${language}`;
  await makeApiCall(url, "Places Autocomplete");
}

async function testPlaceDetails() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const placeId = document.getElementById("details-placeid").value.trim();
  const fields = document.getElementById("details-fields").value.trim();

  if (!placeId) {
    alert("Place ID를 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const authParam = getAuthParam();
  let url = `${serverUrl}/google/wsapi/maps/api/place/details/json?${authParam}&place_id=${encodeURIComponent(placeId)}`;
  if (fields) {
    url += `&fields=${encodeURIComponent(fields)}`;
  }
  await makeApiCall(url, "Places Details");
}

async function testTextSearch() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const query = document.getElementById("textsearch-query").value.trim();
  const location = document.getElementById("textsearch-location").value.trim();
  const radius = document.getElementById("textsearch-radius").value.trim();

  if (!query) {
    alert("검색어를 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const authParam = getAuthParam();
  let url = `${serverUrl}/google/wsapi/maps/api/place/textsearch/json?${authParam}&query=${encodeURIComponent(query)}`;
  if (location) url += `&location=${encodeURIComponent(location)}`;
  if (radius) url += `&radius=${radius}`;

  await makeApiCall(url, "Places Text Search");
}

async function testNearbySearch() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const location = document.getElementById("nearby-location").value.trim();
  const radius = document.getElementById("nearby-radius").value.trim();
  const type = document.getElementById("nearby-type").value;

  if (!location) {
    alert("위치를 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const authParam = getAuthParam();
  let url = `${serverUrl}/google/wsapi/maps/api/place/nearbysearch/json?${authParam}&location=${encodeURIComponent(location)}`;
  if (radius) url += `&radius=${radius}`;
  if (type) url += `&type=${type}`;

  await makeApiCall(url, "Places Nearby Search");
}

async function testFindPlace() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const input = document.getElementById("findplace-input").value.trim();
  const inputType = document.getElementById("findplace-inputtype").value;
  const fields = document.getElementById("findplace-fields").value.trim();

  if (!input) {
    alert("입력값을 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const authParam = getAuthParam();
  let url = `${serverUrl}/google/wsapi/maps/api/place/findplacefromtext/json?${authParam}&input=${encodeURIComponent(input)}&inputtype=${inputType}`;
  if (fields) url += `&fields=${encodeURIComponent(fields)}`;

  await makeApiCall(url, "Find Place");
}

async function testDirections() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const origin = document.getElementById("directions-origin").value.trim();
  const destination = document
    .getElementById("directions-destination")
    .value.trim();
  const mode = document.getElementById("directions-mode").value;

  if (!origin || !destination) {
    alert("출발지와 목적지를 모두 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const authParam = getAuthParam();
  const url = `${serverUrl}/google/wsapi/maps/api/directions/json?${authParam}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}`;
  await makeApiCall(url, "Directions");
}

async function testDistanceMatrix() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const origins = document.getElementById("matrix-origins").value.trim();
  const destinations = document
    .getElementById("matrix-destinations")
    .value.trim();
  const mode = document.getElementById("matrix-mode").value;

  if (!origins || !destinations) {
    alert("출발지와 목적지를 모두 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const authParam = getAuthParam();
  const url = `${serverUrl}/google/wsapi/maps/api/distancematrix/json?${authParam}&origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&mode=${mode}`;
  await makeApiCall(url, "Distance Matrix");
}

async function testPlacesPhoto() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const photoReference = document
    .getElementById("photo-reference")
    .value.trim();
  const maxWidth = document.getElementById("photo-maxwidth").value.trim();
  const maxHeight = document.getElementById("photo-maxheight").value.trim();

  if (!photoReference) {
    alert(
      "Photo Reference를 입력해주세요.\n\n팁: Places Details나 Nearby Search 결과에서 photos[0].photo_reference 값을 사용하세요."
    );
    return;
  }

  if (!maxWidth && !maxHeight) {
    alert("최대 너비 또는 최대 높이 중 하나는 반드시 입력해야 합니다.");
    return;
  }

  const serverUrl = getServerUrl();
  const authParam = getAuthParam();
  let url = `${serverUrl}/google/wsapi/maps/api/place/photo?${authParam}&photo_reference=${encodeURIComponent(photoReference)}`;
  if (maxWidth) url += `&maxwidth=${maxWidth}`;
  if (maxHeight) url += `&maxheight=${maxHeight}`;

  const loadingId = addLoadingResult("Places Photos", url);
  const startTime = Date.now();

  try {
    const response = await fetch(url);
    const duration = Date.now() - startTime;

    if (response.ok) {
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      const photoResult = document.getElementById("photo-result");
      const photoImage = document.getElementById("photo-image");
      photoImage.src = imageUrl;
      photoImage.onload = function () {
        photoResult.style.display = "block";
      };

      updateLoadingResult(
        loadingId,
        "Places Photos",
        url,
        {
          status: "이미지 로드 성공",
          content_type: response.headers.get("content-type"),
          content_length: response.headers.get("content-length"),
          image_dimensions: `${photoImage.naturalWidth}x${photoImage.naturalHeight}`,
        },
        false,
        duration
      );
    } else {
      const errorData = await response.text();
      updateLoadingResult(
        loadingId,
        "Places Photos",
        url,
        errorData,
        true,
        duration
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    updateLoadingResult(
      loadingId,
      "Places Photos",
      url,
      `오류: ${error.message}`,
      true,
      duration
    );
  }
}

// 새로운 Places API v1 테스트 함수들
async function makePostApiCall(url, title, body, headers = {}) {
  const loadingId = addLoadingResult(title, url);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
    const duration = Date.now() - startTime;
    const data = await response.json();

    if (response.ok) {
      updateLoadingResult(loadingId, title, url, data, false, duration);
    } else {
      updateLoadingResult(loadingId, title, url, data, true, duration);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    updateLoadingResult(
      loadingId,
      title,
      url,
      `오류: ${error.message}`,
      true,
      duration
    );
  }
}

async function makeGetApiCallWithHeaders(url, title, headers = {}) {
  const loadingId = addLoadingResult(title, url);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });
    const duration = Date.now() - startTime;
    const data = await response.json();

    if (response.ok) {
      updateLoadingResult(loadingId, title, url, data, false, duration);
    } else {
      updateLoadingResult(loadingId, title, url, data, true, duration);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    updateLoadingResult(
      loadingId,
      title,
      url,
      `오류: ${error.message}`,
      true,
      duration
    );
  }
}

async function testNewTextSearch() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const query = document.getElementById("new-textsearch-query").value.trim();
  const language = document
    .getElementById("new-textsearch-language")
    .value.trim();
  const pageSize =
    parseInt(document.getElementById("new-textsearch-pagesize").value) || 10;
  const fieldMask = document
    .getElementById("new-textsearch-fieldmask")
    .value.trim();

  if (!query) {
    alert("검색어를 입력해주세요.");
    return;
  }
  if (!fieldMask) {
    alert("Field Mask를 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const url = `${serverUrl}/v1/places:searchText`;

  const body = {
    textQuery: query,
    pageSize: pageSize,
  };
  if (language) body.languageCode = language;

  const headers = {
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": fieldMask,
  };

  await makePostApiCall(url, "New Text Search", body, headers);
}

async function testNewNearbySearch() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const lat = parseFloat(document.getElementById("new-nearby-lat").value);
  const lng = parseFloat(document.getElementById("new-nearby-lng").value);
  const radius = parseFloat(document.getElementById("new-nearby-radius").value);
  const types = document.getElementById("new-nearby-types").value.trim();
  const fieldMask = document
    .getElementById("new-nearby-fieldmask")
    .value.trim();

  if (isNaN(lat) || isNaN(lng)) {
    alert("올바른 위도, 경도를 입력해주세요.");
    return;
  }
  if (!fieldMask) {
    alert("Field Mask를 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const url = `${serverUrl}/v1/places:searchNearby`;

  const body = {
    locationRestriction: {
      circle: {
        center: {
          latitude: lat,
          longitude: lng,
        },
        radius: radius || 500,
      },
    },
    maxResultCount: 10,
  };

  if (types) {
    body.includedTypes = types.split(",").map((t) => t.trim());
  }

  const headers = {
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": fieldMask,
  };

  await makePostApiCall(url, "New Nearby Search", body, headers);
}

async function testNewAutocomplete() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const input = document.getElementById("new-autocomplete-input").value.trim();
  const language = document
    .getElementById("new-autocomplete-language")
    .value.trim();
  const sessionToken = document
    .getElementById("new-autocomplete-session")
    .value.trim();

  if (!input) {
    alert("입력값을 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  const url = `${serverUrl}/v1/places:autocomplete`;

  const body = {
    input: input,
  };
  if (language) body.languageCode = language;
  if (sessionToken) body.sessionToken = sessionToken;

  const headers = {
    "X-Goog-Api-Key": apiKey,
  };

  await makePostApiCall(url, "New Autocomplete", body, headers);
}

async function testNewPlaceDetails() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const placeId = document.getElementById("new-details-placeid").value.trim();
  const language = document.getElementById("new-details-language").value.trim();
  const fieldMask = document
    .getElementById("new-details-fieldmask")
    .value.trim();

  if (!placeId) {
    alert("Place ID를 입력해주세요.");
    return;
  }
  if (!fieldMask) {
    alert("Field Mask를 입력해주세요.");
    return;
  }

  const serverUrl = getServerUrl();
  let url = `${serverUrl}/v1/places/${encodeURIComponent(placeId)}`;
  if (language) url += `?languageCode=${encodeURIComponent(language)}`;

  const headers = {
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": fieldMask,
  };

  await makeGetApiCallWithHeaders(url, "New Place Details", headers);
}

async function testNewPlacePhotos() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const placeId = document.getElementById("new-photo-placeid").value.trim();
  const photoReference = document
    .getElementById("new-photo-reference")
    .value.trim();
  const maxWidth = document.getElementById("new-photo-maxwidth").value.trim();
  const maxHeight = document.getElementById("new-photo-maxheight").value.trim();

  if (!placeId) {
    alert("Place ID를 입력해주세요.");
    return;
  }

  if (!photoReference) {
    alert("Photo Reference를 입력해주세요.");
    return;
  }

  if (!maxWidth && !maxHeight) {
    alert("최대 너비 또는 최대 높이 중 하나는 반드시 입력해야 합니다.");
    return;
  }

  const serverUrl = getServerUrl();
  let url = `${serverUrl}/v1/places/${encodeURIComponent(placeId)}/photos/${encodeURIComponent(photoReference)}/media`;
  const params = new URLSearchParams();
  if (maxWidth) params.append("maxWidthPx", maxWidth);
  if (maxHeight) params.append("maxHeightPx", maxHeight);

  const skipRedirect = document.getElementById(
    "new-photo-skip-redirect"
  ).checked;
  if (skipRedirect) params.append("skipHttpRedirect", "true");

  if (params.toString()) url += `?${params.toString()}`;

  const loadingId = addLoadingResult("New Place Photos", url);
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
    });
    const duration = Date.now() - startTime;

    if (skipRedirect && response.ok) {
      const data = await response.json();

      const photoResult = document.getElementById("new-photo-result");
      photoResult.innerHTML = `
        <strong>JSON 응답 결과:</strong><br>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 8px; font-family: monospace; font-size: 12px;">
          <strong>Name:</strong> ${data.name}<br>
          <strong>Photo URI:</strong> <a href="${data.photoUri}" target="_blank" style="color: #007bff; text-decoration: none;">${data.photoUri}</a>
        </div>
      `;
      photoResult.style.display = "block";

      updateLoadingResult(
        loadingId,
        "New Place Photos",
        url,
        data,
        false,
        duration
      );
    } else if (response.ok) {
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      const photoResult = document.getElementById("new-photo-result");
      photoResult.innerHTML = `
        <strong>이미지 로드 성공:</strong><br>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 8px;">
          <div style="margin-bottom: 10px;">
            <strong>Content Type:</strong> ${response.headers.get("content-type") || "image/jpeg"}<br>
            <strong>Content Length:</strong> ${response.headers.get("content-length") || "Unknown"} bytes<br>
            <strong>Response Time:</strong> ${duration}ms
          </div>
          <img src="${imageUrl}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
               onload="this.style.display='block'" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
          <div style="display: none; color: #dc3545; margin-top: 10px; padding: 10px; background: #f8d7da; border-radius: 4px;">
            ❌ 이미지 로드 실패
          </div>
        </div>
      `;
      photoResult.style.display = "block";

      updateLoadingResult(
        loadingId,
        "New Place Photos",
        url,
        {
          status: "이미지 스트리밍 성공",
          content_type: response.headers.get("content-type"),
          content_length: response.headers.get("content-length"),
          response_time: `${duration}ms`,
        },
        false,
        duration
      );
    } else {
      const errorData = await response.text();
      updateLoadingResult(
        loadingId,
        "New Place Photos",
        url,
        errorData,
        true,
        duration
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    updateLoadingResult(
      loadingId,
      "New Place Photos",
      url,
      `오류: ${error.message}`,
      true,
      duration
    );
  }
}

// New Routes API 테스트 함수들
async function testNewComputeRoute() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const origin = document.getElementById("new-route-origin").value.trim();
  const destination = document
    .getElementById("new-route-destination")
    .value.trim();
  const travelMode = document.getElementById("new-route-mode").value;
  const language = document.getElementById("new-route-language").value.trim();
  const fieldMask = document.getElementById("new-route-fieldmask").value.trim();

  if (!origin || !destination) {
    alert("출발지와 목적지를 모두 입력해주세요.");
    return;
  }
  if (!fieldMask) {
    alert("Field Mask를 입력해주세요.");
    return;
  }

  const parseLatLng = (coords) => {
    const [lat, lng] = coords.split(",").map((c) => parseFloat(c.trim()));
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error(`잘못된 좌표 형식: ${coords}`);
    }
    return { latitude: lat, longitude: lng };
  };

  try {
    const originCoords = parseLatLng(origin);
    const destinationCoords = parseLatLng(destination);

    const serverUrl = getServerUrl();
    const url = `${serverUrl}/directions/v2:computeRoutes`;

    const body = {
      origin: {
        location: {
          latLng: originCoords,
        },
      },
      destination: {
        location: {
          latLng: destinationCoords,
        },
      },
      travelMode: travelMode,
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      },
    };

    if (language) body.languageCode = language;

    const headers = {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    };

    await makePostApiCall(url, "New Compute Route", body, headers);
  } catch (error) {
    alert(`좌표 파싱 오류: ${error.message}`);
  }
}

async function testNewComputeRouteMatrix() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const origin1 = document.getElementById("new-matrix-origin1").value.trim();
  const origin2 = document.getElementById("new-matrix-origin2").value.trim();
  const dest1 = document.getElementById("new-matrix-dest1").value.trim();
  const dest2 = document.getElementById("new-matrix-dest2").value.trim();
  const travelMode = document.getElementById("new-matrix-mode").value;
  const language = document.getElementById("new-matrix-language").value.trim();

  if (!origin1 || !dest1) {
    alert("최소한 출발지 1과 목적지 1은 입력해주세요.");
    return;
  }

  const parseLatLng = (coords) => {
    const [lat, lng] = coords.split(",").map((c) => parseFloat(c.trim()));
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error(`잘못된 좌표 형식: ${coords}`);
    }
    return { latitude: lat, longitude: lng };
  };

  try {
    const origins = [];
    const destinations = [];

    if (origin1)
      origins.push({
        waypoint: { location: { latLng: parseLatLng(origin1) } },
      });
    if (origin2)
      origins.push({
        waypoint: { location: { latLng: parseLatLng(origin2) } },
      });

    if (dest1)
      destinations.push({
        waypoint: { location: { latLng: parseLatLng(dest1) } },
      });
    if (dest2)
      destinations.push({
        waypoint: { location: { latLng: parseLatLng(dest2) } },
      });

    const serverUrl = getServerUrl();
    const url = `${serverUrl}/distanceMatrix/v2:computeRouteMatrix`;

    const body = {
      origins: origins,
      destinations: destinations,
      travelMode: travelMode,
      routingPreference: "TRAFFIC_AWARE",
    };

    if (language) body.languageCode = language;

    const headers = {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "originIndex,destinationIndex,duration,distanceMeters,status",
    };

    await makePostApiCall(url, "New Compute Route Matrix", body, headers);
  } catch (error) {
    alert(`좌표 파싱 오류: ${error.message}`);
  }
}

// 이벤트 리스너
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("healthCheck").addEventListener("click", checkHealth);
  document
    .getElementById("loadMapJs")
    .addEventListener("click", loadGoogleMapsJs);
  setTimeout(checkHealth, 500);
});
