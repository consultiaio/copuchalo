<?php

final class Tabs
{
	static function renderForSection($section, $options, $tab_class = '')
	{
		switch ($section) {
			case _('portada tema'):
				return self::renderForIndex($options, $tab_class);

			case _('story'):
				return self::renderForStory($options, $tab_class);

			case _('nuevas'):
				return self::renderForShakeIt($options, $tab_class);

			case _('populares'):
				return self::renderForTopStories($options, $tab_class);

			case _('más visitadas'):
				return self::renderForTopClicked($options, $tab_class);

			case _('más comentadas'):
				return self::renderForTopCommented($options, $tab_class);

			case _('postits'):
				return self::renderForSneakme($options, $tab_class);

			case _('privados'):
				return self::renderForSneakmePrivates($options, $tab_class);

			case _('temas'):
				return self::renderForSubs($options, $tab_class);

			case _('cloudtags'):
				return self::renderForCloudTags($options, $tab_class);

			case _('cloudsites'):
				return self::renderForCloudSites($options, $tab_class);
		}

		if ($section !== _('profile')) {
			return;
		}

		switch ($options['view']) {
			case 'profile':
				return self::renderForProfileProfile($options, $tab_class);

			case 'friends':
				return self::renderForProfileFriends($options, $tab_class);

			case 'friend_of':
				return self::renderForProfileFriendsOf($options, $tab_class);

			case 'ignored':
				return self::renderForProfileIgnored($options, $tab_class);

			case 'friends_new':
				return self::renderForProfileFriendsNew($options, $tab_class);

			case 'history':
				return self::renderForProfileHistory($options, $tab_class);

			case 'shaken':
				return self::renderForProfileShaken($options, $tab_class);

			case 'favorites':
				return self::renderForProfileFavorites($options, $tab_class);

			case 'friends_shaken':
				return self::renderForProfileFriendsShaken($options, $tab_class);

			case 'commented':
				return self::renderForProfileCommented($options, $tab_class);

			case 'conversation':
				return self::renderForProfileConversation($options, $tab_class);

			case 'shaken_comments':
				return self::renderForProfileShakenComments($options, $tab_class);

			case 'favorite_comments':
				return self::renderForProfileFavoriteComments($options, $tab_class);
		}
	}

	static function renderForIndex($option, $tab_class)
	{
		global $globals, $current_user;

		//if (($globals['mobile'] && !$current_user->has_subs) || (!empty($globals['submnm']) && !$current_user->user_id)) {
		//	return;
		//}

		$items = array();
		$items[] = array('id' => 0, 'url' => $globals['meta_skip'], 'title' => _('todas'));

		if($current_user->user_id > 0 && SitesMgr::my_id() == 1) {
			$items[] = array('id' => 2, 'url' => '?meta=_smart', 'title' => _('smart'));
		}

		if (isset($current_user->has_subs) && ! empty($globals['meta_subs'])) {
			$items[] = array('id' => 7, 'url' => $globals['meta_subs'], 'title' => _('suscripciones'));
		}

		$items[] = array('id' => 8, 'url' => '?meta=_*', 'title' => _('temas/*'));

		// RSS teasers
		switch ($option) {
			case 7: // Personalised, published
				$feed = array("url" => "?subs=" . $current_user->user_id, "title" => _('suscripciones'));
				break;

			default:
				$feed = array("url" => '', "title" => "");
				break;
		}

		if ($current_user->user_id > 0) {
			$items[] = array('id' => 1, 'url' => '?meta=_friends', 'title' => _('amigos'));
		}

		return Haanga::Load('print_tabs.html', compact('items', 'option', 'feed', 'tab_class'), true);
	}


