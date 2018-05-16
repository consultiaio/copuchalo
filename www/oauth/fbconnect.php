<?php
// The Meneame source code is Free Software, Copyright (C) 2005-2010 by
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
// 		http://www.affero.org/oagpl.html
// AFFERO GENERAL PUBLIC LICENSE is also included in the file called "COPYING".


$base = dirname(dirname($_SERVER["SCRIPT_FILENAME"])); // Get parent dir that works with symbolic links
include("$base/config.php");

include('base.php');
include_once(mnminclude.'Facebook/autoload.php');


class FBConnect extends OAuthBase {

	function __construct() {
		global $globals;

		if (!session_id()) {
			session_start();
		}

		parent::__construct();

		$this->service = 'facebook';

		$this->facebook = new Facebook\Facebook([
					'app_id' => $globals['facebook_key'],
					'app_secret' => $globals['facebook_secret'],
					'default_graph_version' => $globals['facebook_api_version'],
					]);

		$this->helper = $this->facebook->getRedirectLoginHelper();
	}

	function authRequest() {
		global $globals;

		$loginUrl = $this->helper->getLoginUrl($globals['scheme']. '//' . $globals['server_name'] . $globals['base_url']. 'oauth/fbconnect.php');
		header("Location: ".$loginUrl);
		exit;
	}

	function authorize() {
		global $globals, $db;

		try {
			$accessToken = $this->helper->getAccessToken();
		} catch(Facebook\Exceptions\FacebookResponseException $e) {
			// When Graph returns an error
			echo 'Graph returned an error: ' . $e->getMessage();
			exit;
		} catch(Facebook\Exceptions\FacebookSDKException $e) {
			// When validation fails or other local issues
			echo 'Facebook SDK returned an error: ' . $e->getMessage();
			exit;
		}

		if (! isset($accessToken)) {
			if ($this->helper->getError()) {
				header('HTTP/1.0 401 Unauthorized');
				echo "Error: " . $this->helper->getError() . "\n";
				echo "Error Code: " . $this->helper->getErrorCode() . "\n";
				echo "Error Reason: " . $this->helper->getErrorReason() . "\n";
				echo "Error Description: " . $this->helper->getErrorDescription() . "\n";
			} else {
				header('HTTP/1.0 400 Bad Request');
				echo 'Bad request';
			}
			exit;
		}

		if (!$accessToken->isLongLived()) {
			try {
				$oAuth2Client = $this->facebook->getOAuth2Client();
				$accessToken = $oAuth2Client->getLongLivedAccessToken($accessToken);
			} catch (Facebook\Exceptions\FacebookSDKException $e) {
				echo "<p>Error getting long-lived access token: " . $this->helper->getMessage() . "</p>\n\n";
				exit;
			}
		}

		$this->facebook->setDefaultAccessToken((string)$accessToken);
		$_SESSION['fb_access_token'] = (string) $accessToken;

		// getting basic info about user
		try {
			$user_profile = $this->facebook->get('/me?fields=id,name,picture.type(large)')->getGraphUser()->asArray();
		} catch(FacebookApiException $e) {
			// redirecting user back to app login page
			$this->user = null;
			$this->user_return();
			exit;
		}

		$this->token = $user_profile['id'];
		$this->secret = $user_profile['id'];
		$this->uid = $user_profile['id'];
		$this->username = User::get_valid_username($user_profile['name']);

		$db->transaction();
		if (!$this->user_exists()) {
			$this->names = $user_profile['name'];
			if ($user_profile['picture']['url']) {
				$this->avatar = $user_profile['picture']['url'];
			}
			$this->store_user();
		}
		$this->store_auth();
		$db->commit();
		$this->user_login();
	}
}


/* *********************** Begin ********************************* */
$auth = new FBConnect();

if (isset($_SESSION['FBRLH_state']) && isset($_REQUEST['code']) && isset($_REQUEST['state'])) {
	$auth->authorize();
} else {
	$auth->authRequest();
}

