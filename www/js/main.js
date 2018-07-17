var base_url="{{ globals.base_url_general }}",
	base_cache="{{ globals.cache_dir }}",
	version_id="v_{{ globals.v }}",
	base_static="{{ globals.base_static_noversion }}",
	user_level = "{{ current_user.user_level }}",
	is_mobile={{ globals.mobile }},
	touchable=false,
	loadedJavascript = [],
	timeagoHandler,
	{% if globals.allow_partial %}
		do_partial=true;
	{% else %}
		do_partial=false;
	{% endif %}

if (typeof window.history == "object" && (do_partial || navigator.userAgent.match(/mediatize/i)) ) {
	do_partial = true;
}

var now = (new Date);

function redirect(url) {
	document.location=url;
	return false;
}

function vote_history(user, id) {
	var url = base_url + "backend/vote_history";
	var content = "id=" + id + "&user=" + user + "&key=" + base_key + "&l=" + link_id + "&u=" + encodeURIComponent(document.referrer);
	url = url + "?" + content;
	disable_vote_link(id, -1, "...", '');
	$.getJSON(url,
		function(data) {
			parseLinkAnswer(id, data);
		}
	);
	reportAjaxStats('vote', 'link');
}

function vote_comment(user, id, value) {
	var url = base_url + "backend/vote_comment";
	var content = "id=" + id + "&user=" + user + "&value=" + value + "&key=" + base_key + "&l=" + link_id ;
	url = url + "?" + content;
	respond_comment_vote(id, value);
	$.getJSON(url,
		function(data) {
			update_comment_vote(id, value, data);
		}
	);
	reportAjaxStats('vote', 'comment');
}

function vote_post(user, id, value) {
	var url = base_url + "backend/vote_post";
	var content = "id=" + id + "&user=" + user + "&value=" + value + "&key=" + base_key + "&l=" + link_id ;
	url = url + "?" + content;
	respond_comment_vote(id, value);
	$.getJSON(url,
		function(data) {
			update_comment_vote(id, value, data);
		}
	);
	reportAjaxStats('vote', 'post');
}

function respond_comment_vote(id, value) {
	$('span[id="vc-p-'+id+'"]').removeClass('fa-thumbs-o-up').addClass('fa-thumbs-up').attr('onclick','').unbind('click');
}


function update_comment_vote(id, value, data) {
	if (data.error) {
		mDialog.notify("{% trans _('Error:') %} "+data.error, 5);
		return false;
	} else {
		$('span[id="vc-'+id+'"]').html(data.votes+"");
		$('span[id="vk-'+id+'"]').html(data.karma+"");
	}
}

function disable_vote_link(id, value, mess, background) {
	var html = '<a class="btn vote-button';
	if (value < 0)
		html += ' negative';
	html += ' disabled">';
	$('#a-va-' + id).html(html+mess+'</a>');
	if (background.length > 0) $('#a-va-' + id).css('background', background);
}

function parseLinkAnswer (id, link) {
	var votes;
	$('#problem-' + id).hide();
	if (link.error || id != link.id) {
		disable_vote_link(id, -1, "{% trans _('grr...') %}", '');
		mDialog.notify("{% trans _('Error:') %} "+link.error, 5);
		return false;
	}
	votes = parseInt(link.votes)+parseInt(link.anonymous);
	if ($('#a-votes-' + link.id).html() != votes) {
		$('#a-votes-' + link.id).hide();
		$('#a-votes-' + link.id).html(votes+"");
		$('#a-votes-' + link.id).fadeIn('slow');
	}
	/*$('#a-neg-' + link.id).html(link.negatives+"");*/
	$('#a-usu-' + link.id).html(link.votes+"");
	$('#a-ano-' + link.id).html(link.anonymous+"");
	$('#a-karma-' + link.id).html(link.karma+"");
	disable_vote_link(link.id, link.value, link.vote_description, '');
	return false;
}

function securePasswordCheck(field) {
	if (field.value.length > 5 && field.value.match("^(?=.{6,})(?=(.*[a-z].*))(?=(.*[A-Z0-9].*)).*$", "g")) {
		if (field.value.match("^(?=.{8,})(?=(.*[a-z].*))(?=(.*[A-Z].*))(?=(.*[0-9].*)).*$", "g")) {
			field.style.backgroundColor = "#8FFF00";
		} else {
			field.style.backgroundColor = "#F2ED54";
		}
	} else {
		field.style.backgroundColor = "#F56874";
	}
	return false;
}

function checkEqualFields(field, against) {
	if(field.value == against.value) {
		field.style.backgroundColor = '#8FFF00';
	} else {
		field.style.backgroundColor = "#F56874";
	}
	return false;
}

function enablebutton (button, button2, target) {
	var string = target.value;
	if (button2 != null) {
		button2.disabled = false;
	}
	if (string.length > 0) {
		button.disabled = false;
	} else {
		button.disabled = true;
	}
}

function checkfield (type, form, field) {
	var url = base_url + 'backend/checkfield?type='+type+'&name=' + encodeURIComponent(field.value);
	$.get(url,
		 function(html) {
			if (html == 'OK') {
				$('#'+type+'checkitvalue').html('<span style="color:black">"' + encodeURI(field.value) + '": ' + html + '</span>');
				form.submit.disabled = '';
			} else {
				$('#'+type+'checkitvalue').html('<span style="color:red">"' + encodeURI(field.value) + '": ' + html + '</span>');
				form.submit.disabled = 'disabled';
			}
		}
	);
	return false;
}

function check_checkfield(fieldname, mess) {
	var field = document.getElementById(fieldname);
	if (field && !field.checked) {
		mDialog.notify(mess, 5);
		/* box is not checked */
		return false;
	}
}

function pref_input_check (id) {
	var $e = $('#'+id);
	var value;
	var key = $e.val();
	var backend = base_url + 'backend/pref';

	$.post(backend,
		{"id": {{ current_user.user_id }}, "key": key, "control_key": base_key },
		function (data) {
			if (data) $e.prop('checked', true);
			else $e.prop('checked', false);

			$e.on('change', onChange);
		},
	'json');

	function onChange() {
		if (this.checked) value = 1;
		else value = 0;
		$.post(backend,
			{"id": {{ current_user.user_id }}, "value": value, "key": this.value, "set": 1, "control_key": base_key},
			function (data) {
				if (data) this.checked = true;
				else this.checked = false;
			},
		'json');
	}
}


function add_remove_sub(id, change) {
	var url = base_url + 'backend/sub_follow';

	change = (change ? 1 : 0);

	$.post(url,
		{ id: id, key: base_key, change: change },
		function(data) {
			if (data.error) {
				mDialog.notify("{% trans _('Error:') %}"+data.error, 5);
				return;
			}
			$button = $('#follow_b_'+id);
			if (data.value) {
				$button.addClass("fa-star").removeClass("fa-star-o");
			} else {
				$button.addClass("fa-star-o").removeClass("fa-star");
			}
		}
	, "json");
	reportAjaxStats('html', "sub_follow");
}

function add_remove_fav(element, type, id) {
	var url = base_url + 'backend/get_favorite';
	$.post(url,
		{ id: id, user: user_id, key: base_key, type: type },
		function(data) {
			if (data.error) {
				mDialog.notify("{% trans _('Error:') %} "+data.error, 5);
				return;
			}
			if (data.value) {
				$('#'+element).removeClass("fa-star-o").addClass("fa-star");
			} else {
				$('#'+element).removeClass("fa-star").addClass("fa-star-o");
			}
		}
	, "json");
	reportAjaxStats('html', "get_favorite");
}


/* Get veiled comments or post */
function show_veiled(id, type, container) {
	var $id = $('#'+container);
	var program = 'get_'+type+'_body.php';

	get_votes(program, type, container, 0, id);
	$id.addClass('veiled-content');
	get_total_answers_by_ids(type, id);
	$id.trigger("DOMChanged", $id);
}


/* Get voters by Beldar <beldar.cat at gmail dot com>
** Generalized for other uses (gallir at gmail dot com)
*/
function get_votes(program, type, container, page, id) {
	var url = base_url + 'backend/'+program+'?id='+id+'&p='+page+'&type='+type+'&key='+base_key;
	$e = $('#'+container);
	$e.load(url, function () {
		$e.trigger("DOMChanged", $e);
	});
	reportAjaxStats('html', program);
}

function readStorage(key) {
	if(typeof(Storage)!=="undefined") {
		return localStorage.getItem(key);
	} else {
		return readCookie(key);
	}
}

function writeStorage(key, value) {
	if(typeof(Storage)!=="undefined") {
		localStorage.setItem(key, value);
	} else {
		createCookie(key, value, 0);
	}
}