	static function renderForStory($option, $tab_class)
	{
		global $globals, $db, $link, $current_user;

		$active = array();
		$active[$option] = 'selected';

		if( $globals['mobile'] ) {
			$html  = '<div class="subheader">';
			$html .= '<form class="tabs-combo" action="">';
			$html .= '<select name="tabs" onchange="location = this.value;">';
			$html .= '<option value="'.$globals['permalink'].'/standard" '.$active[1].'>'._('ordenados').'</option>';
			$html .= '<option value="'.$globals['permalink'].'/threads" '.$active[10].'>'._('hilos').'</option>';
			$html .= '<option value="'.$globals['permalink'].'/best-comments" '.$active[2].'>'._('+ valorados').'</option>';
			if (!$globals['bot']) { // Don't show "empty" pages to bots, Google can penalize too
				if ($globals['link']->sent_date > $globals['now'] - 86400*60) { // newer than 60 days
					$html .= '<option value="'.$globals['permalink'].'/voters" '.$active[3].'>'._('votos').'</option>';
				}
				if ($globals['link']->sent_date > $globals['now'] - 86400*30) { // newer than 30 days
					$html .= '<option value="'.$globals['permalink'].'/log" '.$active[4].'>'._('registros').'</option>';
				}
				if ($globals['link']->date > $globals['now'] - $globals['time_enabled_comments']) {
					$html .= '<option value="'.$globals['permalink'].'/sneak" '.$active[5].'>&micro;&nbsp;'._('chismorreo').'</option>';
				}
			}
			if ($current_user->user_id > 0) {
				if (($c = $db->get_var("SELECT count(*) FROM favorites WHERE favorite_type = 'link' and favorite_link_id=$link->id")) > 0) {
					$html .= '<option value="'.$globals['permalink'].'/favorites" '.$active[6].'>'._('favoritos')."&nbsp;($c)</option>";
				}
			}
			$html .= '<option value="'.$globals['permalink'].'/related" '.$active[8].'>'._('relacionadas').'</option>';
			$html .= '</select>';
			$html .= '</form>';
			$html .= '</div>';
		} else {
			$html  = '<div class="subheader">';
			$html .= '<ul class="subheader-list">';
			$html .= '<li class="'.$active[1].'"><a href="'.$globals['permalink'].'/standard">'._('ordenados'). '</a></li>';
			$html .= '<li class="'.$active[10].'"><a href="'.$globals['permalink'].'/threads">'._('hilos'). '</a></li>';
			$html .= '<li class="'.$active[2].'"><a href="'.$globals['permalink'].'/best-comments">'._('+ valorados'). '</a></li>';
			//$html .= '<li class="'.$active[9].'wideonly"><a href="'.$globals['permalink'].'/answered">'._('+ respondidos'). '</a></li>';
			if (!$globals['bot']) { // Don't show "empty" pages to bots, Google can penalize too
				if ($globals['link']->sent_date > $globals['now'] - 86400*60) { // newer than 60 days
					$html .= '<li class="'.$active[3].'"><a href="'.$globals['permalink'].'/voters">'._('votos'). '</a></li>';
				}
				if ($globals['link']->sent_date > $globals['now'] - 86400*30) { // newer than 30 days
					$html .= '<li class="'.$active[4].'"><a href="'.$globals['permalink'].'/log">'._('registros'). '</a></li>';
				}
				if ($globals['link']->date > $globals['now'] - $globals['time_enabled_comments']) {
					$html .= '<li class="'.$active[5].'wideonly"><a href="'.$globals['permalink'].'/sneak">&micro;&nbsp;'._('fisgona'). '</a></li>';
				}
			}

			if ($current_user->user_id > 0) {
				if (($c = $db->get_var("SELECT count(*) FROM favorites WHERE favorite_type = 'link' and favorite_link_id=$link->id")) > 0) {
					$html .= '<li class="'.$active[6].'wideonly"><a href="'.$globals['permalink'].'/favorites">'._('favoritos')."&nbsp;($c)</a></li>";
				}
			}
			$html .= '<li class="'.$active[8].'wideonly"><a href="'.$globals['permalink'].'/related">'._('relacionadas'). '</a></li>';
			$html .= '</ul></div>';
		}

		return $html;
	}


