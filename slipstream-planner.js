/* slipstream-planner.js
 * https://mouseypounds.github.io/slipstream-planner/
 */

/*jslint indent: 4, maxerr: 50, passfail: false, browser: true, regexp: true, plusplus: true */
/*global $ */

(function ($) {
    $.QueryString = (function (a) {
        var i,
            p,
            b = {};
        if (a === "") { return {}; }
        for (i = 0; i < a.length; i += 1) {
            p = a[i].split('=');
            if (p.length === 2) {
                b[p[0].toLowerCase()] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
        }
        return b;
    }(window.location.search.substr(1).split('&')));
}(jQuery));

window.onload = function () {
	"use strict";

	// Stat info. "base" is the most common value for each.
	var stat = {
		"Health": { "base": 50, "per_lvl": 5, "max_pts": 10, },
		"Shields": { "base": 50, "per_lvl": 5, "max_pts": 10, },
		"Defense": { "base": 8, "per_lvl": 3, "max_pts": 5, },
		"Gunnery": { "base": 10, "per_lvl": 2, "max_pts": 5, },
		"Combat": { "base": 10, "per_lvl": 5, "max_pts": 8, },
		"Repairs": { "base": 10, "per_lvl": 2, "max_pts": 5, },
		"Speed": { "base": 25, "per_lvl": 3, "max_pts": 5, },
	};
	// Crewmate animal types and any non-standard base stats for them
	var animal = {
		"Bear": { "Health": 75, "Combat": 40, "Speed": 22 },
		"Cat": { "Gunnery": 20 },
		"Croc": { "Health": 45, "Shields": 45, "Combat": 25, "Speed": 40 }, 
		"Hamster": { "Health": 40, "Shields": 40, "Repairs": 15, "Speed": 52 },
		"Koala": { "Health": 60, "Speed": 40 },
		"Octo": { "Repairs": 30 },
		"Turtle": { "Shields": 80, "Defense": 22, "Repairs": 13, "Speed": 21 },
	};
	const max_crew_level = 30;
	var selected_crew = "Cat";
	var point_string = '';

	// Process URL parameters
	if ($.QueryString.hasOwnProperty("c") && animal.hasOwnProperty($.QueryString["c"])) {
		selected_crew = $.QueryString["c"];
		$("#crew-select").val(selected_crew);
	}
	if ($.QueryString.hasOwnProperty("n")) {
		$("#name").val($.QueryString["n"]);
	}
	if ($.QueryString.hasOwnProperty("p")) {
		var pts = $.QueryString["p"].split(',');
		var i = 0;
		for (const [key, value] of Object.entries(stat)) {
			if (pts.length <= i) {
				break;
			}
			value['pts'] = Math.max(0, Math.min(value['max_pts'], Number(pts[i++])));
		}
	}

	// Initial input setup
	for (const key of Object.keys(animal)) {
		var extra = (key == selected_crew) ? "selected" : '';
		$("#crew-select").append('<option value="' + key + '"' + extra + '>' + key + '</option>');
	}
	for (const [key, value] of Object.entries(stat)) {
		if (!value.hasOwnProperty("pts")) {
			value['pts'] = 0;
		}
		var html = '<tr class="txt" id="' + key + '-row"><td>' + key + '</td>';
		html += '<td class="num" id="' + key + '-base">' + value.base + '</td>';
		html += '<td class="num" id="' + key + '-curr">' + value.base + '</td>';
		html += '<td class="btn"><button id="' + key + '-clr" type="button" class="clear">Clear</button></td>';
		html += '<td class="btn"><button id="' + key + '-minus" type="button" class="minus">-1</button></td>';
		html += '<td class="num"><span id="' + key + '-pts">' + value.pts + '</span> / ' + value.max_pts + '</td>';
		html += '<td class="btn"><button id="' + key + '-plus" type="button" class="plus">+1</button></td>';
		html += '<td class="btn"><button id="' + key + '-max" type="button" class="max">Max</button></td>';
		html += "</tr>";
		$("#body-stats").append(html);
	}
	update_all();
	
	// Add handlers to input fields.
	$("button").click(function () { button_handler(this); });
	$("select").change(function () { select_handler(this); });
	$("select").on('selectmenuchange', function () { select_handler(this); });
	$("#name").change(function () { name_handler(this); });
	
	function select_handler(e) {
		selected_crew = $(e).val();
		update_all();
	}
	
	function name_handler(e) {
		//var n = $(e).val();
		update_share_URL();
	}
	
	function button_handler(e) {
		var field = e.id.split('-');
		var key = field[0];
		if (key === 'All') {
			// only currently support an All-clr.
			if (field[1] === 'clr') {
				for (const key of Object.keys(stat)) {
					stat[key].pts = 0;
					$("#" + key + '-pts').html(stat[key].pts);
				}
			} else {
				console.log("Unknown button {" + e.id + "} pressed");
			}
		} else {
			switch(field[1]) {
				case "clr":
					stat[key].pts = 0;
					break;
				case "minus":
					stat[key].pts = Math.max(0, stat[key].pts - 1);
					break;
				case "plus":
					stat[key].pts = Math.min(stat[key].max_pts, stat[key].pts + 1);
					break;
				case "max":
					// We assume level is up to date. Also we need to account for currently
					// spent points in this skill so we make those available.
					var avail_pts = stat[key].pts + max_crew_level - Number($('#level').text());
					stat[key].pts = Math.min(avail_pts, stat[key].max_pts);
					break;
				default:
					console.log("Unknown button {" + e.id + "} pressed");
			}
			$("#" + key + '-pts').html(stat[key].pts);
		}
		update_all();
	}

	function update_share_URL() {
		var share_URL = window.location.protocol + '//' + window.location.host + window.location.pathname + '?c=' + selected_crew +
			'&p=' + point_string + '&n=' + encodeURIComponent($("#name").val());
		$("#build").val(share_URL);
	}
	
	function update_all() {
		selected_crew = $("#crew-select").val() || "Cat";
		$("#crew-icon").attr('src', 'images/Avatar_' + selected_crew + '.png');
		var total_pts = 0;
		var ps = '';
		for (const [key, value] of Object.entries(stat)) {
			var base = value.base;
			if (animal.hasOwnProperty(selected_crew) && animal[selected_crew].hasOwnProperty(key)) {
				base = animal[selected_crew][key];
			}
			$('#' + key + '-base').html(base);
			var pts = value.pts;
			if (pts == 0) {
				$("#" + key + '-clr').prop("disabled", true);
				$("#" + key + '-minus').prop("disabled", true);
				$("#" + key + '-plus').prop("disabled", false);
				$("#" + key + '-max').prop("disabled", false);
			} else if (pts == stat[key].max_pts) {
				$("#" + key + '-clr').prop("disabled", false);
				$("#" + key + '-minus').prop("disabled", false);
				$("#" + key + '-plus').prop("disabled", true);
				$("#" + key + '-max').prop("disabled", true);
			} else {
				$("#" + key + '-clr').prop("disabled", false);
				$("#" + key + '-minus').prop("disabled", false);
				$("#" + key + '-plus').prop("disabled", false);
				$("#" + key + '-max').prop("disabled", false);
			}				
			var current = base + pts*value.per_lvl;
			$('#' + key + '-curr').html(current);
			ps += pts + ',';
			total_pts += pts;
			$('#Total-pts').html(total_pts);
			if (total_pts == 0) {
				$('#All-clr').prop("disabled", true);
			} else {
				$('#All-clr').prop("disabled", false);
			}
		}
		point_string = ps.slice(0,-1);
		var crew_level = total_pts + 1;
		var extra = '';
		if (crew_level >= max_crew_level) {
			extra = ' (max)';
			for (const key of Object.keys(stat)) {
				$("#" + key + '-plus').prop("disabled", true);
				$("#" + key + '-max').prop("disabled", true);
			}
		}
		$('#level').html(crew_level + extra);
		update_share_URL();
	}
	//document.getElementById('file_select').addEventListener('change', handleFileSelect, false);
};
