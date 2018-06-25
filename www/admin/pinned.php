<?php
// The source code packaged with this file is Free Software, Copyright (C) 2007 by
// David Martín :: Suki_ :: <david at sukiweb dot net>.
// It's licensed under the AFFERO GENERAL PUBLIC LICENSE unless stated otherwise.
// You can get copies of the licenses here:
// 		http://www.affero.org/oagpl.html
// AFFERO GENERAL PUBLIC LICENSE is also included in the file called "COPYING".

$globals['skip_check_ip_noaccess'] = true;
include('../config.php');
include(mnminclude . 'html1.php');
require_once(mnminclude . 'ban.php');
include('libs/admin.php');

do_header(_('Admin pinned story'));

$selected_tab = "pinned story";
do_admin_tabs($selected_tab);

$key = get_security_key();
$sitekey = 'top-link-pinned-'.$globals['site_shortname'];

$info = read($sitekey);
$id_story = $info['id_story'];
$expire = expstr($info['expire']);

if(isset($_REQUEST['editing']) && $current_user->user_level=="god" && check_security_key($_REQUEST['key'])) {
	if(isset($_REQUEST['id_story']) && is_numeric($_REQUEST['id_story']) && isset($_REQUEST['expire']) && is_numeric($_REQUEST['expire']) && ($_REQUEST['expire'] == 0 || $_REQUEST['expire'] > $globals['now'])) {
		$id_story = save($sitekey, $_REQUEST['id_story'], $_REQUEST['expire']);
		$expire = expstr($_REQUEST['expire']);
	}
}

if($id_story == 0) $expire = "------";

Haanga::Load('admin/pinned/new.html', compact('id_story', 'selected_tab', 'key', 'expire'));

do_footer();


function expstr($exp) {
	return $exp ? gmdate("d-m-Y H:i:s \C\E\T", $exp) : _('Sin caducidad');
}


function read($sitekey) {

	$id_story = 0;
	$expire = 0;

	$top = new Annotation($sitekey);
	if($top->read()) {
		$id_story = $top->text;
		$expire = $top->expire;
	}

	return compact('id_story', 'expire');
}

function save($sitekey, $id, $date) {

	$top = new Annotation($sitekey);
	if($id == 0) {
		$top->delete();
		return $id;
	}

	$link = Link::from_db($id);
	if($link) {
		$top->text = $id;
		$top->store($date);
		return $id;
	} else {
		$top->delete();
		return 0;
	}
}
