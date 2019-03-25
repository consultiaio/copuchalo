<?php
// The source code packaged with this file is Free Software, Copyright (C) 2011 by
// Ricardo Galli <gallir at gmail dot com> and Menéame COmunicaciones
// It's licensed under the AFFERO GENERAL PUBLIC LICENSE unless stated otherwise.
// You can get copies of the licenses here:
// 		http://www.affero.org/oagpl.html
// AFFERO GENERAL PUBLIC LICENSE is also included in the file called "COPYING".

include('../config.php');

header('Content-Type: application/json; charset=UTF-8');

$q = '';
if (isset($_GET['q'])) {
    $q = mb_strtolower(trim($_GET['q']));
}
if (!$q) {
    return;
}

$q = $db->escape($q);

$subs = $db->get_results("select id, name from subs where name like '$q%' and enabled = 1 and sub = 1 and meta = 0 and private = 0 order by name asc limit 10");

$json = [];
if ($subs) {
	foreach ($subs as $sub) {
	/*	if (isset($_GET['avatar']) && $_GET['avatar']) {
			if ($user->user_avatar > 0) {
				$avatar = get_avatar_url($user->user_id, $user->user_avatar, 20);
			} else {
				$avatar = get_no_avatar_url(20);
			}
		} else {
			$avatar = $user->user_avatar;
		}
	*/
		//echo mb_strtolower($user->user_login).'|'.$avatar."\n";
		$json[] = ['id'=>$sub->id, 'text'=>$sub->name];
	}
}

echo json_encode($json);
