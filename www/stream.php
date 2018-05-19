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
$page = get_current_page();
$offset = ($page-1)*$page_size;

$globals['tag_status'] = 'queued';
$tab = 1;

$pagetitle = _('stream de noticias');
if ($page > 1) {
    $pagetitle .= " ($page)";
}
do_header($pagetitle, _('stream'), false, $tab);


echo '<div>';
echo '<div id="newswrap" class="col-sm-9">';
echo '<div class="row">';

$rows = $db->get_var("select count(*) from rss, blogs where rss.blog_id = blogs.blog_id order by rss.date_parsed");
$entries = $db->get_results("select rss.blog_id, rss.user_id, title, url, summary, media_url, blogs.blog_url, blogs.blog_title, rss.date_parsed from rss, blogs where rss.blog_id = blogs.blog_id order by rss.date_parsed desc limit $offset,$page_size");

if($globals['mobile']) {
	$pagetoserve = "stream_card.html";
} else {
	$pagetoserve = "stream.html";
}

if ($entries) {
	foreach($entries as $entry) {
		$blog_title = strip_tags($entry->blog_title);
		$title = strip_tags($entry->title);
		$summary = strip_tags($entry->summary);
		$url = clean_input_string($entry->url);
		$blog_url = preg_replace('/^www\./', '', parse_url(clean_input_string($entry->blog_url), 1));
		$media_url = clean_input_string($entry->media_url);
		$date = $entry->date_parsed;
		Haanga::Load($pagetoserve, compact('blog_title', 'title', 'summary', 'url', 'media_url', 'date', 'blog_url'));
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

