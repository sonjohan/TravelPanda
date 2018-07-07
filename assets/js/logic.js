$(document).ready(function () {

    // Main object
    var travelPanda = {
        origin: {
            name: localStorage.getItem('origin'),
            coords: {
                lat: 0,
                lng: 0
            }
        },
        destination: {
            name: localStorage.getItem('destination'),
            coords: {
                lat: 0,
                lng: 0
            }
        },
        availableTags: [],
        destinationQuery: {},
        originQuery: {},
        queryType: false,

        // Search API with suggested results
        callSearchApi: function (val) {
            var queryURL = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
                + val + '.json?access_token=pk.eyJ1Ijoic29uam9oYW4iLCJhIjoiY2pqMHNuaXpxMGh5dzNrbzR4dDhjazRsMCJ9.Uk7w4H_ayd295uZifRYCbg&autocomplete=true';
            $.ajax({
                url: queryURL,
                method: 'GET'
            }).then(function (response) {
                travelPanda.availableTags = [];
                if (travelPanda.queryType) {
                    travelPanda.destinationQuery = response;
                } else if (!travelPanda.queryType) {
                    travelPanda.originQuery = response;
                };
                for (i = 0; i < response.features.length; i++) {
                    travelPanda.availableTags.push(response.features[i].place_name);
                };
                console.log(travelPanda.availableTags);
                $(function () {
                    $("#origin-input").autocomplete({
                        source: travelPanda.availableTags
                    });
                    $("#destination-input").autocomplete({
                        source: travelPanda.availableTags
                    });
                });
            });
        },

        // Change values to localStorage and updates the values of our main object
        changeSearchVals: function () {
            localStorage.setItem('origin', $('#origin-input').val().trim());
            localStorage.setItem('destination', $('#destination-input').val().trim());
            this.origin.name = localStorage.getItem('origin');
            this.destination.name = localStorage.getItem('destination');
        },

        // Clears input fields
        clearInputs: function () {
            $('#origin-input').val('');
            $('#destination-input').val('');
        },

        // Sets the titles for each section depending on the destination picked
        setTitles: function () {
            let cityName = this.destination.name.split(',')
            $('#welcome-message > h2').text('Welcome to ' + cityName[0] + '!');
            $('#weather-message > h4').text('Weather in ' + cityName[0] + '.');
            $('#todo-message > h4').text('This is what is happening in ' + cityName[0] + '.');
        },

        setCoords: function (val, val2) {
            let arr = localStorage.getItem('originCoords').split(',');
            this.origin.coords.lat = arr[0];
            this.origin.coords.lng = arr[1];
            let arr2 = localStorage.getItem('destinationCoords').split(',');
            this.destination.coords.lat = arr2[0];
            this.destination.coords.lng = arr2[1];
            console.log(this.origin.coords);
            console.log(this.destination.coords);
        },

        getCoords: function (val, val2) {
            this.setCoords();
            if (travelPanda.originQuery.features != undefined) {
                for (i = 0; i < travelPanda.originQuery.features.length; i++) {
                    if (travelPanda.originQuery.features[i].place_name === val) {
                        localStorage.setItem('originCoords', travelPanda.originQuery.features[i].center);
                    };
                };
                for (i = 0; i < travelPanda.destinationQuery.features.length; i++) {
                    if (travelPanda.destinationQuery.features[i].place_name === val2) {
                        localStorage.setItem('destinationCoords', travelPanda.destinationQuery.features[i].center);
                    };
                };
            };
        },

        setMap: function () {

            this.getCoords();

            
            mapboxgl.accessToken = 'pk.eyJ1Ijoic29uam9oYW4iLCJhIjoiY2pqMHNuaXpxMGh5dzNrbzR4dDhjazRsMCJ9.Uk7w4H_ayd295uZifRYCbg';
            var map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v9',
                center: [-96, 37.8],
                maxZoom: 19,
                minZoon: 10
            });

            var route = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [this.origin.coords.lat, this.origin.coords.lng],
                            [this.destination.coords.lat, this.destination.coords.lng]
                        ]
                    }
                }]
            };

            var point = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [this.origin.coords.lat, this.origin.coords.lng]
                    }
                }]
            };

            // markers set to fit Bounds
            var markers = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "Point",
                        "coordinates": 
                            [this.destination.coords.lat, this.destination.coords.lng]
                        
                    }
                }, {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [this.origin.coords.lat, this.origin.coords.lng]
                    }
                }]
            };
            var bounds = new mapboxgl.LngLatBounds();
            markers.features.forEach(function (feature) {
                bounds.extend(feature.geometry.coordinates);
            });
            map.fitBounds(bounds, {padding: 40});

            var lineDistance = turf.lineDistance(route.features[0], 'kilometers');
            var arc = [];

            var steps = 500;

            // Draw an arc between the `origin` & `destination` of the two points
            for (var i = 0; i < lineDistance; i += lineDistance / steps) {
                var segment = turf.along(route.features[0], i, 'kilometers');
                arc.push(segment.geometry.coordinates);
            }

            // Update the route with calculated arc coordinates
            route.features[0].geometry.coordinates = arc;

            // Used to increment the value of the point measurement against the route.
            var counter = 0;

            map.on('load', function () {

                // Add a source and layer displaying a point which will be animated in a circle.
                map.addSource('route', {
                    "type": "geojson",
                    "data": route
                });

                map.addSource('point', {
                    "type": "geojson",
                    "data": point
                });

                map.addLayer({
                    "id": "route",
                    "source": "route",
                    "type": "line",
                    "paint": {
                        "line-width": 2,
                        "line-color": "#007cbf"
                    }
                });

                map.addLayer({
                    "id": "point",
                    "source": "point",
                    "type": "symbol",
                    "layout": {
                        "icon-image": "airport-15",
                        "icon-rotate": ["get", "bearing"],
                        "icon-rotation-alignment": "map",
                        "icon-allow-overlap": true
                    }
                });

                function animate() {
                    // Update point geometry to a new position based on counter denoting
                    // the index to access the arc.
                    point.features[0].geometry.coordinates = route.features[0].geometry.coordinates[counter];

                    // Calculate the bearing to ensure the icon is rotated to match the route arc
                    // The bearing is calculate between the current point and the next point, except
                    // at the end of the arc use the previous point and the current point
                    point.features[0].properties.bearing = turf.bearing(
                        turf.point(route.features[0].geometry.coordinates[counter >= steps ? counter - 1 : counter]),
                        turf.point(route.features[0].geometry.coordinates[counter >= steps ? counter : counter + 1])
                    );

                    // Update the source with this new data.
                    map.getSource('point').setData(point);

                    // Request the next frame of animation so long the end has not been reached.
                    if (counter < steps) {
                        requestAnimationFrame(animate);
                    }

                    counter = counter + 1;
                }

                // Start the animation.
                animate(counter);
            });
        }
    };

    //Set Title for the destination picked on inde
    travelPanda.setCoords();
    // travelPanda.callSearchApi(localStorage.getItem('destination'));
    travelPanda.setTitles();
    travelPanda.setMap();

    // Search button
    $('#search-button').on('click', function () {
        event.preventDefault();

        travelPanda.getCoords($('#origin-input').val().trim(), $('#destination-input').val().trim());
        // Change the values of the search
        travelPanda.changeSearchVals();
        // clear inputs
        travelPanda.clearInputs();
        // Change titles
        travelPanda.setTitles();
        travelPanda.setMap();
    });

    // Sets the suggestions for origin field
    $('#origin-input').keyup(function () {
        travelPanda.queryType = false;
        travelPanda.callSearchApi($(this).val().trim());
    });

    // Sets the suggestions for destination field
    $('#destination-input').keyup(function () {
        travelPanda.queryType = true;
        travelPanda.callSearchApi($(this).val().trim());
    });
});