	public static function renderForShakeIt($option = -1, $tab_class)
	{
		global $globals, $current_user;

		$items = array();
		$items[] = array('id' => 1, 'url' => 'queue' . $globals['meta_skip'], 'title' => _('recientes'));
		$items[] = array('id' => 4, 'url' => 'queue?meta=_old' . $globals['meta_skip'], 'title' => _('antiguas'));

		if ($current_user->has_subs) {
			$items[] = array('id' => 7, 'url' => 'queue' . $globals['meta_subs'], 'title' => _('suscripciones'));
		}

		$items[] = array('id' => 8, 'url' => 'queue?meta=_*', 'title' => _('temas/*'));
		$items[] = array('id' => 3, 'url' => 'queue?meta=_popular', 'title' => _('candidatas'));

		if ($current_user->user_id > 0) {
			$items[] = array('id' => 2, 'url' => 'queue?meta=_friends', 'title' => _('amigos'));
		}

		if (!$globals['bot']) {
			$items [] = array('id' => 5, 'url' => 'queue?meta=_discarded', 'title' => _('descartadas'));
		}

		// Print RSS teasers
		if (!$globals['mobile']) {
			switch ($option) {
				case 7: // Personalised, queued
					$feed = array("url" => "?status=queued&amp;subs=" . $current_user->user_id, "title" => "");
					break;

				default:
					$feed = array("url" => "?status=queued", "title" => "");
					break;
			}
		}

		return Haanga::Load('print_tabs.html', compact('items', 'option', 'feed', 'tab_class'), true);
	}

	public static function renderForTopstories($options, $tab_class)
	{
		global $globals, $range_values, $range_names, $month, $year;

		$count_range_values = count($range_values);

		$html = ($globals['mobile'] ? '<div class="subheader"><form class="tabs-combo" action=""><select name="tabs" onchange="location = this.value;">' : '<div class="subheader"><ul class="subheader-list">');

		if (!($current_range = check_integer('range')) || $current_range < 1 || $current_range >= $count_range_values) {
			$current_range = 0;
		}

		if ($month > 0 && $year > 0) {
			$html .= ($globals['mobile'] ? '<option value="popular?month='.$month.'&year='.$year.'" selected> '."$month-$year".'</option>' : '<li class="selected"><a href="popular?month='.$month.'&amp;year='.$year.'">' ."$month-$year". '</a></li>');
			$current_range = -1;
		} elseif (!($current_range = check_integer('range')) || $current_range < 1 || $current_range >= $count_range_values) {
			$current_range = 0;
		}

		for ($i = 0; $i < $count_range_values; $i++) {
			if ($i == $current_range) {
				$active = ($globals['mobile'] ? ' selected' : ' class="selected"');
			} else {
				$active = "";
			}

			$html .= ($globals['mobile'] ? '<option value="popular?range='.$i.'"'.$active.'>'.$range_names[$i].'</option>' : '<li'.$active.'><a href="popular?range='.$i.'">' .$range_names[$i]. '</a></li>');
		}

		$html .= ($globals['mobile'] ? '</select></form></div>' : '</ul></div>');

		return $html;
	}

	public static function renderForTopClicked($options, $tab_class)
	{
		global $globals, $range_values, $range_names;

		$count_range_values = count($range_values);

		$html = ($globals['mobile'] ? '<div class="subheader"><form class="tabs-combo" action=""><select name="tabs" onchange="location = this.value;">' : '<div class="subheader"><ul class="subheader-list">');

		if (!($current_range = check_integer('range')) || $current_range < 1 || $current_range >= $count_range_values) {
			$current_range = 0;
		}

		for ($i = 0; $i < $count_range_values; $i++) {
			if ($i == $current_range) {
				$active = ($globals['mobile'] ? ' selected' : ' class="selected"');
			} else {
				$active = "";
			}

			$html .= ($globals['mobile'] ? '<option value="top_visited?range='.$i.'"'.$active.'>'.$range_names[$i].'</option>' : '<li'.$active.'><a href="top_visited?range='.$i.'">' .$range_names[$i]. '</a></li>');
		}

		$html .= ($globals['mobile'] ? '</select></form></div>' : '</ul></div>');

		return $html;
	}

