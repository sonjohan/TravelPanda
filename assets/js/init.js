$(document).ready(function () {

    var travelPanda = {
        availableTags: [],
        destinationQuery: {},
        originQuery: {},
        queryType: false,

        callApi: function (val) {
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

        getCoords: function(val, val2){
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
        }
    };

    // Search button
    $('#search-button').on('click', function () {
        travelPanda.getCoords($('#origin-input').val().trim(), $('#destination-input').val().trim());
        localStorage.setItem('origin', $('#origin-input').val().trim());
        localStorage.setItem('destination', $('#destination-input').val().trim());
    });

    $('#origin-input').keyup(function () {
        travelPanda.queryType = false;
        travelPanda.callApi($(this).val().trim());
    });

    $('#destination-input').keyup(function () {
        travelPanda.queryType = true;
        travelPanda.callApi($(this).val().trim());
    });
});