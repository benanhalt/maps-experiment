$(function() {
    "use strict";
    var mapOptions = {
        center: new google.maps.LatLng(0, 0),
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    window.map = new google.maps.Map(document.getElementById("map_canvas"),
                                  mapOptions);

    var rowsPerFetch = 100;
    var fetched = 0;
    var urlBase = "http://129.237.201.94:443/solr/core1/select?indent=on&fq=&fl=l1%2Cl11&qt=&wt=json&explainOther=&hl.fl=&q=*&rows=" + rowsPerFetch;

    var globalTree = QuadTree.global();

    function fetchMore() {
        $.ajax({url: urlBase + "&start=" + fetched,
                jsonp: 'json.wrf',
                dataType: 'jsonp'
               }).done(function(data) {
                   if (data.response.docs.length < 1) return;
                   fetched += data.response.docs.length;
                   $('#stats-total').text(fetched);
                   _.each(data.response.docs, function(doc) {
                       var docLatLng = new google.maps.LatLng(doc.l1, doc.l11);
                       tryPlaceMarker(docLatLng);
                       globalTree.insert(docLatLng);
                   });
                   $('#stats-visible').text( _.size(markersLatLngs));
                   fetchMore();
               });
    }

    var bounds;
    var markersLatLngs = {};
    var treeStack = [];
    var processed = 0, processing = false;
    var rects = [];

    function tryPlaceMarker(point) {
        if (bounds.contains(point)) {
            var latlngstr = point.toString();
            if (!markersLatLngs[latlngstr]) {
                markersLatLngs[latlngstr] = new google.maps.Marker({ position: point, map: map });
            }
        }
    }

    function restartProcessing() {
        processed = 0;
        treeStack = [globalTree];
        if (!processing) {
            processing = true;
            _.defer(stepTree);
        }
        _.each(rects, function(rect) { rect.setMap(null); });
        rects = [];
    }

    function stepTree() {
        if (treeStack.length < 1) {
            processing = false;
            return;
        }

        var tree = treeStack.shift();
        var rect = new google.maps.Rectangle();
        rect.setOptions({
            map: window.map,
            bounds: tree.boundary,
            fillOpacity: 0.0
        });
        rects.push(rect);

        if (bounds.intersects(tree.boundary)) {
            _.each(tree.points, tryPlaceMarker);
            $('#stats-processed').text(processed += tree.points.length);
            $('#stats-visible').text( _.size(markersLatLngs));
            if (tree.nw) {
                treeStack.push(tree.nw, tree.ne, tree.sw, tree.se);
            }
        }
        setTimeout(stepTree, 0);
    }

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

    google.maps.event.addListener(map, 'bounds_changed', function() {
        bounds = map.getBounds();
        removeInvisibleMarkers();
        restartProcessing();
    });

    _.delay(fetchMore, 1000);
});
