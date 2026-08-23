// --- Weather Pro Studio Engine ---

const inputBox = document.getElementById('input-city');
const searchBtn = document.getElementById('searchBtn');
const weatherImg = document.getElementById('weather-img');
const mainTemp = document.getElementById('main-temp');
const weatherDesc = document.getElementById('weather-desc');
const cityNameEl = document.getElementById('city-name');
const dateTimeEl = document.getElementById('date-time');

const valHumidity = document.getElementById('val-humidity');
const valWind = document.getElementById('val-wind');
const valFeelsLike = document.getElementById('val-feelslike');
const valPressure = document.getElementById('val-pressure');

const forecastContainer = document.getElementById('forecast-container');
const locationNotFound = document.getElementById('location-not-found');
const weatherBody = document.getElementById('weather-body');
const suggestionsBox = document.getElementById('suggestions-box');

let currentUnit = 'C';
let cachedWeatherData = null;
let debounceTimer = null;

// Map WMO Weather Codes to text description and asset image
function getWmoDetails(code) {
    if (code === 0) {
        return { text: "Clear Sky", img: "assets/clear.png" };
    }
    if ([1, 2, 3].includes(code)) {
        return { text: code === 1 ? "Mainly Clear" : code === 2 ? "Partly Cloudy" : "Overcast", img: "assets/cloud.png" };
    }
    if ([45, 48].includes(code)) {
        return { text: "Mist & Fog", img: "assets/mist.png" };
    }
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return { text: "Rain & Drizzle", img: "assets/rain.png" };
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return { text: "Snowfall", img: "assets/snow.png" };
    }
    if ([95, 96, 99].includes(code)) {
        return { text: "Thunderstorm", img: "assets/rain.png" };
    }
    return { text: "Cloudy", img: "assets/cloud.png" };
}

function convertTemp(tempC) {
    if (currentUnit === 'F') {
        return Math.round((tempC * 9 / 5) + 32);
    }
    return Math.round(tempC);
}

function setUnit(unit) {
    currentUnit = unit;
    document.getElementById('btn-c').classList.toggle('active', unit === 'C');
    document.getElementById('btn-f').classList.toggle('active', unit === 'F');

    if (cachedWeatherData) {
        renderWeatherUI(cachedWeatherData);
    }
}

function quickSearch(city) {
    inputBox.value = city;
    if (suggestionsBox) suggestionsBox.style.display = 'none';
    checkWeather(city);
}

// Real-Time Search Autocomplete Suggestions
function handleSearchInput() {
    const query = inputBox.value.trim();
    if (!suggestionsBox) return;

    if (query.length < 2) {
        suggestionsBox.style.display = 'none';
        return;
    }

    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`);
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                renderSuggestions(data.results);
            } else {
                suggestionsBox.style.display = 'none';
            }
        } catch (e) {
            suggestionsBox.style.display = 'none';
        }
    }, 250);
}

function renderSuggestions(results) {
    if (!suggestionsBox) return;
    suggestionsBox.innerHTML = '';

    results.forEach(loc => {
        const country = loc.country_code ? loc.country_code.toUpperCase() : '';
        const admin = loc.admin1 ? `, ${loc.admin1}` : '';
        const displayName = `${loc.name}${admin}`;

        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
            <span>📍 ${displayName}</span>
            <span class="country-code">${country || 'GEO'}</span>
        `;

        item.addEventListener('click', () => {
            inputBox.value = loc.name;
            suggestionsBox.style.display = 'none';
            checkWeather(loc.name);
        });

        suggestionsBox.appendChild(item);
    });

    suggestionsBox.style.display = 'flex';
}

async function checkWeather(query) {
    if (!query || !query.trim()) return;
    const city = query.trim();
    if (suggestionsBox) suggestionsBox.style.display = 'none';

    try {
        // 1. Fetch Geocoding from Open-Meteo
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        const geoData = await geoRes.json();

        if (geoData.results && geoData.results.length > 0) {
            const loc = geoData.results[0];
            const country = loc.country_code ? loc.country_code.toUpperCase() : "";
            const displayName = `${loc.name}${country ? ', ' + country : ''}`;

            // 2. Fetch Detailed Current & Daily Forecast
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
            const wData = await wRes.json();

            if (wData.current) {
                cachedWeatherData = {
                    cityName: displayName,
                    tempC: wData.current.temperature_2m,
                    feelsLikeC: wData.current.apparent_temperature,
                    humidity: wData.current.relative_humidity_2m,
                    windKm: wData.current.wind_speed_10m,
                    pressure: Math.round(wData.current.surface_pressure),
                    wmoCode: wData.current.weather_code,
                    daily: wData.daily
                };

                locationNotFound.style.display = "none";
                weatherBody.style.display = "flex";
                renderWeatherUI(cachedWeatherData);
                return;
            }
        }

        // Fallback to OpenWeatherMap
        fetchOpenWeatherFallback(city);

    } catch (err) {
        console.error("Primary fetch error, falling back:", err);
        fetchOpenWeatherFallback(city);
    }
}

