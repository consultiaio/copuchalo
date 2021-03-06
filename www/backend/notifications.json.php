<?php
// The source code packaged with this file is Free Software, Copyright (C) 2012 by
// Ricardo Galli <gallir at gallir dot com>.
// It's licensed under the AFFERO GENERAL PUBLIC LICENSE unless stated otherwise.
// You can get copies of the licenses here:
// 		http://www.affero.org/oagpl.html
// AFFERO GENERAL PUBLIC LICENSE is also included in the file called "COPYING".

// Use the alternate server for api, if it exists
//$globals['alternate_db_server'] = 'backend';

include('../config.php');
//$db->connect_timeout = 3;

if (! $current_user->user_id) die;

if (! empty($_GET['redirect'])) {
	do_redirect($_GET['redirect']);
	exit(0);
}

header('Content-Type: application/json; charset=utf-8');
http_cache(5);

$notifications = new stdClass();

$notifications->posts = (int) Post::get_unread_conversations($current_user->user_id);
$notifications->comments = (int) Comment::get_unread_conversations($current_user->user_id);
$notifications->privates = (int) PrivateMessage::get_unread($current_user->user_id);
$notifications->friends = count(User::get_new_friends($current_user->user_id));

# Admin notifications
if($current_user->user_level == 'admin' OR $current_user->user_level == 'god') {
	$notifications->adminposts = (int) Post::get_unread_conversations($globals['admin_user_id']);
	$notifications->admincomments = (int) Comment::get_unread_conversations($globals['admin_user_id']);
	$notifications->adminreports = (int) Report::get_total_in_status(Report::REPORT_STATUS_PENDING) + (int) Report::get_total_in_status(Report::REPORT_STATUS_DEBATE);
} else {
	$notifications->adminposts = 0;
	$notifications->admincomments = 0;
	$notifications->adminreports = 0;
}

$notifications->total = $notifications->posts + $notifications->privates + $notifications->friends + $notifications->comments + $notifications->adminposts + $notifications->admincomments + $notifications->adminreports;
die(json_encode($notifications));


function do_redirect($type) {
	global $globals, $current_user;

	switch ($type) {
		case 'privates':
			$url = post_get_base_url('_priv');
			break;
		case 'posts':
			$url = post_get_base_url($current_user->user_login) . '/_conversation';
			break;
		case 'comments':
			$url = get_user_uri($current_user->user_login, 'conversation');
			break;
		case 'friends':
			$url = get_user_uri($current_user->user_login, 'friends_new');
			break;
		case 'adminposts':
			$url = post_get_base_url('admin') . '/_conversation';
			break;
		case 'admincomments':
			$url = get_user_uri('admin', 'conversation');
			break;
		case 'adminreports':
			$url = 'https://'.get_server_name().'/admin/reports.php';
			break;
		default: 
			$url = '/'; // If everything fails, it will be redirected to the home
			break;
	}

	header("HTTP/1.1 302 Moved");
	header('Location: ' . $url);
	header("Content-Length: 0");

}

