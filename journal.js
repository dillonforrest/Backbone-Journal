(function() {

var Journal = function() {

	function getCurrentDate() {
		var today  = new Date(),
				dd     = today.getDate(),
				mmm    = today.getMonth(),
				yyyy   = today.getFullYear(),
				months = {
					0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4:  'May', 5:  'Jun',
					6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec'
				};
		if ( dd < 10 ) dd = '0' + dd;
		mmm = months[mmm];
		today = dd + ' ' + mmm + ' ' + yyyy;
		return today;
	};

	var Models = {};

	var Collections = {
		Entries: Backbone.Collection.extend({
			localStorage: new Store('journal'),
			initialize: function(inputs) {
				this.on('add', this.createPermalink, this);
			},
			createPermalink: function(entry) {
				var title = entry.get('title');
				var permalink = title.replace(/\s+/g, '-').toLowerCase();
				entry.set({permalink: permalink});
			}
		})
	};

	var Views = {
		Home: Backbone.View.extend({
			template: $('#homeview-template').template(),
			events: {
				'click #clear-entries': 'clearEntries'
			},
			initialize: function(inputs) {
				this.entries = inputs.entries;
				this.entries.on('all', this.render, this);
				this.entries.fetch();
			},
			render: function() {
				var currDate = getCurrentDate(),
						innerHtml = $.tmpl(this.template, {
							currDate: currDate,
							numEntries: this.entries.length,
							Entries: this.entries
						});
				this.$el.html(innerHtml);
				this.entries.each(this.addEntry, this);
				return this;
			},
			addEntry: function(entry) {
				// this is for the entry archive on the home page
				var entryView = new this.ArchivedEntry({ model: entry });
				entryView.delegateEvents();
				this.$('#archived-entries').append(entryView.render().el);
			},
			clearEntries: function() {
				var entriesList = this.entries.filter( function(entry) {
					return entry;
				}); // create entriesList to use _.each, for cleaner model destroy
				_.each(entriesList, function(entry){entry.destroy();});
			},

			ArchivedEntry: Backbone.View.extend({
				tagName: 'li',
				template: $('#archivedentryview-template').template(),
				events: {
					'click .show-entry': 'displayEntry'
				},
				render: function() {
					var innerHtml = $.tmpl(this.template, {
						date: this.model.get('date'),
						title: this.model.get('title')
					});
					this.$el.html(innerHtml);
					return this;
				},
				displayEntry: function() {
					window.router.displayEntry(this.model.get('permalink'));
				}

			})
		}),

		NewEntry: Backbone.View.extend({
			template: $('#newentryview-template').template(),
			events: {
				'click button#cancel-new-entry': 'cancelNewEntry',
				'click button#submit-new-entry': 'submitNewEntry'
			},
			initialize: function(inputs) {
				this.entries = inputs.entries;
			},
			render: function() {
				var innerHtml = $.tmpl(this.template);
				this.$el.html(innerHtml);
				return this;
			},
			cancelNewEntry: function() {
				window.router.showHome();
			},
			submitNewEntry: function() {
				var entryTitle = $('#new-entry-title').val(),
						entryDate = getCurrentDate(),
						entryBody = $('#new-entry-body').val()
				this.entries.create({
					title: entryTitle,
					date: entryDate,
					body: entryBody
				});
				window.router.showHome();
			}
		}),

		DisplayEntry: Backbone.View.extend({
			template: $('#displayentryview-template').template(),
			initialize: function(inputs) {
				this.model = inputs.model;
			},
			render: function() {
				var innerHtml = $.tmpl(this.template);
				this.$el.html(innerHtml);
				return this;
			}
		})
	};

	var Router = Backbone.Router.extend({
		initialize: function(inputs) {
			this.entries = new Collections.Entries();
			this.homeView = new Views.Home({entries: this.entries});
			this.newEntryView = new Views.NewEntry({entries: this.entries});
			this.el = inputs.el
		},

		routes: {
			"": 'showHome',
			"#": 'showHome',
			'new': 'writeNewEntry',
			'entry/:permalink': 'displayEntry'
		},
		showHome: function() {
			this.el.empty();
			this.navigate("");
			this.el.append(this.homeView.render().el);
			this.homeView.delegateEvents();
		},
		writeNewEntry: function() {
			this.el.empty();
			this.navigate('new');
			this.el.append(this.newEntryView.render().el);
			this.newEntryView.delegateEvents();
		},
		displayEntry: function(permalink) {
			var Entry = this.entries.find( function(entry) {
				return entry.get('permalink') == permalink;
			});
			var displayEntryView = new Views.DisplayEntry({model:Entry});
			this.el.empty();
			this.navigate('entry/' + displayEntryView.model.get('permalink'));
			this.el.append(displayEntryView.render().el);
			displayEntryView.delegateEvents();
		}
	});

	return {
		Models: Models,
		Collections: Collections,
		Views: Views,
		Router: Router
	}
}

window.loadJournal = function(container) {
	var $container = $(container);
	window.journal = new Journal;
	window.router = new journal.Router({el: $container});
	Backbone.history.start();
}

})();