async function fetchOpenWeatherFallback(city) {
    try {
        const api_key = "4cd0eee81294c867b4bc4cfc64e998c5";
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${api_key}`;
        const response = await fetch(url);
        const weather_data = await response.json();

        if (!response.ok || weather_data.cod == "404" || !weather_data.main) {
            locationNotFound.style.display = "flex";
            weatherBody.style.display = "none";
            return;
        }

        const tempC = weather_data.main.temp - 273.15;
        const feelsC = weather_data.main.feels_like - 273.15;

        cachedWeatherData = {
            cityName: `${weather_data.name}, ${weather_data.sys.country || ''}`,
            tempC: tempC,
            feelsLikeC: feelsC,
            humidity: weather_data.main.humidity,
            windKm: Math.round(weather_data.wind.speed * 3.6),
            pressure: weather_data.main.pressure,
            wmoCode: 0,
            customDesc: weather_data.weather[0].description,
            customMain: weather_data.weather[0].main
        };

        locationNotFound.style.display = "none";
        weatherBody.style.display = "flex";
        renderWeatherUI(cachedWeatherData);

    } catch (e) {
        locationNotFound.style.display = "flex";
        weatherBody.style.display = "none";
    }
}

function fetchGeoLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            try {
                const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
                const wData = await wRes.json();

                if (wData.current) {
                    cachedWeatherData = {
                        cityName: "Current Location",
                        tempC: wData.current.temperature_2m,
                        feelsLikeC: wData.current.apparent_temperature,
                        humidity: wData.current.relative_humidity_2m,
                        windKm: wData.current.wind_speed_10m,
                        pressure: Math.round(wData.current.surface_pressure),
                        wmoCode: wData.current.weather_code,
                        daily: wData.daily
                    };

                    locationNotFound.style.display = "none";
                    weatherBody.style.display = "flex";
                    renderWeatherUI(cachedWeatherData);
                }
            } catch (err) {}
        }, () => {
            alert("Unable to retrieve your location.");
        });
    }
}

function renderWeatherUI(data) {
    const wmo = getWmoDetails(data.wmoCode);

    cityNameEl.innerText = data.cityName;

    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dateTimeEl.innerText = `${days[now.getDay()]}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    mainTemp.innerHTML = `${convertTemp(data.tempC)}°<span style="font-size: 1.8rem;">${currentUnit}</span>`;
    weatherDesc.innerText = data.customDesc || wmo.text;
    weatherImg.src = wmo.img;

    valHumidity.innerText = `${Math.round(data.humidity)}%`;
    valWind.innerText = `${Math.round(data.windKm)} km/h`;
    valFeelsLike.innerText = `${convertTemp(data.feelsLikeC)}°${currentUnit}`;
    valPressure.innerText = `${data.pressure} hPa`;

    // Render 5-Day Forecast
    renderForecastCards(data.daily);
}

function renderForecastCards(dailyData) {
    forecastContainer.innerHTML = "";
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (dailyData && dailyData.time) {
        const count = Math.min(5, dailyData.time.length);
        for (let i = 0; i < count; i++) {
            const dateObj = new Date(dailyData.time[i]);
            const dayName = i === 0 ? 'Today' : days[dateObj.getDay()];
            const wmo = getWmoDetails(dailyData.weather_code[i]);
            const maxT = convertTemp(dailyData.temperature_2m_max[i]);

            const card = document.createElement('div');
            card.className = 'forecast-card';
            card.innerHTML = `
                <span class="forecast-day">${dayName}</span>
                <img src="${wmo.img}" alt="${wmo.text}" class="forecast-icon">
                <span class="forecast-temp">${maxT}°</span>
            `;
            forecastContainer.appendChild(card);
        }
    }
}

// Event Listeners
searchBtn.addEventListener('click', () => {
    checkWeather(inputBox.value);
});

inputBox.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        checkWeather(inputBox.value);
    }
});

// Close suggestions on outside click
document.addEventListener('click', (e) => {
    if (suggestionsBox && !e.target.closest('.search-container')) {
        suggestionsBox.style.display = 'none';
    }
});

// Auto-load on startup
document.addEventListener('DOMContentLoaded', () => {
    const defaultCity = inputBox.value.trim() || "Davangere";
    checkWeather(defaultCity);
});