	public static function renderForTopCommented($options, $tab_class)
	{
		global $globals, $range_values, $range_names;

		$count_range_values = count($range_values);

		$html = ($globals['mobile'] ? '<div class="subheader"><form class="tabs-combo" action=""><select name="tabs" onchange="location = this.value;">' : '<div class="subheader"><ul class="subheader-list">');

		if (!($current_range = check_integer('range')) || $current_range < 1 || $current_range >= $count_range_values) {
			$current_range = 0;
		}

		for ($i = 0; $i < $count_range_values; $i++) {
			if ($i == $current_range) {
				$active = ($globals['mobile'] ? ' selected' : ' class="selected"');
			} else {
				$active = "";
			}

			$html .= ($globals['mobile'] ? '<option value="top_commented?range='.$i.'"'.$active.'>'.$range_names[$i].'</option>' : '<li'.$active.'><a href="top_commented?range='.$i.'">' .$range_names[$i]. '</a></li>');
		}

		$html .= ($globals['mobile'] ? '</select></form></div>' : '</ul></div>');

		return $html;
	}

	public static function renderForSneakme($options, $tab_class)
	{
		global $globals, $current_user;

		list($content, $selected, $rss, $rss_title) = $options;

		if($globals['mobile']) {
			$html = '<div class="subheader subheader-postits">';

			if ($current_user->user_id > 0 && Post::can_add()) {
				$html .= '<a class="new-postit" href="javascript:post_new()">'._('nuevo postit').'</a>';
			}

			if (is_array($content) && !empty($content)) {
				$html .= '<form class="tabs-combo right" action=""><select name="tabs" onchange="location = this.value;">';
				$n = 0;
				foreach ($content as $text => $url) {
					$active = ($selected === $n) ? ' selected' : '';
					$html .= '<option value="'.$url.'"'.$active.'>'.$text.'</option>';
					$n++;
				}

				if ($rss) {
					if (!$rss_title) $rss_title = 'rss2';
						$html .= '<option value="'.$globals['base_url'].$rss.'">'.$rss_title.'</option>';
				}
				$html .= '</select></form>';
			}
		} else {
			// arguments: hash array with "button text" => "button URI"; Nº of the selected button
			$html = '<div class="subheader"><ul class="subheader-list">'."\n";

			if ($current_user->user_id > 0) {
				if (Post::can_add()) {
					$html .= '<li><span><a class="toggler" href="javascript:post_new()" title="'._('nueva').'">&nbsp;'._('postit').'<span class="fa fa-pencil note-pencil"></span></a></span></li>';
				} else {
					$html .= '<li><span><a href="javascript:return;">'._('postit').'</a></span></li>';
				}
			}

			if (is_array($content)) {
				$n = 0;
				foreach ($content as $text => $url) {
					if ($selected === $n) {
						$class_b = ' class = "selected"';
					} else {
						$class_b = ($n > 4) ? ' class="wideonly"' : '';
					}

					$html .= '<li'.$class_b.'><a href="'.$url.'">'.$text.'</a></li>';
					$n++;
				}
			} elseif (!empty($content)) {
				$html .= '<li>' . $content . '</li>';
			}

			if ($rss && !empty ($content)) {
				if (!$rss_title) $rss_title = 'rss2';
				$html .= '<li class="icon wideonly"><a href="'.$globals['base_url'].$rss.'" title="'.$rss_title.'"><span class="fa fa-rss-square"></span></a></li>';
			}

			$html .= '</ul></div>';

		}
		return $html;
	}

