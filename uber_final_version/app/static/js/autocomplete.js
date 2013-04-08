//Useful links:
// http://code.google.com/apis/maps/documentation/javascript/reference.html#Marker
// http://code.google.com/apis/maps/documentation/javascript/services.html#Geocoding
// http://jqueryui.com/demos/autocomplete/#remote-with-cache
      
var geocoder;
var map;
var marker;
    
function initialize(){

  // var map = new google.maps.Map(document.getElementById('map')); 

  // var burnsvilleMN = new google.maps.LatLng(44.797916,-93.278046); 

  // // map.setCenter(burnsvilleMN, 8); 
  // var marker = new google.maps.Marker({
  //         position: burnsvilleMN, 
  //         map: map, 
  //         title:"Hello World!"
  //     }); 
  //GEOCODER
  geocoder = new google.maps.Geocoder();
        

        
}
    
$(document).ready(function() { 
         
  initialize();
                alert('here');

  $(function() {
    $("#address").autocomplete({
      //This bit uses the geocoder to fetch address values
      source: function(request, response) {
        geocoder.geocode( {'address': request.term }, function(results, status) {
          response($.map(results, function(item) {
            return {
              label:  item.formatted_address,
              value: item.formatted_address,
              latitude: item.geometry.location.lat(),
              longitude: item.geometry.location.lng()
            }
          }));
        })
      },
      //This bit is executed upon selection of an address
      select: function(event, ui) {
        alert(ui.item.longitude);
        $("#lat").val(ui.item.latitude);
        $("#long").val(ui.item.longitude);
        // var location = new google.maps.LatLng(ui.item.latitude, ui.item.longitude);
        // marker.setPosition(location);
        // map.setCenter(location);
      }
    });
  });
  
  //Add listener to marker for reverse geocoding
  // google.maps.event.addListener(marker, 'drag', function() {
  //   geocoder.geocode({'latLng': marker.getPosition()}, function(results, status) {
  //     if (status == google.maps.GeocoderStatus.OK) {
  //       if (results[0]) {
  //         $('#address').val(results[0].formatted_address);
  //         $('#latitude').val(marker.getPosition().lat());
  //         $('#longitude').val(marker.getPosition().lng());
  //       }
  //     }
  //   });
  // });
  
});
