<?php
// The Meneame source code is Free Software, Copyright (C) 2005-2009 by
// Ricardo Galli <gallir at gmail dot com> and Menéame Comunicacions S.L.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// It's licensed under the AFFERO GENERAL PUBLIC LICENSE unless stated otherwise.
// You can get copies of the licenses here:
//	  http://www.affero.org/oagpl.html
// AFFERO GENERAL PUBLIC LICENSE is also included in the file called "COPYING".

include_once('config.php');
include(mnminclude.'html1.php');

$page_size = $globals['page_size'] * 2;

meta_get_current();

$page = get_current_page();
$offset = ($page-1)*$page_size;
$rows = -1; // Don't show page numbers by default

// Same sql as link, but removing sub_statuses.id = @site_id in first LEFT JOIN... absolutely no sense!
const SQL = " link_id as id, link_author as author, link_blog as blog, link_status as status, sub_statuses.status as sub_status, sub_statuses.id as sub_status_id, UNIX_TIMESTAMP(sub_statuses.date) as sub_date, link_votes as votes, link_negatives as negatives, link_anonymous as anonymous, link_votes_avg as votes_avg, link_votes + link_anonymous as total_votes, link_comments as comments, link_karma as karma, sub_statuses.karma as sub_karma, link_randkey as randkey, link_url as url, link_uri as uri, link_url_title as url_title, link_title as title, link_tags as tags, link_content as content, UNIX_TIMESTAMP(link_date) as date,  UNIX_TIMESTAMP(link_sent_date) as sent_date, UNIX_TIMESTAMP(link_published_date) as published_date, UNIX_TIMESTAMP(link_modified) as modified, link_content_type as content_type, link_ip as ip, link_thumb_status as thumb_status, user_login as username, user_email as email, user_avatar as avatar, user_karma as user_karma, user_level as user_level, user_adcode, user_adchannel, subs.name as sub_name, subs.id as sub_id, subs.server_name, subs.sub as is_sub, subs.owner as sub_owner, subs.base_url, subs.created_from, subs.allow_main_link, creation.status as sub_status_origen, UNIX_TIMESTAMP(creation.date) as sub_date_origen, subs.color1 as sub_color1, subs.color2 as sub_color2, subs.page_mode as page_mode, favorite_link_id as favorite, clicks.counter as clicks, votes.vote_value as voted, media.size as media_size, media.mime as media_mime, media.extension as media_extension, media.access as media_access, UNIX_TIMESTAMP(media.date) as media_date, 1 as `read` FROM links
        INNER JOIN users on (user_id = link_author)
        LEFT JOIN sub_statuses ON (@site_id > 0 and sub_statuses.link = links.link_id)
        LEFT JOIN (sub_statuses as creation, subs) ON (creation.link=links.link_id and creation.id=creation.origen and creation.id=subs.id)
        LEFT JOIN votes ON (link_date > @enabled_votes and vote_type='links' and vote_link_id = links.link_id and vote_user_id = @user_id and ( @user_id > 0  OR vote_ip_int = @ip_int ) )
        LEFT JOIN favorites ON (@user_id > 0 and favorite_user_id =  @user_id and favorite_type = 'link' and favorite_link_id = links.link_id)
        LEFT JOIN link_clicks as clicks on (clicks.id = links.link_id)
        LEFT JOIN media ON (media.type='link' and media.id = link_id and media.version = 0) ";

$SQL_CALL = Link::SQL;

