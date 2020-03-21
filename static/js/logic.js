var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
var mapZoomLevel = 4.5;
var adjustRadius = 20000;

d3.json(queryUrl, function (data) {

  createFeatures(data.features);
  console.log(data.features)
});

function getColor(d) {
  return d > 5 ? '#ff3333' :
    d > 4 ? '#ff6633' :
    d > 3 ? '#ff9933' :
    d > 2 ? '#ffcc33' :
    d > 1 ? '#ffff33' :
    '#ccff33';
}

function createFeatures(earthquakeData) {

  function onEachFeature(feature, layer) {
    layer.bindPopup("<h3>" + feature.properties.place +
      "</h3><hr><p>" + new Date(feature.properties.time) + "</p>");
  }

  var earthquakes = L.geoJSON(earthquakeData, {
    pointToLayer: function (earthquakeData, latlng) {
      return L.circle(latlng, {
        radius: earthquakeData.properties.mag * adjustRadius,
        color: getColor(earthquakeData.properties.mag),
        fillOpacity: 1
      });
    },
    onEachFeature: onEachFeature
  });

  createMap(earthquakes);
}

function createBaseLayers() {
  //API url
  urltemplate = "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}";

  var mapids = {
    "Satellite": "mapbox.satellite",
    "Outdoors": "mapbox.outdoors",
    "Comic": "mapbox.comic",
    "Pirates": "mapbox.pirates",
  }

  function basemap(baselayer) {
    return {
      attribution: "Imagery <a href=\"https://www.mapbox.com/\">Mapbox</a>, Data <a href=\"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson\">USGS</a>",
      "maxZoom": 10,
      "id": baselayer,
      "accessToken": API_KEY
    }
  }

  var baseMaps = {}
  for (key in mapids) {
    baseMaps[key] = L.tileLayer(urltemplate, basemap(mapids[key]));
  }

  return baseMaps;
}

function createMap(earthquakes) {

  var baseLayers = createBaseLayers()

  var faultLine = new L.LayerGroup();

  var overlayMaps = {
    Earthquakes: earthquakes,
    FaultLines: faultLine
  };

  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    minZoom: 4,
    maxZoom: 10,
    zoom: mapZoomLevel,
    layers: [baseLayers["Outdoors"], earthquakes, faultLine]
  });

  L.control.layers(baseLayers, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  var faultlinequery = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";

  d3.json(faultlinequery, function (data) {
    L.geoJSON(data, {
      style: function () {
        return {
          color: "orange",
          fillOpacity: 0
        }
      }
    }).addTo(faultLine)
  })

  // Add legend to the map
  var legend = L.control({
    position: 'bottomright'
  });

  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
      mags = [0, 1, 2, 3, 4, 5]

    for (var i = 0; i < mags.length; i++) {
      div.innerHTML +=
        '<span style="background:' + getColor(mags[i] + 1) + '">&nbsp&nbsp&nbsp&nbsp&nbsp</span>&nbsp<span>' +
        mags[i] + (mags[i + 1] ? '&ndash;' + mags[i + 1] + '</span><br>' : '+');
    }
    div.innerHTML += "";
    return div;
  };

  legend.addTo(myMap);

}