	public static function renderForSneakmePrivates($options, $tab_class)
	{
		global $globals;

		list($content, $selected) = $options;

		if($globals['mobile']) {
			$html  = '<div class="subheader subheader-postits priv">';
			$html .= '<a class="new-postit priv" href="javascript:priv_new(0)">'._('nuevo').'</a>';
			$html .= '<form class="tabs-combo left" action=""><select name="tabs" onchange="location = this.value;">';

			if (is_array($content)) {
				$n = 0;
				foreach ($content as $text => $url) {
					$active = ($selected === $n) ? ' selected' : '';
					$html .= '<option value="'.$url.'"'.$active.'>'.$text.'</option>';
					$n++;
				}
			} elseif (! empty($content)) {
				$html .= '<option>'.$content.'</option>';
			}
			$html .= '</select></form></div>';
		} else {
			$html  = '<div class="subheader"><ul class="subheader-list">';
			$html .= '<li><span><a class="toggler" href="javascript:priv_new(0)" title="'._('nuevo').'">'._('nuevo').'<span class="fa fa-pencil note-pencil"></span></a></span></li>';

			if (is_array($content)) {
				$n = 0;
				foreach ($content as $text => $url) {
					$class_b = ($selected === $n) ? ' class = "selected"' : '';
					$html .= '<li'.$class_b.'><a href="'.$url.'">'.$text.'</a></li>';
					$n++;
				}
			} elseif (!empty($content)) {
				$html .= '<li>' . $content . '</li>';
			}

			$html .= '</ul></div>';
		}
		return $html;
	}

	public static function renderForSubs($option, $tab_class)
	{
		global $current_user;

		$can_edit = (SitesMgr::my_id() == 1 && SitesMgr::can_edit(0));

		$items = array();

		if ($current_user->user_id) {
			$suscriptions_num = count(SitesMgr::get_subscriptions($current_user->user_id));
			$items[] = array('id' => 0, 'url' => 'temas?subscribed', 'title' => _('suscripciones')." [$suscriptions_num]");
		}
		$items[] = array('id' => 1, 'url' => 'temas?active', 'title' => _('más activos'));
		$items[] = array('id' => 2, 'url' => 'temas?all', 'title' => _('todos'));
		$items[] = array('id' => 3, 'url' => 'temas?random', 'title' => _('aleatorio'));
		if ($can_edit) {
			$items[] = array('id' => 4, 'url' => 'subedit', 'title' => _('crear sub'));
		}

		$vars = compact('items', 'option');

		return Haanga::Load('print_tabs.html', $vars, true);
	}

	public static function renderForCloudTags($option, $tab_class)
	{
		global $globals, $current_user, $range_values, $range_names;

		if(!($current_range = check_integer('range')) || $current_range < 1 || $current_range >= count($range_values))
			$current_range = 0;

		$html = ($globals['mobile'] ? '<div class="subheader"><form class="tabs-combo" action=""><select name="tabs" onchange="location = this.value;">' :
					      '<div class="subheader"><ul class="subheader-list">');

		for($i=0; $i<count($range_values) && $range_values[$i] < 40; $i++) {
			if($i == $current_range)  {
				$active = ($globals['mobile'] ? ' selected' : ' class="selected"');
			} else {
				$active = "";
			}
			$html .= ($globals['mobile'] ? '<option value="cloud?range='.$i.'"'.$active.'>'.$range_names[$i].'</option>' : '<li'.$active.'><a href="cloud?range='.$i.'">'.$range_names[$i].'</a></li>');
		}
		$html .= ($globals['mobile'] ? '</select></form></div>' : '</ul></div>');

		return $html;
	}

	public static function renderForCloudSites($option, $tab_class)
	{
		global $globals, $current_user, $range_values, $range_names;

		if(!($current_range = check_integer('range')) || $current_range < 1 || $current_range >= count($range_values))
			$current_range = 0;

		$html = ($globals['mobile'] ? '<div class="subheader"><form class="tabs-combo" action=""><select name="tabs" onchange="location = this.value;">' : '<div class="subheader"><ul class="subheader-list">');

		for($i=0; $i<count($range_values)-1; $i++) {
			if($i == $current_range)  {
				$active = ($globals['mobile'] ? ' selected' : ' class="selected"');
			} else {
				$active = "";
			}
			$html .= ($globals['mobile'] ? '<option value="sitescloud?range='.$i.'"'.$active.'>'.$range_names[$i].'</option>' : '<li'.$active.'><a href="sitescloud?range='.$i.'">' .$range_names[$i]. '</a></li>');
		}
		$html .= ($globals['mobile'] ? '</select></form></div>' : '</ul></div>');

		return $html;
	}

