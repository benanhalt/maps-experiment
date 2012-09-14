function QuadTree(boundary) {
    this.boundary = boundary;
    this.points = [];
    // var rect = new google.maps.Rectangle();
    // rect.setOptions({
    //     map: window.map,
    //     bounds: this.boundary,
    //     fillOpacity: 0.0
    // });
}

QuadTree.POINTS_PER_NODE = 100;

_.extend(QuadTree.prototype, {
    insert: function(point) {
        if (!this.boundary.contains(point)) return false;
        if (this.points.length < QuadTree.POINTS_PER_NODE) {
            this.points.push(point);
            return true;
        }
        if (!this.nw) this.subdivide();
        if (this.nw.insert(point)) return true;
        if (this.ne.insert(point)) return true;
        if (this.sw.insert(point)) return true;
        if (this.se.insert(point)) return true;
        return false;
    },
    subdivide: function() {
        var ne = this.boundary.getNorthEast();
        var sw = this.boundary.getSouthWest();

        var mlat = (sw.lat() + ne.lat())/2;
        var mlng = (sw.lng() + ne.lng())/2;

        this.nw = new QuadTree(
            new google.maps.LatLngBounds(
                new google.maps.LatLng(mlat, sw.lng()),
                new google.maps.LatLng(ne.lat(), mlng)));

        this.ne = new QuadTree(
            new google.maps.LatLngBounds(
                new google.maps.LatLng(mlat, mlng), ne));

        this.sw = new QuadTree(
            new google.maps.LatLngBounds(
                sw, new google.maps.LatLng(mlat, mlng)));

        this.se = new QuadTree(
            new google.maps.LatLngBounds(
                new google.maps.LatLng(sw.lat(), mlng),
                new google.maps.LatLng(mlat, ne.lng())));
    }
});

QuadTree.global = function() {
    return new QuadTree(
        new google.maps.LatLngBounds(
            new google.maps.LatLng(-89.99, -179.99),
            new google.maps.LatLng(89.99, 179.99)))
};
