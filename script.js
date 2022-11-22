const link = "http://api.openweathermap.org/data/2.5/weather?APPID=e01c17a3b1d66c986e1b1a2f8fdf382f&lang=ru&units=metric";
const root = document.getElementById("root");
const popup = document.getElementById("popup");
const textInput = document.getElementById("text-input");
const form = document.getElementById("form");
const firstQuery = "&q=Екатеринбург";
const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const timeOptions = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };

let store = {city: (firstQuery.split("="))[1], lat: 56.8575, lon: 60.6125,
  datetime: {ld: {}, lt: {}, isd: "yes"}, descriptions: {}, temperature: 0,
  properties: {cloudcover: {}, humidity: {}, windSpeed: {}, pressure: {},visibility: {}},
};

const fetchData = async () => {
  try {
    const query = localStorage.getItem("query") || firstQuery;
    const data = await fetch(`${link}${query}`).then(res => res.json());  
    const {base, clouds: {all: cloudcover}, coord: {lat, lon},
      main: {temp: temperature, pressure, humidity}, name: city,
      sys: {sunrise, sunset}, timezone, visibility, weather,
      wind: {deg: winddirection, speed: windspeed}} = data;        
    const dt = getdatetime(timezone, sunrise, sunset);
    store = {...store, city, lat, lon, 
      datetime: {ld: `${dt.ld}`, lt: `${dt.lt}`, isd: `${dt.isd}`},
      temperature: `${(temperature).toFixed(1)}`,
      descriptions: {main: `${weather[0].main}`, description: `${weather[0].description}`},
      properties: {
        cloudcover: {
          title: "Облачность",
          value: `${cloudcover}%`,
          icon: "cloud.png",
        },
        humidity: {
          title: "Влажность",
          value: `${humidity}%`,
          icon: "humidity.png",
        },
        windSpeed: {
          title: "Скорость ветра",
          value: `${windspeed.toFixed(1)} м/сек`,
          icon: "wind.png",
        },
        pressure: {
          title: "Давление",
          value: `${(pressure*0.72863).toFixed(0)} мм.рт.ст`,
          icon: "gauge.png",
        },
        visibility: {
          title: "Видимость",
          value: `${(visibility/1000).toFixed(2)} км`,
          icon: "visibility.png",
        },
      },
    };
    store.city = (store.city == '') ? 'Неизвестно': store.city;
    renderComponent();
  } catch (err) {
    localStorage.clear();
    document.getElementById("text-input").value = "Запрос отклонен. Попробуйте снова"; 
    togglePopupClass();
  }
};

const getdatetime = (tz, sr, ss) => {
  let mydate = new Date();
  let mytz = -mydate.getTimezoneOffset()*60;
  let date=new Date(mydate.getTime()+(tz-mytz)*1000);
  return {
    ld: new Intl.DateTimeFormat('ru-RU', dateOptions).format(date),
    lt: new Intl.DateTimeFormat('ru-RU', timeOptions).format(date),
    isd: ((date > new Date((sr+tz-mytz)*1000)) &&
      (date < new Date((ss+tz-mytz)*1000)))? "yes": "no"};
};

const getImage = (description, theday) => {
  const value = description.toLowerCase();
  switch (value) {
    case "partly cloudy":
      return "partly.png";
    case "clouds":
      return "cloud.png";
    case "fog":
      return "fog.png";
    case "mist":
        return "fog.png";
    case "clear":
      return (theday==="yes") ? "sunny.png": "the.png";
    default:
      return "the.png";
  }
};

const renderProperty = (properties) => {
  return Object.values(properties)
    .map(({ title, value, icon }) => {
      return `<div class="property">
            <div class="property-icon">
              <img src="./img/icons/${icon}" alt="">
            </div>
            <div class="property-info">
              <div class="property-info__value">${value}</div>
              <div class="property-info__description">${title}</div>
            </div>
          </div>`;
    })
    .join("");
};

const markup = () => {
  const {city, lat, lon, datetime, temperature, descriptions, properties } = store;
  const containerClass = (datetime.isd === "yes") ? "is-day" : "";
  return `<div class="container ${containerClass}">
            <div class="top">
              <div class="city">
                <div class="city-subtitle">Погода сегодня в регионе:</div>
                  <div class="city-title" id="city">
                    <span>${city}</span>
                  </div>
                  <div class="city-subtitle">широта: ${lat}, долгота: ${lon}</div>
              </div>
              <div class="city-info">
                <div class="top-left">
                <img class="icon" src="./img/${getImage(descriptions.main, datetime.isd)}" alt="" />
                <div class="description">${descriptions.description}</div>
              </div>
              <div class="top-right">
                <div class="city-info__subtitle">Время в регионе: ${datetime.lt}</div>
                <div class="city-info__subtitle">${datetime.ld}</div>
                <div class="city-info__title">${temperature} °С</div>
              </div>
            </div>
          </div>
        <div id="properties">${renderProperty(properties)}</div>
      </div>`;
};

const togglePopupClass = () => {
  popup.classList.toggle("active");
};

const renderComponent = () => {
  root.innerHTML = markup();
  const city = document.getElementById("city");
  city.addEventListener("click", togglePopupClass);
};

const handleInput = (e) => {
  store = {
    ...store,
    city: e.target.value,
  };
};

const handleSubmit = (e) => {
  e.preventDefault();
  let params = ((store.city).includes(",")) ? (store.city).split(","): [store.city];
  for (let param in params) {params[param] = (params[param].split(' ')).join('')};
  value = (params.length === 1) ? "&q="+params[0]: "&lat="+params[0]+"&lon="+params[1];
  localStorage.setItem("query", value);
  fetchData();
  togglePopupClass();
};

form.addEventListener("submit", handleSubmit);
textInput.addEventListener("input", handleInput);

fetchData();