	public static function renderForProfileProfile($params, $tab_class)
	{
		global $user, $current_user, $globals;

		$options = array($user->username => get_user_uri($user->username));

		if ($current_user->user_id == $user->id || $current_user->user_level === 'god') {
			$options[_('modificar perfil')] = $globals['base_url'].'profile?login='.urlencode($params['login']);
		}

		return self::renderUserProfileSubheader($options, 0, 'rss?friends_of=' . $user->id, _('envíos de amigos en rss2'), $tab_class);
	}

	public static function renderForProfileFriends($params, $tab_class)
	{
		global $user, $current_user;

		$options = array(
			_('amigos') => get_user_uri($user->username, 'friends'),
			_('elegido por') => get_user_uri($user->username, 'friend_of')
		);

		if ($user->id == $current_user->user_id) {
			$options[_('ignorados')] = get_user_uri($user->username, 'ignored');
			$options[_('nuevos')] = get_user_uri($user->username, 'friends_new');
		}

		return self::renderUserProfileSubheader($options, 0, 'rss?friends_of=' . $user->id, _('envíos de amigos en rss2'), $tab_class);
	}

	public static function renderUserProfileSubheader($options, $selected = false, $rss = false, $rss_title = '', $tab_class)
	{
		global $user, $current_user;

		if ($current_user->user_id > 0 && $user->id != $current_user->user_id) { // Add link to discussion among them
			$between = "type=comments&amp;u1=$user->username&amp;u2=$current_user->user_login";
		} else {
			$between = false;
		}

		return Haanga::Load('user/subheader.html', compact(
			'options', 'selected', 'rss', 'rss_title', 'between', 'tab_class'
		), true);
	}

	public static function renderForProfileFriendsOf($params, $tab_class)
	{
		global $user, $current_user;

		$options = array(
			_('amigos') => get_user_uri($user->username, 'friends'),
			_('elegido por') => get_user_uri($user->username, 'friend_of')
		);

		if ($user->id == $current_user->user_id) {
			$options[_('ignorados')] = get_user_uri($user->username, 'ignored');
			$options[_('nuevos')] = get_user_uri($user->username, 'friends_new');
		}

		return self::renderUserProfileSubheader($options, 1, false, '', $tab_class);
	}

	public static function renderForProfileIgnored($params, $tab_class)
	{
		global $user, $current_user;

		$options = array(
			_('amigos') => get_user_uri($user->username, 'friends'),
			_('elegido por') => get_user_uri($user->username, 'friend_of')
		);

		if ($user->id == $current_user->user_id) {
			$options[_('ignorados')] = get_user_uri($user->username, 'ignored');
			$options[_('nuevos')] = get_user_uri($user->username, 'friends_new');
		}

		return self::renderUserProfileSubheader($options, 2, false, '', $tab_class);
	}

	public static function renderForProfileFriendsNew($params, $tab_class)
	{
		global $user, $current_user;

		$options = array(
			_('amigos') => get_user_uri($user->username, 'friends'),
			_('elegido por') => get_user_uri($user->username, 'friend_of')
		);

		if ($user->id == $current_user->user_id) {
			$options[_('ignorados')] = get_user_uri($user->username, 'ignored');
			$options[_('nuevos')] = get_user_uri($user->username, 'friends_new');
		}

		return self::renderUserProfileSubheader($options, 3, false, '', $tab_class);
	}

