mapboxgl.accessToken = 'pk.eyJ1Ijoiam5iMjM4NyIsImEiOiJjamR1ZncxYTQxMmN6MnB0M3hlbGtpcWpqIn0.QHBFO03TkZPynELO1IHmyA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v9',
    zoom: 6,
    center: [-112.622088, 33.878781],
    hash: true
});
var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    zoom: 17
});

map.addControl(geocoder);
map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () {
    //=====GEOCODER POINT
    map.addSource('single-point', {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": []
        }
    });
    map.addLayer({
        "id": "point",
        "source": "single-point",
        "type": "circle",
        "paint": {
            "circle-radius": 10,
            "circle-color": "#007cbf"
        }
    });
    //======GEOCODER POINT
    map.addSource('cablevision_coax', {
        type: "vector",
        url: 'mapbox://jnb2387.0a6ze63c'
    });
    map.addSource('matched', {
        type: "vector",
        url: 'mapbox://jnb2387.8x9mbpt0'
    });
    map.addLayer({
        "id": "cablevision_coax",
        "type": "line",
        "source":"cablevision_coax",
        "source-layer": "cablevision_coax",
        "paint": {
            
            "line-color": "blue",
            "line-width": {"stops": [[9, 1], [13, 2], [19, 10]]}
        }
    }, "road-label-medium");

    map.addLayer({
        "id": "matched_blocks",
        "type": "fill",
        "source": "matched",
        "source-layer": "matched",
        "paint": {
            "fill-opacity": 0.5,
            "fill-color": "red",
            "fill-outline-color": "white"
        }
    }, "road-label-small");
    map.addLayer({
        'id': 'matched_label',
        'type': 'symbol',
        'source': 'matched',
        "source-layer": "matched",
        "minzoom": 14.5,
        'layout': {
            'text-field': '{census_blk}',
            'text-size': 12//{"stops": [[14, 12], [16, 11], [19, 10]]},
        },
        'paint': {
            'text-color': 'lightblue',
            'text-halo-color': 'black',
            'text-halo-width': 1.5
        }
    });

    map.addLayer(
        {
            id: "blocks-highlighted",
            type: "fill",
            source: "matched",
            "source-layer": "matched",
            paint: {
                "fill-outline-color": "white",
                "fill-color": "yellow",
                "fill-opacity": 0.75
            },
            "filter": ["==", "census_blk", ""]
        },'matched_label');
    map.on('click', function (e) {
        var features =  map.queryRenderedFeatures(e.point)
        console.log('Layer Name:', features[0].layer.id)
        console.log('Layer Properties:', features[0].properties)

        
                 map.setFilter('blocks-highlighted', ['==', 'census_blk', features[0].properties.census_blk]);
           
                // map.setFilter('block-hightlighted', ['==', 'matched', ''])
            
        });

    // var features = map.queryRenderedFeatures(e.point,{layers: ['matched']});

    // console.log('Layer id: ', features[0].layer.id)
    // console.log("layer properties: " , features[0].properties)

    // });
    geocoder.on('result', function (ev) {
        map.getSource('single-point').setData(ev.result.geometry);
    });
});

var toggleableLayerIds = [ 'matched_blocks', 'cablevision_coax', 'blocks-highlighted', 'matched_label' ];

for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];

    var link = document.createElement('a');
    link.href = '#';
    link.className = 'active';
    link.textContent = id;

    link.onclick = function (e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();

        var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

        if (visibility === 'visible') {
            map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            this.className = '';
        } else {
            this.className = 'active';
            map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
        }
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}