$from = '';
switch ($globals['meta']) {
	case '_subs':
		if ($current_user->user_id && $current_user->has_subs) {
			$globals['tag_status'] = 'queued';
			$from_time = '"'.date("Y-m-d H:00:00", $globals['now'] - $globals['time_enabled_votes']).'"';
			$where = "id in ($current_user->subs) AND status='queued' and id = origen and date > $from_time";
			//$order_by = "ORDER BY date DESC";
			$order_by = "ORDER BY sub_date DESC";
			$rows = -1;
			$tab = 7;
			Link::$original_status = true; // Show status in original sub
			break;
		}
		// NOTE: If the user has no subscriptions it will fall into next: _*
	case '_*':
		$globals['tag_status'] = 'queued';
		$from_time = '"'.date("Y-m-d H:00:00", $globals['now'] - $globals['time_enabled_votes']).'"';
		$from = ", subs";
		$where = "sub_statuses.status='queued' AND sub_statuses.id = sub_statuses.origen and sub_statuses.date > $from_time and sub_statuses.origen = subs.id and subs.owner > 0";
		$order_by = "ORDER BY sub_statuses.date DESC";
		$rows = -1;
		$tab = 8;
		Link::$original_status = true; // Show status in original sub
		$SQL_CALL = SQL;
		break;
	case '_friends':
		$globals['noindex'] = true;
		$from_time = '"'.date("Y-m-d H:00:00", $globals['now'] - $globals['time_enabled_votes']).'"';
		$from = ", friends, links";
		$where = "sub_statuses.id = ". SitesMgr::my_id() ." AND date > $from_time and status='queued' and friend_type='manual' and friend_from = $current_user->user_id and friend_to=link_author and friend_value > 0 and link_id = link";
		$rows = -1;
		//$order_by = "ORDER BY date DESC";
		$order_by = "ORDER BY sub_date DESC";
		$tab = 2;
		$globals['tag_status'] = 'queued';
		break;
	case '_popular':
		// Show  the higher karma first
		$globals['noindex'] = true;
		$from_time = '"'.date("Y-m-d H:00:00", $globals['now'] - 86400*4).'"';
		$from = ", links, link_clicks";
		$where = "sub_statuses.id = ". SitesMgr::my_id() ." AND date > $from_time and status='queued' and link = link_id and link_id = link_clicks.id and link_clicks.counter/(link_votes+link_negatives) > 1.3 and link_karma > 20 ";
		$order_by = "ORDER BY link_karma DESC";
		$rows = -1;
		$tab = 3;
		$globals['tag_status'] = 'queued';
		break;
	case '_discarded':
		// Show only discarded in four days
		$globals['noindex'] = true;
		$globals['ads'] = false;
		$from_time = '"'.date("Y-m-d H:00:00", $globals['now'] - 86400*4).'"';
		$where = "sub_statuses.id = ". SitesMgr::my_id() ." AND status in ('discard', 'abuse', 'autodiscard') " ;
		//$order_by = "ORDER BY date DESC ";
		$order_by = "ORDER BY sub_date DESC ";
		$tab = 5;
		$globals['tag_status'] = 'discard';
		$rows = Link::count('discard') + Link::count('autodiscard') + Link::count('abuse');
		break;
	case '_all':
	default:
		$globals['tag_status'] = 'queued';
		//$order_by = "ORDER BY date DESC";
		$order_by = "ORDER BY sub_date DESC";
		$rows = Link::count('queued');
		$where = "sub_statuses.id = ". SitesMgr::my_id() ." AND status='queued' ";
		$tab = 1;
		break;
}


$pagetitle = _('noticias pendientes');
if ($page > 1) {
    $pagetitle .= " ($page)";
}
do_header($pagetitle, _('nuevas'), false, $tab);


echo '<div>';
echo '<div id="newswrap" class="col-sm-9">';
echo '<div class="row">';

// *** Sorting in a subselect only works with myslq:
//     http://stackoverflow.com/questions/26372511/mysql-order-by-inside-subquery
//     https://mariadb.atlassian.net/browse/MDEV-3926
// Old optimizacions from Galli are not correct for other databases like MariaDB: https://gallir.wordpress.com/2011/02/02/optimizando-obsesivamente-las-consultas-al-mysql/ 

//$sql = "SELECT".Link::SQL."INNER JOIN (SELECT link FROM sub_statuses $from WHERE $where $order_by LIMIT $offset,$page_size) as ids on (ids.link = link_id)";
$sql = "SELECT".$SQL_CALL."INNER JOIN (SELECT link FROM sub_statuses $from WHERE $where) as ids on (ids.link = link_id) $order_by LIMIT $offset,$page_size";

$links = $db->object_iterator($sql, "Link");
if ($links) {
	foreach($links as $link) {
		if ($link->status == 'draft' && $link->author != $current_user->user_id) continue;
		$link->max_len = 600;
		if ($offset < 1000) {
			$link->print_summary('queue', 16);
		} else {
			$link->print_summary('queue');
		}
	}
}


do_pages($rows, $page_size);
echo '</div></div>';



/*** SIDEBAR ****/
echo '<div id="sidebar" class="col-sm-3">';
do_sub_message_right();
do_banner_right();
do_last_subs('queued', 15, 'link_karma');
if ($globals['show_popular_queued']) do_best_queued();
//do_last_blogs();
//do_best_comments();
//do_categories_cloud('queued', 24);
do_vertical_tags('queued');
echo '</div>';
/*** END SIDEBAR ***/

echo '</div>';

do_footer();

