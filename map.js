$(function() {
    "use strict";
    var mapOptions = {
        center: new google.maps.LatLng(39.397, -90),
        zoom: 6,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    window.map = new google.maps.Map(document.getElementById("map_canvas"),
                                  mapOptions);

    var rowsPerFetch = 1000;
    var processPerStep = 10;
    var urlBase = "http://129.237.201.94:443/solr/core0/select?indent=on&fq=&fl=l1%2Cl11&qt=&wt=json&explainOther=&hl.fl=&q=*&rows=" + rowsPerFetch;
    var docs = [];


    function fetchMore() {
        $.ajax({url: urlBase + "&start=" + docs.length,
                jsonp: 'json.wrf',
                dataType: 'jsonp'
               }).done(function(data) {
                   if (data.response.docs.length < 1) return;
                   docs.push.apply(docs, data.response.docs);
                   startProcessing();
                   _.defer(fetchMore);
               });
    }

    function startProcessing() {
        if (!processing) _.defer(addMarker);
        processing = true;
    }


    var bounds,  ne,  sw,  swlat, swlng ,  nelat, nelng;
    var res = 100;

    var markersLatLngs = {};
    var processing = false;
    var docInd = 0;

    google.maps.event.addListener(map, 'bounds_changed', function() {
        bounds = map.getBounds();
        ne = bounds.getNorthEast();
        sw = bounds.getSouthWest();
        swlat = sw.lat(), swlng = sw.lng();
        nelat = ne.lat(), nelng = ne.lng();
        removeInvisibleMarkers();
        docInd = 0;
        startProcessing();
    });

    function removeInvisibleMarkers() {
        var toDelete = [];
        _.each(markersLatLngs, function(marker, latlngstr) {
            if (!bounds.contains(marker.getPosition())) {
                marker.setMap(null);
                toDelete.push(latlngstr);
            }
        });
        _.each(toDelete, function(latlngstr) { delete markersLatLngs[latlngstr]; });
    }

    function addMarker() {
        if (docInd >= docs.length) {
            processing = false;
            return;
        }

        for(var i = 0; i < processPerStep && docInd < docs.length; i++) {
            var doc = docs[docInd++];
            var docLatlng = new google.maps.LatLng(doc.l1, doc.l11);
            if (bounds.contains(docLatlng)) {
                var latlngstr = docLatlng.toString();
                if (!markersLatLngs[latlngstr]) {
                    markersLatLngs[latlngstr] = new google.maps.Marker({ position: docLatlng, map: map });
                }
            }
        }
        $('#stats-total').text(docs.length);
        $('#stats-processed').text(docInd);
        $('#stats-visible').text( _.size(markersLatLngs));
        _.defer(addMarker);

        // var binnedLat = Math.floor(res * (doc.l1 - swlat) / (nelat - swlat));
        // var binnedLng = Math.floor(res * (doc.l11 - swlng) / (nelng - swlng));
        // var markerInd = binnedLat * res + binnedLng;
        // if (binnedLat >= 0 && binnedLat < res && binnedLng >= 0 && binnedLng < res) {
        //     if (!markers[markerInd]) {
        //         var myLatlng = new google.maps.LatLng(doc.l1, doc.l11);
        //         markers[markerInd] = new google.maps.Marker({
        //             position: myLatlng,
        //             map: map,
        //         });
        //     }
        // }
    }

    _.defer(fetchMore);
});