	public static function renderForProfileHistory($params, $tab_class)
	{
		global $user;

		return self::renderUserProfileSubheader(array(
			_('envíos propios') => get_user_uri($user->username, 'history'),
			_('votados') => get_user_uri($user->username, 'shaken'),
			_('favoritos') => get_user_uri($user->username, 'favorites'),
			_('votados por amigos') => get_user_uri($user->username, 'friends_shaken')
		), 0, 'rss?sent_by=' . $user->id, _('envíos en rss2'), $tab_class);
	}

	public static function renderForProfileShaken($params, $tab_class)
	{
		global $user;

		return self::renderUserProfileSubheader(array(
			_('envíos propios') => get_user_uri($user->username, 'history'),
			_('votados') => get_user_uri($user->username, 'shaken'),
			_('favoritos') => get_user_uri($user->username, 'favorites'),
			_('votados por amigos') => get_user_uri($user->username, 'friends_shaken')
		), 1, 'rss?voted_by=' . $user->id, _('votadas en rss2'), $tab_class);
	}

	public static function renderForProfileFavorites($params, $tab_class)
	{
		global $user;

		return self::renderUserProfileSubheader(array(
			_('envíos propios') => get_user_uri($user->username, 'history'),
			_('votados') => get_user_uri($user->username, 'shaken'),
			_('favoritos') => get_user_uri($user->username, 'favorites'),
			_('votados por amigos') => get_user_uri($user->username, 'friends_shaken')
		), 2, 'rss?favorites='.$user->id.'&amp;option=favorites&amp;url=source', _('favoritos en rss2'), $tab_class);
	}

	public static function renderForProfileFriendsShaken($params, $tab_class)
	{
		global $user;

		return self::renderUserProfileSubheader(array(
			_('envíos propios') => get_user_uri($user->username, 'history'),
			_('votados') => get_user_uri($user->username, 'shaken'),
			_('favoritos') => get_user_uri($user->username, 'favorites'),
			_('votados por amigos') => get_user_uri($user->username, 'friends_shaken')
		), 3, false, '', $tab_class);
	}

	public static function renderForProfileCommented($params, $tab_class)
	{
		global $user, $globals;

		return self::renderUserProfileSubheader(array(
			$user->username => get_user_uri($user->username, 'commented'),
			_('conversación').$globals['extra_comment_conversation'] => get_user_uri($user->username, 'conversation'),
			_('votados') => get_user_uri($user->username, 'shaken_comments'),
			_('favoritos') => get_user_uri($user->username, 'favorite_comments')
		), 0, 'comments_rss?user_id=' . $user->id, _('comentarios en rss2'), $tab_class);
	}

	public static function renderForProfileConversation($params, $tab_class)
	{
		global $user, $globals;

		return self::renderUserProfileSubheader(array(
			$user->username => get_user_uri($user->username, 'commented'),
			_('conversación').$globals['extra_comment_conversation'] => get_user_uri($user->username, 'conversation'),
			_('votados') => get_user_uri($user->username, 'shaken_comments'),
			_('favoritos') => get_user_uri($user->username, 'favorite_comments')
		), 1, 'comments_rss?answers_id='.$user->id, _('conversación en rss2'), $tab_class);
	}

	public static function renderForProfileShakenComments($params, $tab_class)
	{
		global $user, $globals;

		return self::renderUserProfileSubheader(array(
			$user->username => get_user_uri($user->username, 'commented'),
			_('conversación').$globals['extra_comment_conversation'] => get_user_uri($user->username, 'conversation'),
			_('votados') => get_user_uri($user->username, 'shaken_comments'),
			_('favoritos') => get_user_uri($user->username, 'favorite_comments')
		), 2, false, '', $tab_class);
	}

	public static function renderForProfileFavoriteComments($params, $tab_class)
	{
		global $user, $globals;

		return self::renderUserProfileSubheader(array(
			$user->username => get_user_uri($user->username, 'commented'),
			_('conversación').$globals['extra_comment_conversation'] => get_user_uri($user->username, 'conversation'),
			_('votados') => get_user_uri($user->username, 'shaken_comments'),
			_('favoritos') => get_user_uri($user->username, 'favorite_comments')
		), 3, false, '', $tab_class);
	}
}

