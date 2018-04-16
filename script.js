mapboxgl.accessToken = 'pk.eyJ1IjoiYnJhZGxleTIzODciLCJhIjoiY2pnMTk0ZTk2NmJzOTJxbnZpMjl1ZGsxbiJ9.L-BSY_VjUrkHL3ov0OciKQ';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v9',
    zoom: 6,
    center: [-76.249, 42.958],
    hash: true,
});
map.addControl(new mapboxgl.NavigationControl());

var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    bbox: [-80.0744, 40.3977, -72.4389, 44.9656],
});
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

var coords;
var popup; // SO WE CAN GRAB THE POPUP FROM ANYWHERE
var datatable;
var dataArr = [];

map.on('load', updateGeocoderProximity); // set proximity on map load
map.on('moveend', updateGeocoderProximity); // and then update proximity each time the map moves

function updateGeocoderProximity() {
    if (map.getZoom() > 9) {
        var center = map.getCenter().wrap(); // ensures the longitude falls within -180 to 180 as the Geocoding API doesn't accept values outside this range
        geocoder.setProximity({
            longitude: center.lng,
            latitude: center.lat
        });
    } else {
        geocoder.setProximity(null);
    }
}

map.on('load', function() {
    // //=====GEOCODER POINT
    map.addSource('single-point', {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": []
        }
    });
    map.addLayer({
        "id": "geocodepoint",
        "source": "single-point",
        "type": "circle",
        "paint": {
            "circle-radius": 12,
            "circle-color": "blue"
        }
    });
    geocoder.on('result', function(ev) {
        if (popup) {
            popup.remove()
        } //REMOVE ANY POPUPS ON MAP

        map.getSource('single-point').setData(ev.result.geometry);
    });

    //all addresses
    map.addSource('alladdresses', {
        type: "vector",
        url: 'mapbox://jwhite0702.dtcfui2h'
    });
    map.addLayer({
        'id': 'NY_Addresses',
        'type': 'circle',
        'source': 'alladdresses',
        'source-layer': 'output',
        'paint': {
            // make circles larger as the user zooms from z12 to z22
            'circle-radius': {
                'base': 1,
                'stops': [
                    [13, 1],
                    [22, 8]
                ]
            },
            // color circles by ethnicity, using a match expression
            // https://www.mapbox.com/mapbox-gl-js/style-spec/#expressions-match
            'circle-color': 'yellow'
        },
        "filter": ["==", "STATE", 'NY']
    }, 'place-suburb');

    map.addLayer({
        'id': 'NY_Addresses_label',
        'type': 'symbol',
        'source': 'alladdresses',
        "source-layer": "output",
        "minzoom": 16,
        'layout': {
            'text-field': '{STREETNUM} {STREETNAME} \n {CITY}',
            'text-size': 13,
            "symbol-spacing": 500000,
            "text-font": ["Open Sans Regular"],
            "text-anchor": "center",
            "text-justify": "center"

        },
        'paint': {
            'text-color': 'white',
            'text-halo-color': 'black',
            'text-halo-width': 1.5
        },
        "filter": ["==", "STATE", 'NY']
    });

    map.addSource('nysam13', {
        type: "vector",
        url: 'mapbox://jnb2387.af6mtbd9'
    });
    map.addLayer({
        'id': 'nysam',
        'type': 'circle',
        'source': 'nysam13',
        'source-layer': 'ny_ogr',
        'paint': {
            // make circles larger as the user zooms from z12 to z22
            'circle-radius': {
                'base': 1,
                'stops': [
                    [13, 1],
                    [14, 2],
                    [22, 8]
                ]
            },
            'circle-color': 'blue'
        }
    }, 'place-suburb');

    map.addLayer({
        'id': 'nysam13label',
        'type': 'symbol',
        'source': 'nysam13',
        "source-layer": "ny_ogr",
        "minzoom": 16,
        'layout': {
            'text-field': '{addresslabel}, \n {citytownname}',
            'text-size': 13,
            "symbol-spacing": 500000,
            "text-font": ["Open Sans Regular"],
            "text-anchor": "center",
            "text-justify": "center"

        },
        'paint': {
            'text-color': 'white',
            'text-halo-color': 'black',
            'text-halo-width': 1
        }
    });

    // // County Tile layer
    map.addSource('county', {
        "type": "vector",
        "url": 'mapbox://jnb2387.65a0agqb'

    });
    map.addLayer({
        "id": "county",
        'type': 'fill',
        "source": 'county',
        'source-layer': 'countywgs84-2qsg7w',
        // 'minzoom':14,
        "layout": {
            'visibility': 'none',
        },
        "paint": {
            'fill-color': 'red',
            'fill-opacity': 0.5,
            'fill-outline-color': 'white'
        }
    }, 'place-suburb');
    map.addLayer({
        'id': 'countylabel',
        'type': 'symbol',
        'source': 'county',
        "source-layer": "countywgs84-2qsg7w",
        "minzoom": 7,
        'layout': {
            'text-field': '{NAME} County',
            'text-size': 18,
            "symbol-spacing": 500000,
            "text-font": ["Open Sans Regular"],
            //"text-anchor": "center",
            //"text-justify": "center",
            'visibility': 'none'
        },
        'paint': {
            'text-color': 'black',
            'text-halo-color': 'red',
            'text-halo-width': 1.5
        }
    }, 'place-suburb');

    // ZipCode Tile layer
    map.addSource('zip', {
        "type": "vector",
        "url": 'mapbox://jnb2387.ct82c8j8'

    });
    // ZipCode label Tile layer
    map.addLayer({
        'id': 'ziplabel',
        'type': 'symbol',
        'source': 'zip',
        "source-layer": "ny_zips-4vg7jg",
        "minzoom": 7,
        'layout': {
            'text-field': '{zip_code}',
            'text-size': 15,
            "symbol-spacing": 500000,
            "text-font": ["Open Sans Regular"],
            "text-anchor": "center",
            "text-justify": "center",
            'visibility': 'none'
        },
        'paint': {
            'text-color': 'white',
            'text-halo-color': 'blue',
            'text-halo-width': 1.5
        }
    });
    map.addLayer({
        "id": "NY_ZIPCODES",
        "type": "line",
        "source": 'zip',
        'source-layer': 'ny_zips-4vg7jg',
        "layout": {
            "line-join": "round",
            "line-cap": "round",
            'visibility': 'none'

        },
        "paint": {
            "line-color": "blue",
            "line-width": 2
        }
    }, 'place-suburb');



    map.on('click', 'county', function(e) {
        var coordinates = e.features[0].geometry.coordinates;
        var description = e.features[0].properties.NAME;
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(description)
            .addTo(map);
    });


    map.on('click', function(e) {
        $('#listings').hide();

        if (map.getZoom() > 10) {

            popup = new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(e.lngLat.lng + " <button id='lng' class='copybtn'>Copy</button><br>" + e.lngLat.lat + " <button class='copybtn' id='lat'>Copy</button>") //+"<br>"+e.lngLat.lat +" <button id='lat' onclick="+copyToClipboard(e.lngLat.lat)+">Copy</button>") 
                .addTo(map);
            $(document).on('click', '#lng', function() {
                $('#lat').html("Copy");
                $('#lng').html("Copied");

                copyToClipboard(e.lngLat.lng);
            });
            $(document).on('click', '#lat', function() {
                $('#lng').html("Copy");
                $('#lat').html("Copied");
                copyToClipboard(e.lngLat.lat);
            });

        }
    });





}); // END MAP LOAD


