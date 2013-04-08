//Backbone object/view/collection

var BAM = {
	run: function () {
		this.addview = new this.addView();
		this.listview = new this.listView();
		this.searchview = new this.searchView();
		this.locationscollection = new BAM.locationsCollection();

		this.router = new this.Router();
		Backbone.history.start();
		this.router.navigate('list_locations', {trigger: true});	
	}
};

BAM.Router = Backbone.Router.extend({
	routes: {
		'list_locations': 	'renderListLocationsPage', 
		'add_new_location': 	'renderAddNewLocationPage', 
		'search_locations': 	'renderSearchLocationsPage', 
		'edit_location/:id': 'renderEditLocationPage'		
	}, 

	renderAddNewLocationPage: function () {
		$("#location1").hide();
		BAM.addview.addLocationPage();
	}, 

	renderListLocationsPage: function () {
		$("#location1").show();
		var ownerid = $('#ownerid').val();
		var filters = [{"name": "ownerid", "op": "==", "val": ownerid}];

		BAM.listview.setElement('div.abPanel');
		BAM.listview.listLocationsPage(filters);
	}, 

	renderSearchLocationsPage: function () {
		BAM.searchview.searchLocationsPage();
	}, 

	renderEditLocationPage: function (id) {
		$("#location1").hide();		
		BAM.addview.addLocationPage(id);
	}
});

BAM.locationModel = Backbone.Model.extend({
	sync: function (method, model, options) {
		// Creation or Update flow
		if (method === 'create' || method === 'update') {
			
			if(method == 'create'){
				var method_type = 'POST';
				var uri = '../api/location';
			}else if ( method == 'update'){
				var method_type = 'PATCH';
				var uri = '../api/location/'+this.get('id');				
			}
			var json = {
					name: (this.get('name') || ''), 
					address: (this.get('address') || ''),
					lat: parseFloat(this.get('lat') || '0'), 
					long: parseFloat(this.get('long') || '0'),
					ownerid: parseInt(this.get('ownerid') || '')
				}            
			return $.ajax({
				type : method_type,
				dataType: 'json',
				contentType: "application/json",
				url: uri, 
				data: JSON.stringify(json), 
				success: function (data) {					
					BAM.router.navigate('list_locations', {trigger: true});
				}
			});
		} else if (method === 'delete') {
			var id = this.get('id');
			var json = { id: id };
			return $.ajax({
				type : 'DELETE',
				url: '../api/location/'+id, 
				success: function (data) {
					$('#locationsGrid tr[data-id="' + id + '"]').hide('slow');
				}
			});
		}
	}
});

/* collection of location */
BAM.locationsCollection = Backbone.Collection.extend({
	model: BAM.locationModel, 	
	url: '../api/location',
	parse: function(data) {
		this.page=data.page;
		return data.objects;
	}    
});

/* addNewLocation View */
BAM.addView = Backbone.View.extend({
	el: 'div.abPanel', 

	template: _.template($('#addLocationTemplate').html()), 

	initialize: function () {
		_.bindAll(this, 'addLocationPage', 'addLocation');
	}, 

	addLocationPage: function (id) {
		var location = {},
		model = BAM.locationscollection.get(id);

		if (id !== undefined && model !== undefined) {
			location = model.toJSON();
		}
		this.$el.html(this.template({location: location}));
	},

	addLocation: function (event) {

		if( $('#name').val() ==="" ||
				$('#address').val() ==="" ||
				$('#lat').val() ==="" ||
				$('#long').val() ===""
			){
			alert("Address invalid");
			return false;
		}

		var name = $('#name').val(), 
			address = $('#address').val(), 
			lat = $('#lat').val(), 
			long = $('#long').val(), 
			id = $('#id').val();
			ownerid = $('#ownerid').val();

		if (id === '') {
			var locationmodel = new BAM.locationModel({
				name: name, 
				lat: lat, 
				long: long, 
				address: address,
				ownerid: ownerid

			});
		} else {
			var locationmodel = new BAM.locationModel({
				id: id, 
				name: name, 
				lat: lat, 
				long: long, 
				address: address,
				ownerid: ownerid
			});	
		}
		locationmodel.save();
		return false;
	},

	events: {
		'submit form#frmAddLocation': 'addLocation',
		'focus #address': 'getAutocomplete',
	},


	//Autocomplete => call to the Google Maps API
	getAutocomplete: function () {
		$("#address").autocomplete({
			source: $.proxy(function(request, response) {
					// if (this.geocoder === null) {
						this.geocoder = new google.maps.Geocoder();
					// }

					this.geocoder.geocode(
						{
							'address': request.term
						},
						function(results, status) {
							emptyResults = [{
								formatted_address: "No results found"
							}];

							var emptyResponseData = $.map(emptyResults, function(loc) {
								return {
									label  : loc.formatted_address,
									value  : loc.formatted_address,
									googleLocationOBJ : {}
								};
							});

							if (status != google.maps.GeocoderStatus.OK) {
								response(emptyResponseData);
							} else {
								var responseData = $.map(results, function(loc) {
									var returnDict = {};
									for (var i = 0; i < loc.address_components.length; i++) {
										var component = loc.address_components[i];
										returnDict[component.types[0]] = {
												short_name: component.short_name,
												long_name: component.long_name
											};
									}

									if(typeof returnDict["country"] == "undefined"){
										return false;
									}
						

									//We are only allowing address where specificity is equal to route or street_address
									if(
										loc.types[0] == "street_address"||
										loc.types[0] == "route"  
									){
										returnDict["specificity"] = loc.types[0];
										returnDict["lat"]         = loc.geometry.location.lat();
										returnDict["long"]        = loc.geometry.location.lng();
										returnDict["formatted"]   = loc.formatted_address;

										return {
											label  : returnDict["formatted"],
											value  : returnDict["formatted"],
											googleLocationOBJ : returnDict
										};
									}
								});

								if(responseData.length < 1){
									response(emptyResponseData);
								} else {
									response(responseData);
									console.log(responseData);
								}
							}
						}
					);
				},this),
			
				select: function(event, ui) {
					$("#lat").val(ui.item.googleLocationOBJ.lat);
					$("#long").val(ui.item.googleLocationOBJ.long);
				}
			

		});
	},

});

