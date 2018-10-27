<?php

include('config.php');
include(mnminclude.'html1.php');

do_header(_('colabora con mediatize'), '', false, false, '', false, false);

echo '<div id="singlewrap" class="col-sm-10">';
echo '<div class="topheading th-no-margin"><h2>Colabora con mediatize.info</h2></div>';

Haanga::Load('private/contribute.html', compact('globals'));

echo '</div>';

do_footer();