function createCookie(name,value,days,path) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	} else var expires = "";

	if (path == null)  path="/";

	document.cookie = name+"="+value+expires+"; path=" + path;
}

function readCookie(name, path) {
	var ca = document.cookie ? document.cookie.split('; ') : [];
	for(var i=0; i < ca.length; i++) {
		var c = ca[i];
		var parts = ca[i].split('=');
		var key = parts.shift();
		if (name == key) {
			var value = parts.join('=');
			return value;
		}
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}


/* This function report the ajax request to stats events if enabled in your account
** http://code.google.com/intl/es/apis/analytics/docs/eventTrackerOverview.html
*/
function reportAjaxStats(category, action, url) {
	if (typeof(ga) != 'undefined') {
		if (category && action) {
			ga('send', 'event', category, action);
		}
		if (typeof url == 'string') {
			ga('send', 'pageview', url);
		}
	}
}

function bindTogglePlusMinus(img_id, link_id, container_id) {
	$(document).ready(function (){
		$('#'+link_id).bind('click',
			function() {
				if ($('#'+img_id).attr("src") == plus){
					$('#'+img_id).attr("src", minus);
				}else{
					$('#'+img_id).attr("src", plus);
				}
				$('#'+container_id).slideToggle("fast");
				return false;
			}
		);
	});
}

function fancybox_expand_images(event) {
	if (event.shiftKey) {
		event.preventDefault();
		event.stopImmediatePropagation();

		if(!$('.zoomed').size()) {
			$('body').find('.fancybox[href*=".jpg"] , .fancybox[href*=".gif"] , .fancybox[href*=".png"]').each(
				function() {
					var title=$(this).attr('title');
					var href=$(this).attr('href');
					var img='<div style="margin:10px auto;text-align:center;" class="zoomed"><img style="margin:0 auto;max-width:80%;padding:10px;background:#fff" src="' + href + '"/></div>';
					$(this).after(img);
					$(this).next().click(function(event) { if (event.shiftKey) $('.zoomed').remove(); });
				});
		} else {
			$('.zoomed').remove();
		}
	}
}

function fancybox_gallery(type, user, link) {
	var is_public = parseInt({{ globals.media_public }}) > 0;
	if (! is_public && ! user_id > 0) {
		mDialog.notify('{% trans _('Debe estar autentificado para visualizar imágenes') %}', 5);
		return;
	}
	var url = base_url +'backend/gallery?type='+type;
	if (typeof(user) != 'undefined') url = url + '&user=' + user;
	if (typeof(link) != 'undefined') url = url + '&link=' + link;

	if (!$('#gallery').length) $('body').append('<div id="gallery" style="display:none"></div>');
	$('#gallery').load(url);
}




/**
  Strongly modified, onky works with DOM2 compatible browsers.
	Ricardo Galli
  From http://ljouanneau.com/softs/javascript/tooltip.php
 */

(function ($){

	var x = 0;
	var y = 0;
	var offsetx = 7;
	var offsety = 0;
	var reverse = false;
	var top = false;
	var box = null;
	var timer = null;
	var active = false;
	var last = null;
	var ajaxs = {'u': 'get_user_info',
		     'p': "get_post_suggestion",
		     'c': "get_comment_suggestion",
		     'l': "get_link",
		     'b': "get_ban_info",
		     'w': "get_comment_warn_suggestion"};

	$.extend({
		suggestion: function () {
			if (! is_mobile) start();
		}
	});

	function stop() {
		hide();
		$(document).off('mouseenter mouseleave', '.suggestion');
		$(document).off('touchstart', stop);
		touchable = true;
	}

	function start(o) {
		if (box == null) {
			box = $("<div>").attr({ id: 'suggestion-text' });
			$('body').append( box );
		}
		$(document).on('touchstart', stop); /* Touch detected, disable suggestions */
		$(document).on('mouseenter mouseleave', '.suggestion',
			function (event) {
				if (event.type == 'mouseenter') {
					try {
						var args = $(this).attr('class').split(' ');
						var i = args.indexOf('suggestion');
						args = args[i+1].split(':');
						var key = args[0];
						var value = args[1];
						var ajax = ajaxs[key];
						init(event);
						timer = setTimeout(function() {ajax_request(event, ajax, value)}, 200);
					} catch (e) {
						hide();
						return false;
					}
				} else if (event.type == 'mouseleave') {
					hide();
				}
				event.preventDefault();
			}
		);
	}

	function init(event) {
		if (timer || active) hide();
		active = true;

		$(document).on('onAjax', hide);
		$(document).on('mousemove.suggestion', function (e) { mouseMove(e) });
		if (box.outerWidth() > 0) {
			if ($(window).width() - event.pageX < box.outerWidth() * 1.05) reverse = true;
			else reverse = false;
			if ($(window).height() - (event.pageY - $(window).scrollTop()) < 200) top = true;
			else top = false;
		}
	}

	function show(html) {
		if (active) {
			if(typeof html == 'string')	box.html(html);
			if (box.html().length > 0) {
				position();
				box.show();
				box.trigger("DOMChanged", box);
			} else {
				hide();
			}
		}
	}

	function hide () {
		if (timer != null) {
			clearTimeout(timer);
			timer = null;
		}
		$(document).off('mousemove.suggestion');
		active = false;
		box.hide();
	}

	function position() {
		if (reverse) xL = x - (box.outerWidth() + offsetx);
		else xL = x + offsetx;
		if (top) yL = y - (box.outerHeight() + offsety);
		else yL = y + offsety;
		box.css({left: xL +"px", top: yL +"px"});
	}

	function mouseMove(e) {
		x = e.pageX;
		y = e.pageY;
		position();
	}

	function ajax_request(event, script, id) {
		timer = null;
		var url = base_url + 'backend/'+script+'?id='+id;
		if (url == last) {
			show();
		} else {
			$.ajax({
				url: url,
				dataType: "html",
				success: function(html) {
					last = url;
					show(html);
					reportAjaxStats('suggestion', script);
				}
			});
		}
	}
})(jQuery);


/* Register form logic */
(function($) {
	var $form = $('#form-register');

        if (!$form.length) {
            return;
        }
        
        var $password = $form.find('#password'),
            $name = $form.find('#name'),
            $email = $form.find('#email');

        function setStatus($input, response, hideError) {
            var $parent = $input.parent(),
                $status = $parent.find('.input-status');

            $parent.removeClass('input-error input-success');
            $status.removeClass('fa-check fa-times');

            $parent.find('.input-error-message').remove();

            if (response === 'OK') {
                $parent.addClass('input-success');
                $status.addClass('fa-check');

                return;
            }
            
            if (hideError !== true) {
                $parent.addClass('input-error');
                $status.addClass('fa-times');
            }
            
            if (response !== 'KO') {
                $parent.append('<span class="input-error-message">' + response + '</span>');
            }
        }

	function checkAjaxField($input, callback) {
            var value = $input.val();

            if ($input.data('previous') === value) {
                return;
            }
            
            if (typeof callback !== 'function') {
                callback = setStatus;
            }
            
            $.get(base_url + 'backend/checkfield', {type: $input.attr('name'), name: value}, function(response) {
                callback($input, response);
            });

            $input.data('previous', value);
        }

        function securePasswordCheck(value) {
            return (value.length >= 8) && value.match('^(?=.{8,})(?=(.*[a-z].*))(?=(.*[A-Z].*))(?=(.*[0-9].*)).*$', 'g');
        }

        $name.on('change', function() {
            checkAjaxField($name);
        });

        $email.on('change', function() {
            checkAjaxField($email);
        });

        $password.on('keyup', function() {
            setStatus($password, securePasswordCheck($password.val()) ? 'OK' : 'KO', true);
        });

        $password.on('change', function() {
            setStatus($password, securePasswordCheck($password.val()) ? 'OK' : 'KO');
        });

        $('.input-password-show').on('click', function(e) {
            e.preventDefault();

            var $icon = $(this).find('.fa');

            if ($password.attr('type') === 'text') {
                $password.attr('type', 'password');
                $icon.removeClass('fa-eye-slash').addClass('fa-eye');
            } else {
                $password.attr('type', 'text');
                $icon.removeClass('fa-eye').addClass('fa-eye-slash');
            }
        });

	$form.on('submit', function(e) {
            $name.trigger('change');
            $email.trigger('change');
            $password.trigger('change');

            if ($form.find('.input-validate').length !== $form.find('.input-validate.input-success').length) {
                e.preventDefault();
                return;
            }

            $form.append('<input type="hidden" name="base_key" value="' + base_key + '" />');
        });

        if ($name.val()) {
            $name.trigger('change');
        }

        if ($email.val()) {
            $email.trigger('change');
        }

})(jQuery);


/**
 *	Based on jqDialog from:
 *	Kailash Nadh, http://plugins.jquery.com/project/jqDialog
**/

function strip_tags(html) {
	return html.replace(/<\/?[^>]+>/gi, '');
}

var mDialog = new function() {
	this.closeTimer = null;
	this.divBox = null;


	this.std_alert = function(message, callback) {
		alert(strip_tags(message));
		if (callback) callback();
	};

	this.std_confirm = function(message, callback_yes, callback_no) {
		if (confirm(strip_tags(message))) {
			if (callback_yes) callback_yes();
		} else {
			if (callback_no) callback_no();
		}
	};

	this.std_prompt = function(message, content, callback_ok, callback_cancel) {
		var res = prompt(message, content);
		if (res != null) {
			if (callback_ok) callback_ok(res);
		} else {
			if (callback_cancel) callback_cancel(res);
		}
	};

	this.confirm = function(message, callback_yes, callback_no) {
		if (is_mobile) {
			this.std_confirm(message, callback_yes, callback_no);
			return;
		}
		this.createDialog(message);
		this.btYes.show(); this.btNo.show();
		this.btOk.hide(); this.btCancel.hide(); this.btClose.hide();
		this.btYes.focus();

		/* just redo this everytime in case a new callback is presented */
		this.btYes.unbind().click( function() {
			mDialog.close();
			if(callback_yes) callback_yes();
		});

		this.btNo.unbind().click( function() {
			mDialog.close();
			if(callback_no) callback_no();
		});
	};

	this.prompt = function(message, content, callback_ok, callback_cancel) {
		if (is_mobile) {
			this.std_prompt(message, content, callback_ok, callback_cancel);
			return;
		}

		this.createDialog($("<p>").append(message).append( $("<p>").append( $(this.input).val(content) ) ));

		this.btYes.hide(); this.btNo.hide();
		this.btOk.show(); this.btCancel.show();
		this.input.focus();

		/* just redo this everytime in case a new callback is presented */
		this.btOk.unbind().click( function() {
			mDialog.close();
			if(callback_ok) callback_ok(mDialog.input.val());
		});

		this.btCancel.unbind().click( function() {
			mDialog.close();
			if(callback_cancel) callback_cancel();
		});
	};

	this.alert = function(content, callback_ok) {
		if (is_mobile) {
			this.std_alert(content, callback_ok);
			return;
		}
		this.createDialog(content);
		this.btCancel.hide(); this.btYes.hide(); this.btNo.hide();
		this.btOk.show();
		this.btOk.focus();

		this.btOk.unbind().click( function() {
			mDialog.close();
			if(callback_ok) callback_ok();
		});
	};


	this.content = function(content, close_seconds) {
		if (is_mobile) {
			this.std_alert(content, false);
			return;
		}
		this.createDialog(content);
		this.divOptions.hide();
	};

	this.notify = function(content, close_seconds) {
		if (is_mobile) {
			this.std_alert(content, false);
			return;
		}
		this.content(content);
		this.btClose.show().focus();
		if(close_seconds)
			this.closeTimer = setTimeout(function() { mDialog.close(); }, close_seconds*1000 );
	};

	this.createDialog = function(content) {
		if (this.divBox == null) this.init();
		clearTimeout(this.closeTimer);
		this.divOptions.show();
		this.divContent.html(content);
		this.divBox.fadeIn('fast');
		this.maintainPosition();
	};

	this.close = function() {
		this.divBox.fadeOut('fast');
		$(window).unbind('scroll.mDialog');
	};

	this.makeCenter = function() {
		$(mDialog.divBox).css (
			{
				top: ( (($(window).height() / 2) - ( mDialog.h / 2 ) )) + ($(document).scrollTop()) + 'px',
				left: ( (($(window).width() / 2) - ( mDialog.w / 2 ) )) + ($(document).scrollLeft()) + 'px'
			}
		);
	};

	this.maintainPosition = function() {
		mDialog.w = mDialog.divBox.width();
		mDialog.h = mDialog.divBox.height();
		mDialog.makeCenter();
		$(window).bind('scroll.mDialog', function() {
			mDialog.makeCenter();
		} );

	};

	this.init = function() {
		if (is_mobile) return;
		this.divBox = $("<div>").attr({ id: 'mDialog_box' });
		this.divHeader = $("<div>").attr({ id: 'mDialog_header' });
		this.divContent = $("<div>").attr({ id: 'mDialog_content' });
		this.divOptions = $("<div>").attr({ id: 'mDialog_options' });
		this.btYes = $("<button>").attr({ id: 'mDialog_yes' }).text("{% trans _('Sí') %}");
		this.btNo = $("<button>").attr({ id: 'mDialog_no' }).text("{% trans _('No') %}");
		this.btOk = $("<button>").attr({ id: 'mDialog_ok' }).text("{% trans _('Vale') %}");
		this.btCancel = $("<button>").attr({ id: 'mDialog_ok' }).text("{% trans _('Cancelar') %}");
		this.input = $("<input>").attr({ id: 'mDialog_input' });
		this.btClose = $("<span>").attr({ id: 'mDialog_close' }).text('X').click(
							function() {
								mDialog.close();
							});
		this.divHeader.append(	this.btClose );
		this.divBox.append(this.divHeader).append( this.divContent ).append(
			this.divOptions.append(this.btNo).append(this.btCancel).append(this.btOk).append(this.btYes)
		);

		this.divBox.hide();
		$('body').append( this.divBox );
	};

};

function comment_edit(id, DOMid) {
	$target=$('#' + DOMid).parent();
	$.getJSON(base_url_sub + 'comment_ajax', { "id": id }, function (data) {
		if ( ! data.error ) {
			$target.html(data.html);
			$target.find('textarea').setFocusToEnd();
			$target.trigger('DOMChanged', $target);
			var options = {
				async: false,
				dataType: 'json',
				success: function (data) {
					if (! data.error) {
						$target.html(data.html);
					} else {
						mDialog.notify("error: " + data.error, 5)
					}
					$target.trigger('DOMChanged', $target);
				},
				error: function () {
					mDialog.notify("error", 3);
				},
			};
			$('#c_edit_form').ajaxForm(options);
		} else {
			mDialog.notify("error: " + data.error, 5);
		}
	});
}

function comment_reply(id, prefix) {
	prefix != null ? prefix : '';
	var $parent = $("#cid-"+prefix+id).parent();
	if ($parent.find('#comment_ajax_form').length > 0) {
		return;
	}

	$('#comment_ajax_form').remove();
	var $target = $('<div class="threader"></div>');
	$parent.append($target);

	$.getJSON(base_url_sub + 'comment_ajax', { "reply_to": id }, function (data) {
		if ( ! data.error ) {
			var $e = $('<div id="comment_ajax_form" style="margin: 10px 0 20px 0"></div>');
			$e.append(data.html);
			$target.append($e).find('textarea').setFocusToEnd();

			var options = {
				async: false,
				dataType: 'json',
				success: function (data) {
					if (! data.error) {
						$e.remove();
						$target.append(data.html);
					} else {
						mDialog.notify("error: " + data.error, 5);
					}
					$target.trigger('DOMChanged', $target);
				},
				error: function () {
					mDialog.notify("error", 3);
				},
			};
			$('#c_edit_form').ajaxForm(options);
		} else {
			mDialog.notify("error", 3);
		}
		$target.trigger('DOMChanged', $target);
	});
}


function initFormPostEdit(id, container) {

	var options = {
		async: false,
		success: function(response) {
			if (response.error) {
				mDialog.notify(response, 5);
				return;
			}

			if(id > 0) {
				$post = container;
			} else {
				$('.comments-list:first').prepend($post = $('<li />'));
				container.hide('fast');
			}
			$post.html(response.html).trigger('DOMChanged', $post);
		}
	};

	var $form = $('#thisform'+id);

	$form.droparea({ maxsize: $form.find('input[name="MAX_FILE_SIZE"]').val() });
	$form.ajaxForm(options);
        $('textarea').autosize();
        $("#fileInput"+id).nicefileinput();
}


function post_load_form(id, container) {

	var url = base_url + 'backend/post_edit';
	$.getJSON(url, { "id": id, "key": base_key }, function (data) {

		reportAjaxStats('html', 'post_edit');

		if(data.error) {
			mDialog.notify(data.error, 2);
			return;
		}

		$container = $('#' + container);
		$container.empty();
		$container.html(data.html).trigger('DOMChanged', $container);
		$container.show('fast');
		initFormPostEdit(id, $container);
	});
}


function post_new() {
	post_load_form(0, 'addpost');
}

function post_edit(id) {
	post_load_form(id, 'pcontainer-'+id);
}

function post_reply(id, user) {
	var ref = '@' + user + ',' + id + ' ';
	var others = '';
	var regex = /get_post_url(?:\.php){0,1}\?id=([a-z0-9%_\.\-]+(\,\d+){0,1})/ig; /* TODO: delete later (?:\.php)*/
	var text = $('#pid-'+id).html();
	var startSelection, endSelection, textarea;

	var myself = new RegExp('^'+user_login+'([\s,]|$)', 'i' );
	while (a = regex.exec(text)) { /* Add references to others */
		u = decodeURIComponent(a[1]);
		if (! u.match(myself)) { /* exclude references to the reader */
			others = others + '@' + u + ' ';
		}
	}
	if (others.length > 0) {
		startSelection = ref.length;
		endSelection = startSelection + others.length;
		ref = ref + others;
	} else {
		startSelection = endSelection = 0;
	}
	textarea = $('#post');
	if (textarea.length == 0) {
		post_new();
	}
	post_add_form_text(ref, 1, startSelection, endSelection);
}

function post_add_form_text(text, tries, start, end) {
	if (! tries) tries = 1;
	var textarea = $('#post');
	if (tries < 20 && textarea.length == 0) {
			setTimeout(function () { post_add_form_text(text,tries+1,start,end) }, 100);
			return false;
	}
	if (textarea.length == 0 ) {
			return false;
	}
	var re = new RegExp(text);
	var oldtext = textarea.val();
	if (oldtext.match(re)) return false;
	var offset = oldtext.length;
	if (oldtext.length > 0 && oldtext.charAt(oldtext.length-1) != ' ') {
		oldtext = oldtext + ' ';
		offset = offset + 1;
	}
	textarea.val(oldtext + text);
	var obj = textarea[0];
	obj.focus();
	if ('selectionStart' in obj && start > 0 && end > 0) {
		obj.selectionStart = start + offset;
		obj.selectionEnd = end + offset;
	}
}

/* See http://www.shiningstar.net/articles/articles/javascript/dynamictextareacounter.asp?ID=AW */
var textCounter = function (field,cntfield,maxlimit) {
	if (textCounter.timer) return;
	textCounter.timer = setTimeout( function () {
		textCounter.timer = false;
		var length = field.value.length;
		if (length > maxlimit) {
			field.value = field.value.substring(0, maxlimit);
			length = maxlimit;
		}
		if (textCounter.length != length) {
			cntfield.value = maxlimit - length;
			textCounter.length = length;
		}
	}, 300);
};
textCounter.timer = false;
textCounter.length = 0;

/*
  Code from http://www.gamedev.net/community/forums/topic.asp?topic_id=400585
  strongly improved by Juan Pedro López for http://meneame.net
  2006/10/01, jotape @ http://jplopez.net
*/

function applyTag(caller, tag) {
	/* find first parent form and the textarea */
	var obj = $(caller).parents("form").find("textarea")[0];
	if (obj) wrapText(obj, tag, tag);
	return false;
}

function wrapText(obj, tag) {
	obj.focus();
	if(typeof obj.selectionStart == 'number') {
		/* Mozilla, Opera and any other true browser */
		var start = obj.selectionStart;
		var end   = obj.selectionEnd;

		if (start == end || end < start) return false;
		obj.value = obj.value.substring(0, start) +  replaceText(obj.value.substring(start, end), tag) + obj.value.substring(end, obj.value.length);
	} else if(document.selection) {
		/* Damn Explorer */
		/* Checking we are processing textarea value */
		var range = document.selection.createRange();
		if(range.parentElement() != obj) return false;
		if (range.text == "") return false;
		if(typeof range.text == 'string')
			document.selection.createRange().text =  replaceText(range.text, tag);
	} else {
		obj.value += text;
	}
}

function replaceText(text, tag) {
		return '<'+tag+'>'+text+'</'+tag+'>';
}

/* Privates */
function priv_show(content) {
	$.colorbox({html: content, width: 500, transition: 'none', scrolling: false});
}

function priv_new(user_id) {
	var w, h;
	var url = base_url + 'backend/priv_edit?user_id='+user_id+"&key="+base_key;
	if (is_mobile) {
		w = h = '100%';
	} else {
		w = '600px';
		h = '350px';

	}
	$.colorbox({href: url,
		onComplete: function () {
			if (user_id > 0) $('#post').focus();
			else $("#to_user").focus();
		},
		'onOpen': function () {
			historyManager.push('#priv_new', $.colorbox.close);
		},
		'onClosed': function () {
			historyManager.pop('#priv_new');
		},
		overlayClose: false,
		opacity: 0.5,
		transition: 'none',
		title: false,
		scrolling: true,
		open: true,
		width: w,
		height: h
	});
}

function report(id, type) {

	$.ajax({
		type: 'POST',
		url: base_url + 'backend/report.php',
		dataType: 'json',
		data: { 'process': 'check_can_report', 'id': id, 'type': type, 'key': base_key},
		success: function(data) {
			if (! data.error) {
				show_report_dialog(id, type);
			} else {
				mDialog.notify("error: " + data.error , 5);
			}
		}
	});
}

function show_report_dialog(id, type) {

	var w, h;
	var url = base_url + 'backend/report.php?id='+id+"&type="+type+"&key="+base_key;
	if (is_mobile) {
		w = h = '100%';
	} else {
		w = '500px';
		h = '400px';
	}

	$.colorbox({href: url,
		onComplete: function () {
			var options = {
				async: false,
				dataType: 'json',
				success: function (data) {
					if (! data.error) {
						mDialog.notify("{% trans _('Gracias por tu colaboración. Evaluaremos el comentario.') %}", 5);
						$.colorbox.close();
					} else {
						mDialog.notify("error: " + data.error , 5);
					}
				},
				error: function () {
					mDialog.notify("error: " + data.error , 3);
				}
			};

			$('#r_new_form').ajaxForm(options);
		},
		'onOpen': function () {

		},
		'onClosed': function () {

		},
		overlayClose: false,
		opacity: 0.1,
		transition: 'none',
		title: "{% trans _('reporte') %}",
		scrolling: false,
		open: true,
		className: 'report',
		width: w,
		height: h
	});
}

/* Answers */
function get_total_answers_by_ids(type, ids) {
	$.ajax({
		type: 'POST',
		url: base_url + 'backend/get_total_answers',
		dataType: 'json',
		data: { "ids": ids, "type": type },
		success: function (data) {
			$.each(data, function (ids, answers) { show_total_answers(type, ids, answers) }); 
		}
	});
	reportAjaxStats('json', 'total_answers_ids');
}

function get_total_answers(type, order, id, offset, size) {
	$.getJSON(base_url + 'backend/get_total_answers', { "id": id, "type": type, "offset": offset, "size": size, "order": order },
		function (data) { $.each(data, function (ids, answers) { show_total_answers(type, ids, answers) } ) });
	reportAjaxStats('json', 'total_answers');
}

function show_total_answers(type, id, answers) {
	if (type == 'comment') {
		dom_id = '#cid-'+ id;
		element = $(dom_id).children(".comment-content").children(".comment-meta").children(".comment-votes-info");
	} else {
		dom_id = '#pid-'+ id;
		element = $(dom_id).children(".post-content").children(".comment-meta").children(".comment-votes-info");
	}
	element.append('&nbsp;<div class="reply-all" onclick="show_answers(\''+type+'\','+id+')" title="'+answers+' {% trans _('respuestas') %}"><span class="fa fa-reply-all"></span><span class="counter">'+answers+'</span></div>');
}

function show_answers(type, id) {
	var program, dom_id, answers;

	if (type == 'comment') {
		program = 'get_comment_answers';
		dom_id = '#cid-'+ id;
	} else {
		program = 'get_post_answers';
		dom_id = '#pid-'+ id;
	}
	answers = $('#answers-'+id);
	if (answers.length == 0) {
		$.get(base_url + 'backend/'+program, { "type": type, "id": id }, function (html) {
			element = $(dom_id).parent().parent();
			$('<div class="comment-answers" id="answers-'+id+'">'+html+'</div>').hide().appendTo(element).show('fast');
			element.trigger('DOMChanged', element);
		});
		reportAjaxStats('html', program);
	} else {
		answers.toggle('fast');
	}
}

function share_fb(e) {
	var $e = $(e);
	window.open(
		'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent($e.parent().parent().data('url')),
		'facebook-share-dialog',
		'width=626,height=436');
	return false;
}

function share_tw(e) {
	var $e = $(e);
	window.open(
		'https://twitter.com/intent/tweet?url='+encodeURIComponent($e.parent().parent().data('url'))+'&text='+encodeURIComponent($e.parent().parent().data('title')),
		'twitter-share-dialog',
		'width=550,height=420');
	return false;
}

function togglecomment(e) {
	var $e = $(e);
	var t  = $e.parents(".threader:first").children(".threader");
	var r  = t.hasClass("collapsed");
	var r2 = $e.hasClass("collapsed");
	var ct = $e.parents(".comment-body:first").find(".comment-text:first");
	var cm = $e.parents(".comment-body:first").find(".comment-meta:first");

	if(t.length) {
		t.toggleClass("collapsed");
	}

	if(r) {
		t.slideDown('fast');
		$e.html('<i class="fa fa-chevron-up"></i>');
	} else {
		t.slideUp('fast'), ct.slideUp('fast'), cm.slideUp('fast');
		$e.html('<i class="fa fa-chevron-down"></i>');
	}

	$e.toggleClass("collapsed");
	if(r2) {
		ct.slideDown('fast'), cm.slideDown('fast');
		$e.html('<i class="fa fa-chevron-up"></i>');
	} else {
		ct.slideUp('fast'), cm.slideUp('fast');
		$e.html('<i class="fa fa-chevron-down"></i>');
	}
}

/* scrollstop plugin for jquery +1.9 */
(function(){
	var latency = 75;
	var handler;
	$.event.special.scrollstop = {
		setup: function() {
			var timer;
			handler = function(evt) {
				var _self = this,
					_args = arguments;

				if (timer) {
					clearTimeout(timer);
				}
				timer = setTimeout( function(){
					timer = null;
					evt.type = 'scrollstop';
					$(_self).trigger(evt, [_args]);
				}, latency);
			};

			$(this).on('scroll', handler);
		},
		teardown: function() {
			$(this).off('scroll', handler);
		}
	};

})(jQuery);


/*
(function () {
	$('#nav-menu').on('show.bs.dropdown', function() {

console.log("ENTRO");

	<a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>
		panel = $('#nav-dropdown');
		panel.empty();
		panel.append($('#searchform'));
		panel.append($('#header-menu .header-menu01'));

		//panel.append($('#header-center .header-menu02'));
		separador + chismosa i galeria?
		var html = '<li> </li>';
		panel.append(html);//
	});
})();
*/

/*
 * Navigation menu
 */
function openNav() {
	var panel = $("#nav-panel"), wpr = $("#main-wrapper"), sb = $('#searchbox');

	if(!panel.children().length) {
		panel.append('<a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>');
		panel.append(sb);
		sb.show();
		panel.append($('#header-menu .header-menu01').clone());
		panel.append('<div class="nav-panel-separator"></div>');
		panel.append('<ul><li><a href="/postits">postits</a></li><li><a href="/sneak">chismosa</a></li></ul>');
	}
	panel.css({ 'width': '250px' });
	wpr.css({ 'opacity': '0.2' });
}

function closeNav() {
	$("#nav-panel").css({ 'width': '0' });
	$("#main-wrapper").css({ 'opacity': '1' });
}


/* Back to top plugin
 * From http://www.jqueryscript.net/demo/Customizable-Back-To-Top-Button-with-jQuery-backTop/
 */

(function($) {
   $.fn.backTop = function(options) {
		var backBtn = this;
		var visible = false;
		var editing = false;
		var settings = $.extend({
			'position' : 600,
			'speed' : 500,
		}, options);

		var position = settings['position'];
		var speed = settings['speed'];

		$('input[type=text], textarea').on("focus focusout", onFocus);
		$(window).on('DOMChanged', function (event, parent) {
			$(parent).find('input[type=text], textarea').on("focus focusout editing", onFocus);
		});
		$(window).on('editing', onFocus);

		$(window).on('scrollstop', showHide);

		backBtn.click( function() {
			$("html, body").animate({ scrollTop: 0}, "fast");
		});

		function onFocus(e) {
			if (e.type == "focus" || e.type == "editing" ) {
				editing = true;
				showHide(e);
			} else if (e.type == "focusout") {
				editing = false;
				setTimeout( function () {
						showHide(e);
					}, 1000);
			}
		}

		function showHide(e) {
			var pos = $(window).scrollTop();
			if (! editing && ! visible && pos >= position) {
				show();
			} else if (visible && (editing || pos < position)) {
				hide();
			}
		}

		function hide() {
			backBtn.fadeOut(speed);
			visible = false;
		}

		function show() {
			backBtn.fadeIn(speed);
			visible = true;
		}

	}

}(jQuery));


/* Drop an image file
** Modified from http://gokercebeci.com/dev/droparea
*/
(function( $ ){
	var s;
	var m = {
		init: function(e){},
		start: function(e){},
		complete: function(r){},
		error: function(r){ mDialog.alert(r.error); return false; },
		traverse: function(files, area) {

			var form = area.parents('form');
			form.find('input[name="tmp_filename"], input[name="tmp_filetype"]').remove();

			if (typeof files !== "undefined") {
				if (m.check_files(files, area)) {
					for (var i=0, l=files.length; i<l; i++) {
						m.upload(files[i], area);
					}
				}
			} else {
				mDialog.notify("{% trans _('formato no reconocido') %}", 5);
			}
		},

		check_files: function(files, area) {
			if (typeof File != "undefined"	&& files != undefined) {
				for (var i = 0; i < files.length; i++) {
					/* File type control */
					if (files[i].type.length > 0 && !files[i].type.match('image.*')) {
						mDialog.notify("{% trans _('sólo se admiten imágenes') %}", 5);
						return false;
					}
					if (files[i].fileSize > s.maxsize) {
						mDialog.notify("{% trans _('tamaño máximo excedido') %}" + ":<br/>" + files[i].fileSize + " > " + s.maxsize + " bytes", 5);
						return false;
					}
				}
			}
			return true;
		},

		upload: function(file, area) {
			var form = area.parents('form');
			var thumb = form.find('.droparea_info img').attr('src', s.loaderImage).show();
			var submit = form.find(':submit');

			submit.attr('disabled', 'disabled');

			var xhr = new XMLHttpRequest();

			/* File uploaded */
			xhr.addEventListener("load", function (e) {
				var r = jQuery.parseJSON(e.target.responseText);
				if (typeof r.error === 'undefined') {
					thumb.attr('src', r.thumb).show();
					form.find('input[name="tmp_filename"], input[name="tmp_filetype"]').remove();
					form.append('<input type="hidden" name="tmp_filename" value="'+r.name+'"/>');
					form.append('<input type="hidden" name="tmp_filetype" value="'+r.type+'"/>');
					s.complete(r);
				} else {
					thumb.hide();
					s.error(r);
				}
				submit.removeAttr('disabled');
			}, false);

			xhr.open("post", s.post, true);

			/* Set appropriate headers */
			xhr.setRequestHeader("Content-Type", "multipart/form-data-alternate");
			if (typeof file.fileSize != "undefined") {
				xhr.setRequestHeader("X-File-Size", file.fileSize);
			}
			xhr.send(file);
		}
	};
	$.fn.droparea = function(o) {
		/* Check support for HTML5 File API */
		if (!window.File) return;

		/* Settings */
		s = {
			'post': base_url + 'backend/tmp_upload',
			'init': m.init,
			'start': m.start,
			'complete': m.complete,
			'error': m.error,
			'maxsize': 500000, /* Bytes */
			'show_thumb': true,
			'hide_delay': 2000,
			'backgroundColor': '#AFFBBB',
			'backgroundImage': base_static + version_id + '/img/common/upload-2x.png',
			'loaderImage': base_static + version_id + '/img/common/uploading.gif'
		};

		this.each(function(){
			if(o) $.extend(s, o);
			var form = $(this);

			s.init(form);

			form.find('input[type="file"]').change(function () {
				m.traverse(this.files, $(this));
				$(this).val("");
			});

			if (s.show_thumb) {
				var thumb = $('<img width="32" height="32"/>').hide();
				form.find('.droparea_info').append(thumb);
			}

			form.find('.droparea')
			.bind({
				dragleave: function (e) {
					var area = $(this);
					e.preventDefault();
					area.css(area.data('bg'));
				},

				dragenter: function (e) {
					e.preventDefault();
					$(this).css({
						'background-color': s.backgroundColor,
						'background-image': 'url("'+s.backgroundImage+'")',
						'background-position': 'center',
						'background-repeat': 'no-repeat'
						});
				},

				dragover: function (e) {
					e.preventDefault();
				}
			})
			.each(function() {
				var bg;
				var area = $(this);

				bg = {
					'background-color': area.css('background-color'),
					'background-image': area.css('background-image'),
					'background-position': area.css('background-position')
				};
				area.data("bg", bg);
				this.addEventListener("drop", function (e) {
					e.preventDefault();
					s.start(area);
					m.traverse(e.dataTransfer.files, area);
					area.css(area.data('bg'));
				},false);
			});
		});
	};
})( jQuery );

/*
	FileInput bsed on jQuery.NiceFileInput.js
	By Jorge Moreno - @alterebro
*/
(function($) {
	$.fn.nicefileinput = function(options) {
		var settings = {
			label : '',
			title : '{% trans _("subir imagen") %}',
		};
		if(options) { $.extend(settings, options); };

		return this.each(function() {
			var self = this;

			if ($(self).attr('data-styled') === undefined) {

				var r = Math.round(Math.random()*10000);
				var d = new Date();
				var guid = d.getTime()+r.toString();

				var wrapper = $("<div>")
					.css({
						'overflow': 'hidden',
						'position': 'relative',
						'display': 'inline-block',
						'white-space': 'nowrap',
						'text-align': 'center'
					})
					.addClass('uploadFile-button upload'+guid).html(settings.label).attr("title", settings.title);

				$(self).wrap(wrapper);

				$('.uploadFile'+guid).wrapAll('<div class="uploadFile-wrapper" id="upload-wrapper-'+guid+'" />');
				$('.uploadFile-wrapper').css({
					'overflow': 'auto',
					'display': 'inline-block'
				});
				$("#uploadFile-wrapper-"+guid).addClass($(self).attr("class"));

				$(self)
					.css({
						'visibility': 'visible',
						'opacity': 0,
						'position': 'absolute',
						'border': 'none',
						'margin': 0,
						'padding': 0,
						'top': 0,
						'right': 0,
						'cursor': 'pointer',
						'height': '30px'
					})
					.addClass('uploadFile-current').attr("title", settings.title);
				$(self).on("change", function() {});
				$(self).attr('data-styled', true);
			}
		});

	};
})(jQuery);


var historyManager = new function () {
	var history = [];
	if (typeof window.history.pushState != "function") return;

	$(window).on("popstate", function(e) {
		if (history.length == 0) return;
		var state = history.pop();
		if (typeof state.callback == "function") {
			state.callback(state);
		}
		if ($(window).scrollTop() != state.scrollTop) {
			window.scrollTo(0, state.scrollTop);
		}
	});

	this.push = function (name, callback) {
		if (typeof window.history.pushState != "function") return;

		var state = { id: history.length, name: name, href: location.href, scrollTop: $(window).scrollTop()};
		var new_href = name;
		window.history.pushState(state, null, new_href);
		state.callback = callback;
		history.push(state);
		reportAjaxStats('', '', new_href);
	};

	this.pop = function (name) {
		if (history.length == 0) return;

		window.history.back();
	};

};

var fancyBox = new function () {
	this.parse = function ($e) {
		var iframe = false, title = false, html = false, href = false, innerWidth = false, innerHeight = false, maxWidth, maxHeight, onLoad = false, onComplete = false, v, myClass, width = false, height = false, overlayClose = true, target = '';
		var myHref = $e.data('real_href') || $e.attr('href');
		var myTitle, photo = false;
		var ajaxName = "image";

		if ($e.attr('target')) {
			target = ' target="'+$e.attr('target')+'"';
		}

		if ((v = myHref.match(/(?:youtube\.com\/(?:embed\/|.*v=)|youtu\.be\/)([\w\-_]+).*?(#.+)*$/))) {
			if (is_mobile || touchable) return false;
			iframe = true;
			title = '<a target="_blank" href="'+myHref+'"'+target+'>{% trans _('vídeo en Youtube') %}</a>';
			href = 'https://www.youtube.com/embed/'+v[1];
			if (typeof v[2] != "undefined") href += v[2];
			innerWidth = 640;
			innerHeight = 390;
			maxWidth = false;
			maxHeight = false;
			ajaxName = "youtube";
		} else if ( (v = myHref.match(/twitter\.com\/.+?\/(?:status|statuses)\/(\d+)/)) ) {
			title = '<a target="_blank" href="'+myHref+'"'+target+'>{% trans _('en Twitter') %}</a>';
			html=" ";
			if (is_mobile)	{
				width = '100%';
				height = '100%';
			} else {
				innerWidth = 550;
				innerHeight = 500;
			}
			maxWidth = false;
			maxHeight = false;
			ajaxName = "tweet";
			onComplete = function() {
				var options = { s: "tweet", id: v[1] };
				$.getJSON(base_url+"backend/json_cache", options,
					function (data) {
						if (typeof data.html != "undefined" && data.html.length > 0 ) {
							$('#cboxLoadedContent').html(data.html);
						} else {
							$('#cboxLoadedContent').html('<a target="_blank" href="'+myHref+'">Not found</a>');
						}
					});
			};
		} else if ( (v = myHref.match(/(?:vimeo\.com\/(\d+))/)) ) {
			title = '<a target="_blank" href="'+myHref+'"'+target+'>{% trans _('vídeo en Vimeo') %}</a>';
			if (is_mobile)	{
				width = '100%';
				height = '100%';
			} else {
				innerWidth = 640;
				innerHeight = 400;
			}
			maxWidth = "100%";
			maxHeight = "100%";
			ajaxName = "vimeo";
			href = '//player.vimeo.com/video/'+v[1];
			iframe = true;
		} else if ( (v = myHref.match(/(?:vine\.co\/v\/(\w+))/)) ) {
			title = '<a target="_blank" href="'+myHref+'"'+target+'>{% trans _('vídeo en Vine') %}</a>';
			if (is_mobile)	{
				innerWidth = 320;
				innerHeight = 320;
			} else {
				innerWidth = 480;
				innerHeight = 480;
			}
			maxWidth = false;
			maxHeight = false;
			ajaxName = "vine";
			href = 'https://vine.co/v/'+v[1]+'/embed/simple';
			iframe = true;
		} else {
			if (myHref.match(/\.(x\-){0,1}(gif|jpeg|jpg|pjpeg|pjpg|png|tif|tiff)$/)) {
				photo = true;
			}
			myTitle = $e.attr('title');
			if (myTitle && myTitle.length > 0 && myTitle.length < 30) title = myTitle;
			else title = '{% trans _('enlace original') %}';
			title = '<a target="_blank" href="'+myHref+'"'+target+'>'+title+'</a>';
			href = myHref;
			if (is_mobile) {
				width = '100%';
				height = '100%';
			} else {
				maxWidth = '75%';
				maxHeight = '75%';
			}
		}

		myClass = $e.attr('class');
		if ( typeof myClass == "string" && (linkId = myClass.match(/l:(\d+)/))) {
			/* It's a link, call go.php */
			var link = linkId[1];
			setTimeout(function() {
				$.get(base_url_sub + 'go?quiet=1&id='+link);
			}, 10);
		}

		$.colorbox({
			'html': html,
			'photo': photo,
			'href': href,
			'transition': 'none',
			'width': width,
			'height': height,
			'maxWidth': maxWidth,
			'maxHeight': maxHeight,
			'opacity': 0.5,
			'title': title,
			'iframe': iframe,
			'innerWidth': innerWidth,
			'innerHeight': innerHeight,
			'overlayClose': overlayClose,
			'onLoad': onLoad,
			'onOpen': function () {
				historyManager.push('#box_'+ajaxName, $.colorbox.close);
			},
			'onComplete': onComplete,
			'onClosed': function () {
				 historyManager.pop('#box_'+ajaxName);
			}
		});
		return true;
	};
};

/* notifier */
(function () {
	var timeout = false;
	var current_count = -1;
	var has_focus = true;
	var check_counter = 0;
	var base_update = 15000;
	var last_connect = null;
	var notifier = $('#notifier');
	var pcounter = $('#p_c_counter');
	var pcounteradmin = $('#p_c_counter_admin');
	var ccounter = $('#c_c_counter');
	var ccounteradmin = $('#c_c_counter_admin');

	if (! user_id > 0 || $('#notifier').length == 0) return;
	$(window).on('unload onAjax', function() { $('.dropdown').hide(); });
	$(window).on("DOMChanged", function () {current_count = -1; restart(); });
	$(window).focus(restart);
	$(window).blur(function() {
		has_focus = false;
	});

	setTimeout(update, 500); /* We are not in a hurry */

	/* Notifications dropdown */
	$('#notifications').on('show.bs.dropdown', function() {
		data = decode_data(readStorage("n_"+user_id));
		var html = "";
		var red = ' class="red"';
		var a = ['privates', 'posts', 'comments', 'friends'];
		var b = ['fa-envelope', 'fa-sticky-note-o', 'fa-comments', 'fa-users'];
		for (var i=0; i < a.length; i++) {
			field = a[i];
			var counter = (data && data[field]) ? data[field] : 0;
			html += "<li><a "+((counter > 0) ? red : "")+"href='"+base_url_sub+"go?id="+user_id+"&what="+field+"'><i class='fa "+b[i]+"'></i><span>" + counter + " " + field_text(field) + "</span></a></li>";
		}
		if(user_level == 'admin' || user_level == 'god') {
			html += "<li class='divider'></li>";
			var counter = (data && data['adminposts']) ? data['adminposts'] : 0;
			html += "<li><a "+((counter > 0) ? red : "")+"href='"+base_url_sub+"go?id={{ globals.admin_user_id }}&what=adminposts'><i class='fa fa-sticky-note-o'></i><span>" + counter + " postits admin</span></a></li>";
			var counter = (data && data['admincomments']) ? data['admincomments'] : 0;
			html += "<li><a "+((counter > 0) ? red : "")+" href='"+base_url_sub+"go?id={{ globals.admin_user_id }}&what=admincomments'><i class='fa fa-comments'></i><span>" + counter + " comentarios admin</span></a></li>";
			var counter = (data && data['adminreports']) ? data['adminreports'] : 0;
			html += "<li><a "+((counter > 0) ? red : "")+"href='"+base_url_sub+"go?id={{ globals.admin_user_id }}&what=adminreports'><i class='fa fa-list-alt'></i><span>" + counter + " reportes admin</span></a></li>";
		}

		$('#notifier-dropdown').empty().append(html);
		check_counter = 0;
	});

	function update() {
		var next_update;
		var now;

		now = new Date().getTime();
		var last_check = readStorage("n_"+user_id+"_ts");
		if (last_check == null
				|| (check_counter == 0 && now - last_check > 3000) /* Avoid too many refreshes */
				|| now - last_check > base_update + check_counter * 20) {
			writeStorage("n_"+user_id+"_ts", now);
			connect();
		} else {
			update_panel();
		}

		if (! has_focus) {
			next_update = 8000;
		} else {
			next_update = 4000;
		}

		if (is_mobile) next_update *= 2;

		if ( (is_mobile && check_counter < 1) /* one network update for mobiles */
				|| (! is_mobile && check_counter < 3*3600*1000/base_update)) {
			timeout = setTimeout(update, next_update);
		} else {
			timeout = false;
		}
	};

	function update_panel() {
		var count;
		var posts;

		data = decode_data(readStorage("n_"+user_id));
		if (! data) {
			return;
		}
		if (data.total == current_count) {
			return;
		}

		document.title = document.title.replace(/^\(\d+\) /, '');
		notifier.html(data.total);
		pcounter.html(data.posts);
		pcounteradmin.html(data.adminposts);
		ccounter.html(data.comments);
		ccounteradmin.html(data.admincomments);
		if (data.total > 0) {
			notifier.removeClass('zero');
			document.title = '('+data.total+') ' + document.title;
		} else {
			notifier.addClass('zero');
		}
		current_count = data.total;
	};

	function connect() {
		var next_check;

		var connect_time = new Date().getTime();

		if (connect_time - last_connect < 2000) { /* to avoid flooding */
			return;
		}

		check_counter++;
		last_connect = connect_time;

		/*$.getJSON(base_url+"backend/notifications.json?check="+check_counter+"&has_focus="+has_focus,*/
		$.getJSON(base_url+"backend/notifications.json",
			function (data) {
				var now;
				now = new Date().getTime();
				writeStorage("n_"+user_id+"_ts", now);
				if (current_count == data.total) return;
				writeStorage("n_"+user_id, encode_data(data));
				update_panel();
			});
	};

	function restart() {
		check_counter = 0;
		has_focus = true;
		if (timeout) {
			clearTimeout(timeout);
			timeout = false;
		}
		update();
	}

	function decode_data(str) {
		if (! str) return null;
		var a = str.split(",");
		return {total: a[0], privates: a[1], posts: a[2], comments: a[3], friends: a[4], adminposts: a[5], admincomments: a[6], adminreports: a[7]};
	}

	function encode_data(data) {
		var a = [data.total, data.privates, data.posts, data.comments, data.friends, data.adminposts, data.admincomments, data.adminreports];
		return a.join(",");
	}

	function field_text(field) {
		var a = {
			privates: "{% trans _('privados nuevos') %}",
			posts: "{% trans _('respuestas a postits') %}",
			comments: "{% trans _('respuestas a comentarios') %}",
			friends: "{% trans _('nuevos amigos') %}"
		};
		return a[field];
	}
})();


{#
/**
 * jQuery Unveil modified and improved to accept options and base_url
 * Heavely optimized with timer and checking por min movement between scroll
 * http://luis-almeida.github.com/unveil
 * https://github.com/luis-almeida
 */

(function($) {

  $.fn.unveil = function(options, callback) {

	var settings = {
		threshold: 10,
		base_url: '',
		version: false,
		cache_dir: false
	};

	var $w = $(window),
		timer,
		retina = window.devicePixelRatio > 1.2,
		images = this,
		selector = $(this).selector,
		loaded;

	if (options) {
		$.extend(settings, options);
	}

	if (settings.base_url.charAt(settings.base_url.length-1) != '/') {
		settings.base_url += "/";
	}

	var cache_regex;
	if (settings.cache_dir) {
		cache_regex = new RegExp("^"+settings.cache_dir+"/");
	}


	this.one("unveil", handler);

	/* We trigger a DOMChanged event when we add new elements */
	$w.on("DOMChanged", function(event, parent) {
		var $e = $(parent);
		var n = $e.find(selector).not(images).not(loaded);
		if (n.length == 0) return;
		n.one("unveil", handler);
		images = images.add(n);
		n.trigger("unveil");
	});

	function handler() {
		var $e = $(this);
		var source = $e.data("src");
		if (! source) return;

		if (source.charAt(0) == "/" && source.charAt(1) != "/") source = source.substr(1);

		if (retina) {
			var high = $e.data('2x');
			if (high) {
				if (high.indexOf("s:") == 0) {
					var parts = high.split(":");
					source = source.replace(parts[1], parts[2]);
				} else {
					source = high;
				}
			}
		}

		var version_prefix;
		var base_url = settings.base_url;
		if (settings.version && settings.base_url.length > 1 && source.substr(0,4) != 'http' && source.substr(0,2) != '//') {
			if (! cache_regex || ! cache_regex.test(source)) {
				base_url += settings.version + "/";
			}
			source = base_url + source;
		}
		$e.attr("src", source);
		if (typeof callback === "function") callback.call(this);
	}

	function unveil() {
		var wt = $w.scrollTop();
		var wb = wt + $w.height();

		var inview = images.filter(":visible").filter(function() {
			var $e = $(this);

			var et = $e.offset().top,
				eb = et + $e.height();

			return eb >= wt - settings.threshold && et <= wb + settings.threshold;
		});

		loaded = inview.trigger("unveil");
		images = images.not(loaded);
	}

	$w.on('scrollstop resize', unveil);
	unveil();

	return this;

  };

})(jQuery);

#}


function analyze_hash(force) {

	if (location.hash && (m = location.hash.match(/#([\w\-]+)$/)) && (target = $('#'+m[1])).length) {

		target.css('opacity', 0.2);

		/* Highlight a comment if it is referenced by the URL. Currently double border, width must be 3 at least */
		if (link_id > 0 && (m2 = m[1].match(/^c-(\d+)$/)) && m2[1] > 0) {
			/* it's a comment */
			if (target.length) {
				$("#"+m[1]).find(".comment-body").css("border-style","solid").css("border-width","1px");
				/* If there is an anchor in the url, displace 80 pixels down due to the fixed header */
			} else {
				/* It's a link to a comment, check it exists, otherwise redirect to the right page */
				canonical = $("link[rel^='canonical']");
				if (canonical.length) {
					self.location = canonical.attr("href") + "/c0" + m2[1] + '#c-' + m2[1];
					return;
				}
			}
		}

		if (force) {
			setTimeout(function () {
				animate(target, true)
			}, 10);
		} else {
			animate(target, false);
		}
	}

	function animate(target, force) {
		var $h = $('#header-top');
/*
console.log("doc-top > targ - heig");
console.log($(document).scrollTop());
console.log(target.offset().top);
console.log($h.height());
console.log("Posición final: ");
console.log(target.offset().top - $h.height() - 10);
*/
		if (force || $h.css('position') === 'fixed') { /* && $(document).scrollTop() > target.offset().top - $h.height() ) {*/
			
			$('body, html').animate({
				scrollTop: target.offset().top - $h.height() - 10
			}, 'fast');
		}
		target.animate({opacity: 1.0}, 'fast');
	}
}


(function($){
	$.fn.setFocusToEnd = function() {
		this.focus();
		var $initialVal = this.val();
		this.val('').val($initialVal);
		jQuery.event.trigger("editing");
		return this;
	};
})(jQuery);

(function () { /* partial */
	$(document).on("click mousedown touchstart", "a", parse);

	if (do_partial) {
		console.log("Enabled partial");
		var sequence = 0;
		var last = 0;


		String.prototype.decodeHTML = function() {
			return $("<div>", {html: "" + this}).html();
		};

		$(window).on("popstate", function(e) {
			state = e.originalEvent.state;
			if (state && (state.name === "partial") && (state.sequence != last)) {
				load(location.href, e.originalEvent.state);
			}
		});
	}

	function parse(e) {
		/*console.log("PARSE");
		console.log(e);
		console.log($(this));*/

		var m;
		var $a = $(this);
		var href = $a.attr("href");

		if (!href)
			return false;

		var aClass = $a.attr("class") || '';

		if (e.type !== "click") {
			if ($a.data('done')) {
				return true;
			}

			if ((m = aClass.match(/l:(\d+)/)) && ! aClass.match(/suggestion/) ) {
				$a.attr('href', base_url_sub + "go?id=" + m[1]);
				$a.data('done', 1);
				$a.data('real_href', href);
			}
			return true;
		}

		var real_href = $a.data('real_href') || $a.attr('href');
		if ( (aClass.match(/fancybox/) || real_href.match(/\.(gif|jpeg|jpg|pjpeg|pjpg|png|tif|tiff)$|vimeo.com\/\d+|vine\.co\/v\/\w+|youtube.com\/(.*v=|embed)|youtu\.be\/.+|twitter\.com\/.+?\/(?:status|statuses)\/\d+/i))
			&& ! aClass.match(/cbox/) 
			&& ! $a.attr("target"))
		{
			if (fancyBox.parse($a))
				return false;
		}

		if (!do_partial)
			return true;

		/* Only if partial */
		var re = new RegExp("^/|^\\?|//"+location.hostname);

		if ((location.protocol === "http:" || location.protocol === "https:" ) && re.test(href) && !href.match(/\/backend\/|\/login|\/register|\/profile|\/sneak|rss2/)) {
			load(href.replace(/partial&|\?partial$|&partial/, ''), null);
			return false;
		}
	}

	function load(href, state) {
		var currentState;
		var a = href;

		a = a.replace(/#.*/, '');
		a += ((a.indexOf("?") < 0) ? "?" : "&") + "partial";

		$e = $("#variable");

		$("body").css('cursor', 'progress').trigger('onAjax');

		if (! state) {
			currentState = {
				name: "partial",
				scroll: $(window).scrollTop()
			};

			if (history.state) {
				currentState.sequence = history.state.sequence;
			} else {
				currentState.sequence = 0;
			}

			history.replaceState(currentState, null, location.href);

			sequence++;
			last = sequence;
			currentState.sequence = last;
			currentState.scroll = 0;
			history.pushState(currentState, null, href);
		} else {
			currentState = state;
			last = currentState.sequence;
		}

		$.ajax(a, {
			cache: true,
			dataType: "html",
			success: function (html) {
				$("body").css('cursor', 'default');

console.log("PARTIAL - Load: " + href + " scroll: " + currentState.scroll);

				var finalHref = loaded($e, href, html);

				if (!state && href !== finalHref) {
					history.replaceState(currentState, null, finalHref);
				}

				if (!finalHref)
					return false;

				if ('scroll' in currentState) {
					window.scrollTo(0, currentState.scroll);
				}

				execOnDocumentLoad();
				$e.trigger("DOMChanged", $e);
				analyze_hash(true);
			},
			error: function () {
				location.href = href;
			}
		});

	}

	function loaded($e, href, html) {
		$e.html(html);

		var $info = $e.find("#ajaxinfo");

		if (!$info.length) {
console.log("Bad data, location to: " + location.href);
			location.href = href;
			return false;
		}

		if ($info.data('uri')) {
			var uri = $info.data('uri').replace(/partial&|\?partial$|&partial/, '');

			if (href.match(/#.*/)) {
				uri += href.replace(/.*(#.*)/, "$1");
			}
			href = uri;
		}

		if ($info.data('title')) {
			document.title = $info.data('title');
		}

		return href;
	}
})();


function loadJS(url) {
	return $.ajax({ url: url,
		dataType: "script",
		async: true,
		cache: true,
		success: function () {
			loadedJavascript.push(this.url);
		}
	});
}

function execOnDocumentLoad() {
	var deferred = $.Deferred();
	deferred.resolve();

	/*console.log("Entrando execOnDocumentLoad");*/
	$.each(postJavascript, function(ix, url) {
		/*console.log(postJavascript);*/
		if ($.inArray(url, loadedJavascript) < 0) {
			deferred = deferred.then(function () {
				/*console.log("URL execON: "+url);*/
				return loadJS(url);
			});
		}
	});

	deferred.then(function () {
		postJavascript = [];

		/*console.log("En deferred");*/
		$.each(onDocumentLoad, function (ix, code) {
			/*console.log(code);*/
			try {
				if (typeof code == "function") {
					code();
				} else {
					eval(code);
				}
			} catch(err) {
				console.log(err);
			}
		});
		onDocumentLoad = [];
	});
}

/* *=*=* Menemoji Keyboard *=*=* */
var emojiKey = new function() {
	var $panel = null;
	var $html = null;
	var $textarea;


	this.keyboard = function (caller) {
		$(caller).toggleClass('active');
		var commentObj = $(caller).closest('form');
		$textarea = commentObj.find('textarea');
		if(commentObj.find('.emoji-kbd').length) {
			emojiKey.close();
		} else {
			emojiKey.close();
			if (! $html) {
				$.ajax({
					method: "GET",
					url: base_url + 'backend/menemoji_kbd',
					data: { v: version_id },
					cache: true,
					success: function (data) {
							$html = $(data);
							$panel = $html.insertAfter($textarea);
							emojiKey.open();
						},
					});
			} else {
				$panel = $html.insertAfter($textarea);
				emojiKey.open();
			}
		}
		$textarea.setFocusToEnd();
		return false;
	};

	this.open = function() {
		/* Evento de botones emoji */
		$panel.find('.emoji-btn').on('click', function(e) {
			e.preventDefault();
			var emojiCode = $(this).data('emoji');
			emojiKey.insert(emojiCode);
		});

		/* Evento de tabs de teclado emoji */
		$panel.find('.emoji-tab').on('click', function(e){
			e.preventDefault();
			$panel.find('.emoji-tab').removeClass('active');
			$panel.find('.emoji-panel').removeClass('active');
			var emojiPanel = $(this).data('target');
			$(this).addClass('active');
			$panel.find('#'+emojiPanel).addClass('active');
		});
	};

	this.close = function() {
		if ($panel) {
			$panel.remove();
			$panel = null;
		}
	};

	this.insert = function(emojiCode) {
		var caretPos = $textarea[0].selectionStart;
		var textAreaTxt = $textarea.val();
		var txtToAdd = '{'+emojiCode+'} ';
		$textarea.val(textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring(caretPos) );
		$textarea.setFocusToEnd();
	};
};

$(document).ready(function () {
	var m, m2, target, canonical;

	/* timeago */
	timeagoHandler = timeago();
	timeagoHandler.render(document.querySelectorAll('.tsrender'), 'es');

	$.ajaxSetup({ cache: false });

	$(window).on("DOMChanged",
		function(event, parent) {
			timeagoHandler.render(document.querySelectorAll('.tsrender'), 'es');
			execOnDocumentLoad();
		}
	);

	mDialog.init();

	analyze_hash();

	execOnDocumentLoad();

	/*$('img.lazy').unveil({base_url: base_static, version: version_id, cache_dir: base_cache, threshold: 100});*/
	$('#backTop').backTop();
	$('[data-toggle="popover"]').popover();

	/* Share menu things */
	$("a.share-menu").popover({
		placement: 'right',
		trigger: 'click',
		html: true,
		content: function() {
			return $(this).next(".share-menu-content").html();
		}
	});

	$(document).on('click', function(e) {
		$('a.share-menu').each(function() {
			var $this = $(this);
			if (!$this.is(e.target) && !$this.has(e.target).length && !$('.popover').has(e.target).length) {
				(($this.popover('hide').data('bs.popover') || {}).inState || {}).click = false;
			}
		});
	});

	/* Avoid close dropdown menu when click inside */
	$(document).on('click', '.dropdown-menu', function(e) {
		/*if ($(this).hasClass('keep-open-on-click')) { e.stopPropagation(); }*/
		e.stopPropagation();
	});

	$.suggestion();

	$('.showmytitle').on('click', function () {
		mDialog.content('<span style="font-size: 12px">'+$(this).attr('title')+'</span>');
	});

	if (! readCookie("sticky") && ! readCookie("a") ) {
		setTimeout(function() {
			$.ajax({
				cache: true,
				url: base_static + "js/cookiechoices.js",
				dataType: "script",
				success: function () {
					cookieChoices.showCookieConsentBar('Nos obligan a molestarte con la obviedad de que este sitio usa cookies',
					'cerrar', 'más información', base_url + "legal#cookies");
					}
				});
		}, 2000);
	}

});