var toggleableLayerIds = ['NY_Addresses', 'nysam', 'county', 'NY_ZIPCODES'];

for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];

    var link = document.createElement('a');
    link.href = '#';
    link.className = 'active';
    link.textContent = id;

    //Because these two layers are not visible when first loaded
    if (id === 'county' || id === 'NY_ZIPCODES') {
        link.className = '';
    }


    link.onclick = function(e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();



        var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

        if (visibility === 'visible') {
            if (clickedLayer == 'NY_ZIPCODES') {
                map.setLayoutProperty('ziplabel', 'visibility', 'none');
            }
            if (clickedLayer == 'nysam') {
                map.setLayoutProperty('nysamlabel', 'visibility', 'none');
            }
            if (clickedLayer == 'county') {
                map.setLayoutProperty('countylabel', 'visibility', 'none');
            }
            if (clickedLayer == 'NY_Addresses') {
                map.setLayoutProperty('NY_Addresses_label', 'visibility', 'none');
            }
            map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            this.className = '';
        } else {
            if (clickedLayer == 'NY_ZIPCODES') {
                map.setLayoutProperty('ziplabel', 'visibility', 'visible');
            }
            if (clickedLayer == 'NY_Addresses') {
                map.setLayoutProperty('NY_Addresses_label', 'visibility', 'visible');
            }
            if (clickedLayer == 'county') {
                map.setLayoutProperty('countylabel', 'visibility', 'visible');
            }
            if (clickedLayer == 'nysam') {
                map.setLayoutProperty('nysamlabel', 'visibility', 'visible');
            }
            this.className = 'active';
            map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
        }
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}


