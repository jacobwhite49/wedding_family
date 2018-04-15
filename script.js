mapboxgl.accessToken = 'pk.eyJ1IjoiandoaXRlMDcwMiIsImEiOiJjamZ4MHhjMng0dXRrMnFudjQ5emI5a3I3In0.YSkfFwF8_LRPoyOum5SZdg';
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
            "circle-color": "gold"
        }
    });
    geocoder.on('result', function(ev) {
        if (popup) {
            popup.remove()
        } //REMOVE ANY POPUPS ON MAP
        console.log('geocode geometry', ev.result.geometry)
        console.log('geocode ', ev.result)

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
            'text-field': '{STREETNUM} {STREETNAME} {CITY} {STATE}',
            'text-size': 15,
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

    map.addSource('nysam', {
        type: "vector",
        url: 'mapbox://jnb2387.7pk1um63'
    });
    map.addLayer({
        'id': 'nysam',
        'type': 'circle',
        'source': 'nysam',
        'source-layer': 'ny_ogr',
        'paint': {
            // make circles larger as the user zooms from z12 to z22
            'circle-radius': {
                'base': 1,
                'stops': [
                    [13, 1],
                    [22, 8]
                ]
            },
            'circle-color': 'red'
        }
    }, 'place-suburb');

    map.addLayer({
        'id': 'nysamlabel',
        'type': 'symbol',
        'source': 'nysam',
        "source-layer": "ny_ogr",
        "minzoom": 16,
        'layout': {
            'text-field': '{addresslabel}, {citytownname}',
            'text-size': 15,
            "symbol-spacing": 500000,
            "text-font": ["Open Sans Regular"],
            "text-anchor": "center",
            "text-justify": "center"

        },
        'paint': {
            'text-color': 'lightgrey',
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
                .setHTML(e.lngLat.lng + " <button id='lng'>Copy</button><br>" + e.lngLat.lat + " <button id='lat'>Copy</button>") //+"<br>"+e.lngLat.lat +" <button id='lat' onclick="+copyToClipboard(e.lngLat.lat)+">Copy</button>") 
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
    $('#tablepanel').toggle();
    $('.geocodersdiv').animate({
        'left' : "-15%" //moves left
        });

});
$('#hidetable').click(function(e){
    $('#map').width('100%')
    $('#tablepanel').toggle();
    $('.geocodersdiv').animate({
        'left' : "0%" //moves left
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
        dataArr=[];
    } else {
        console.log('not')


    }

    var street = document.getElementById('street').value;

    $.ajax({
        url: 'http://nyapi.herokuapp.com/bbox/v1/{table}?address=' + street,
        success: function(result) {
            $('#streetbtn').html('Search');
            $.each(result, function(index, property) {
                // console.log(JSON.stringify(property.address));
                dataArr.push(property);
            });

            datatable = $("#table").DataTable({
                data: dataArr,
                destroy:true,
                dataSrc: "",
                columns: [{
                    data: "rank"
                }, {
                    data: "address"
                }, {
                    data: "lon"
                }, {
                    data: "lat"
                }],
                // "select": true,
                autoWidth: false,
                //   sPaginationType: "full_numbers",
                scrollY: "70vh",
                scrollX: "100%",
                //   order:false,
                //   scrollCollapse: true,
                // "scrollCollapse": true,
                // "jQueryUI": true,
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
                        console.log(item);
                        var coords = [item.lon,item.lat];
                        flyToStore(item);

                    });

                }
            });


            function createPopUp(currentFeature) {
                var popUps = document.getElementsByClassName('mapboxgl-popup');
                // Check if there is already a popup on the map and if so, remove it
                if (popUps[0]) popUps[0].remove();
                var coords = [currentFeature.lon, currentFeature.lat];
                console.log(coords);
                var popup = new mapboxgl.Popup({
                        closeOnClick: false
                    })
                    .setLngLat(coords)
                    .setHTML('<h3>Clicked Address</h3>' +
                        '<h4>' + currentFeature.address + '</h4>')
                    .addTo(map);
            }

            function flyToStore(currentFeature) {
                if (map.getSource('single-points')) {
                    map.removeLayer('geocodepoints');
                    map.removeSource('single-points');
                    console.log('removed')
                }
                var coords = [currentFeature.lon, currentFeature.lat];
                map.flyTo({
                    center: [coords[0]+ 0.0013, coords[1]],
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
                        "circle-radius": 8,
                        "circle-color": "blue"
                    }
                }, 'NY_Addresses');
                var nypoint = {
                    "type": "Point",
                    "coordinates": coords
                };
                map.getSource('single-points').setData(nypoint);
            }



            // function buildLocationList(data) {

            //     // Iterate through the list of stores
            //     for (i = 0; i < result.length; i++) {
            //         var currentFeature = data[i];
            //         // Shorten data.feature.properties to just `prop` so we're not
            //         // writing this long form over and over again.
            //         var prop = currentFeature;
            //         // Select the listing container in the HTML and append a div
            //         // with the class 'item' for each store
            //         var listings = document.getElementById('listings');
            //         var listing = listings.appendChild(document.createElement('div'));
            //         listing.className = 'item';
            //         listing.id = 'listing-' + i;

            //         // Create a new link with the class 'title' for each store
            //         // and fill it with the store address
            //         var link = listing.appendChild(document.createElement('a'));
            //         link.href = '#';
            //         link.className = 'title';
            //         link.dataPosition = i;
            //         link.innerHTML = prop.address;

            //         // Create a new div with the class 'details' for each store
            //         // and fill it with the city and phone number

            //         link.addEventListener('click', function(e) {
            //             $('#listings').hide();
            //             // Update the currentFeature to the store associated with the clicked link
            //             var clickedListing = data[this.dataPosition];
            //             console.log(clickedListing)
            //                 // 1. Fly to the point associated with the clicked link
            //             flyToStore(clickedListing);
            //             createPopUp(clickedListing);

            //         })
            //     }
            // }
            // // Add an event listener for the links in the sidebar listing

            // buildLocationList(result)


        }
    });
});