/* Default map */
BAM.Map = Backbone.Model.extend({
  defaults: {
	center: new google.maps.LatLng(-34.397, 150.644),
	zoom: 8,
	mapTypeId: google.maps.MapTypeId.ROADMAP
  }
});


BAM.MapView = Backbone.View.extend({
	el: '#map',

	initialize: function() {

		var mapOptions = {
				  zoom: 8,
				  center: new google.maps.LatLng(-34.397, 150.644),
				  mapTypeId: google.maps.MapTypeId.ROADMAP
				};
		this.map = new google.maps.Map(
			this.el,
			mapOptions
		);

		var marker, i;
		var locations = this.options;
		// console.log(this.options);
		var infowindow =  new google.maps.InfoWindow({
		    content: ''
		});


		for (i = 0; i < locations.length; i++) {  
			marker_obj = new google.maps.Marker({
				position: new google.maps.LatLng(locations[i]['lat'], locations[i]['long']),
				clickable:true,
				map: this.map,
				title: 'title'

			});

			//Putting pins on the map
			this.bindInfoWindow(marker_obj, this.map, infowindow, 'Location name: <b>'+locations[i]['name']+' </b><br />Address: <b>'+locations[i]['address']+'</b>');
			
			//We center the map to the last marker from the collection
			this.map.setCenter(new google.maps.LatLng(locations[i]['lat'], locations[i]['long']), 13);

		}

		this.render();
	},

	bindInfoWindow: function (marker, map, infowindow, html) {
    	google.maps.event.addListener(marker, 'click', function() {
        	infowindow.setContent(html);
        	infowindow.open(map, marker);
    	});
	},

	 
	render: function() {
		return this;
	}
});

/* listLocations View */
BAM.listView = Backbone.View.extend({
	el: 'div.abPanel', 

	template: _.template($('#listLocationsTemplate').html()), 

	initialize: function () {
		_.bindAll(this, 'listLocationsPage', 'render');
	}, 

	render: function (response) {
		var self = this;

		this.$el.html(this.template({locations: response.objects}));

		BAM.map = new BAM.Map();
		BAM.mapView = new BAM.MapView(response.objects);

		$('#locationsGrid tr[data-id]').each(function () {
			var id = $(this).attr('data-id');			
			$(this).find('a:first').click(function () {
				self.editLocation(id);
			});
			$(this).find('a:last').click(function () {
				self.deleteLocation(id);
			});
			$(this).click(function() {
				self.hoverLocation(id);
			});			
		});
	}, 

	listLocationsPage: function (querystring) {
		var self = this;


		BAM.locationscollection.fetch({
			data: {"q": JSON.stringify({"filters": querystring})},
			success: function (collection, response) {
				self.render(response);
			}
		});
	}, 

	deleteLocation: function (id) {
		if (confirm('Are you sure to delete?')) {
			BAM.locationscollection.get(id).destroy();
		}		
	}, 

	editLocation: function (id) {
		BAM.router.navigate('edit_location/' + id, {trigger: true});
	},

	hoverLocation: function (id) {
		var location = BAM.locationscollection.get(id);
		BAM.mapView.map.setCenter(new google.maps.LatLng(location.get('lat'), location.get('long')));
	}	

});

/* searchLocations View */
BAM.searchView = Backbone.View.extend({
	el: 'div.abPanel', 

	template: _.template($('#searchLocationsTemplate').html()), 

	events: {
		'submit form#frmSearchLocations': 'searchLocations'
	},

	initialize: function () {
		_.bindAll(this, 'searchLocationsPage', 'searchLocations');
	}, 

	searchLocationsPage: function () {
		this.$el.html(this.template);
		BAM.listview.setElement('#grid');
		BAM.listview.render({});
	}, 

	searchLocations: function (event) {
		var ownerid = $('#ownerid').val();
		BAM.listview.setElement('#grid');
		BAM.listview.listLocationsPage({ownerid: ownerid});
		return false;
	}
});


$(document).ready(function() { 
	BAM.run();
});