function copyToClipboard(elementId) {
    // Create a "hidden" input
    var aux = document.createElement("input");
    // Assign it the value of the specified element
    aux.setAttribute("value", elementId);
    // Append it to the body
    document.body.appendChild(aux);
    // Highlight its content
    aux.select();
    // Copy the highlighted text
    document.execCommand("copy");
    // Remove it from the body
    document.body.removeChild(aux);

}

$('#showtable').click(function(e){
    $('#map').width('60%')
    $('#tablepanel').show();
    $('.geocodersdiv').animate({
        'left': "-15%" //moves left
    });

});
$('#hidetable').click(function(e) {
    $('#map').width('100%')
    $('#tablepanel').hide();
    $('.geocodersdiv').animate({
        'left': "0%" //moves left
    });

})


$('#street').keypress(function(e) {
    if (e.which == 13) { //Enter key pressed
        $('#streetbtn').click(); //Trigger search button click event
    }
});


$("#streetbtn").click(function() {
    $('#streetbtn').html('Searching');
    if ($('#table td').is(':visible')) {
        dataArr = [];
    }
    var street = document.getElementById('street').value;
    $.ajax({
        url: 'http://nyapi.herokuapp.com/bbox/v1/{table}?address=' + street,
        success: function(result) {
            $('#streetbtn').html('Find Street Names');
            $.each(result, function(index, property) {
                dataArr.push(property);
            });

            datatable = $("#table").DataTable({
                data: dataArr,
                destroy: true,
                dataSrc: "",
                columns: [{
                    data: "address"
                }, {
                    data: "lon"
                }, {
                    data: "lat"
                }],
                "select": true,
                autoWidth: false,
                scrollY: "75vh",
                scrollX: "100%",
                "jQueryUI": true,
                search: {
                    caseInsensitive: true
                },
                paging: true,
                info: true,
                lengthMenu: [10, 20, 50, 100]
            });

            $('#table tbody').on('click', 'tr', function() {
                console.log(this);
                var clickedaddress = [];
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');

                } else {
                    $('tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                    var ids = $.map(datatable.rows('.selected').data(), function(item) {
                        var coords = [item.lon, item.lat]; //set the coords to the lon and lat field of the clicked row.
                        flyToStore(item); //Run the flyToStore functions with the clicked item properties

                    });

                }
            });



            //When the row is clicked from the datatable flyto function and point is added based off the lon and lat of the clicked row
            function flyToStore(currentFeature) {
                if (map.getSource('single-points')) {
                    map.removeLayer('geocodepoints');
                    map.removeSource('single-points');
                }
                var coords = [currentFeature.lon, currentFeature.lat];
                map.flyTo({
                    center: [coords[0] + 0.0013, coords[1]], //Move the center of the fly to 0.0013 degrees to the west to center in half screen
                    zoom: 16.5
                });
                map.addSource('single-points', {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": []
                    }
                });
                map.addLayer({
                    "id": "geocodepoints",
                    "source": "single-points",
                    "type": "circle",
                    "paint": {
                        "circle-radius": 10,
                        "circle-color": "red"
                    }
                }, 'NY_Addresses_label');
                var nypoint = {
                    "type": "Point",
                    "coordinates": coords
                };
                map.getSource('single-points').setData(nypoint);
            }
        }
    });
});