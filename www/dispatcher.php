<?php
$routes = array(
	''		=> 'index.php',
	'story'		=> 'story.php',
	'submit'	=> 'submit.php',
	'subedit'	=> 'subedit.php',
	'temas'		=> 'subs.php',
	'subs'		=> 'subs.php',
	'editlink'	=> 'editlink.php',
	'comment_ajax'	=> 'backend/comment_ajax.php',
	'login'		=> 'login.php',
	'register'	=> 'register.php',
	'cloud'		=> 'cloud.php',
	'sites_cloud'	=> 'sitescloud.php',
	'sitescloud'	=> 'sitescloud.php',
	'rsss'		=> 'rsss.php',
	'promote'	=> 'promote.php',
	'values'	=> 'values.php',
	'queue'		=> 'shakeit.php',
	'legal'		=> 'legal.php',
	'go'		=> 'go.php',
//	'b'		=> 'bar.php',
	'c'		=> 'comment.php',
	'm'		=> 'submnm.php',
	'tema'		=> 'submnm.php',
	'user'		=> 'user.php',
	'search'	=> 'search.php',
	'between'	=> 'between.php',
	'rss'		=> 'rss2.php',
	'comments_rss'	=> 'comments_rss2.php',
	'sneakme_rss'	=> 'sneakme_rss2.php',
	'sneak'		=> 'sneak.php',
	'stream'        => 'stream.php',
	'telnet'	=> 'telnet.php',
	'popular'	=> 'topstories.php',
	'top_visited'	=> 'topclicked.php',
	'top_active'	=> 'topactive.php',
	'top_comments'	=> 'topcomments.php',
	'top_users'	=> 'topusers.php',
	'top_commented'	=> 'topcommented.php',
	'profile'	=> 'profile.php',
	'sitemap'	=> 'sitemap.php',
	'trends'	=> 'trends.php',
	'faq-es'	=> 'faq-es.php',
	'publicidad'	=> 'publicidad.php',
	'opensearch'	=> 'opensearch_plugin.php',
	'backend'	=> 'backend/dispatcher.php',
	'postits'	=> 'sneakme/dispatcher.php',
	'miner'		=> 'contribute.php',
	'contribute'	=> 'contribute.php',
);

$globals['path'] = $path = preg_split('/\/+/', $_SERVER['PATH_INFO'], 10, PREG_SPLIT_NO_EMPTY);
$script = $routes[$path[0]];

//syslog(LOG_INFO, "path_info: ".$_SERVER['PATH_INFO']." ||| path: ".print_r($path,true));

if (!empty($script) && file_exists($script)) {
	//syslog(LOG_INFO, "Include $script");
	$globals['script'] = $script;
	if ((include './'.$script) === FALSE) {
		include_once 'config.php';
		do_error("bad request $script", 400, true);
	}
} else {
	// Try to reconstruct images from cache if were erased
	include_once 'config.php';
	//syslog(LOG_INFO, "Reconstruct: ".$_SERVER['PATH_INFO']);
	reconstruct_cache_images($_SERVER['PATH_INFO']);
	// else, error
	do_error("not found", 404, true);
}

