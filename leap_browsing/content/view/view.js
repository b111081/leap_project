// 排他処理用変数
var sw_1 = 0, sw_2 = 0, sw_3 = 0, sw_4 = 0;
//ビュー用変数
var tabview, bkview;
// jquery用変数
var $tabview_dom, $bkview_dom;
// ジェスチャー用変数
var gesture_type;
// ジェスチャー状態用変数
var gesture_state;
// ジェスチャーカウント用変数
var right_cir_cnt = 0, left_cir_cnt = 0;
// ブロックの接触判定用変数
var num = 0, hide_block = 0;
// ビュー状態用変数
var view_state = 0;
// ビュー切り替えの時間差に用いる変数
var active_time = 0;
// ビューのフラグ管理用の変数
var view_flag;

// メイン処理のループ
Leap.loop({enableGestures: true}, function(frame){
  // ポインターの更新処理
  updatePointer(frame);
  
  // 円を描くと現在のタブを削除
  getCirclegesture(frame);
 
  // 指を一定時間開いていればフラグ成立
  activeFinger(getFinger(frame)); // クロージャでつくるべき

  // 一定時間2本指でタブビューを開く
  if (view_flag == 1 && sw_1 == 0 && sw_3 == 0) { openTabview(); }

  // 一定時間3本指でブックマークビューを開く
  if (view_flag == 2 && sw_3 == 0 && sw_1 == 0) { openBkview(); }
});

// 指の本数取得用関数
var getFinger =  function(opt_frame) {
  // 手が認識されているか
  if (opt_frame.hands.length > 0) {
    // 受け取ったframeオブジェクトから指に関する値を取得
    var hand = opt_frame.hands[0];
    var finger = hand.fingers[0];
    var extendedFingers = 0;

    // 開いている指の本数を取得
    for(var f = 0; f < hand.fingers.length; f++){
      var finger = hand.fingers[f];
      if(finger.extended) extendedFingers++;
    }
  } else {
    extendedFingers = 0;
  }
  return extendedFingers;
};

// ビューのフラグ管理用関数
var activeFinger =  function(opt_finger) {
  // 2本or3本指を一定時間でフラグが成立
  if (opt_finger == 2) {
  	active_time ++;
  	if (active_time > 80) {
  	  view_flag = 1;
  	  active_time = 0;
    }
  } else if (opt_finger == 3) {
  	active_time ++;
  	if (active_time > 80) {
  	  view_flag = 2;
  	  active_time = 0;
    }
  } else {
  	// 2本or3本指以外だとタイマー初期化
  	active_time = 0;
  }
};

// ポインタ座標更新用関数
var updatePointer = function(opt_frame) {
  if (opt_frame.fingers[0]) {
    // 現在フォーカスしているタブのDOMを取得
    var $forcus_tab = $(gBrowser.contentDocument);
    // Leapの座標を画面と対応させる
    var pointer_x = (opt_frame.fingers[0].tipPosition[0] * 5) + (window.parent.screen.width / 2);
    var pointer_y = (window.parent.screen.height  / 1.5) - (opt_frame.fingers[0].tipPosition[1] * 3);
    // 座標更新のためのオブジェクト作成
    var position = new Object();
    position.left = pointer_x;
    position.top = pointer_y;

    // ポインタの座標を更新
    if ($forcus_tab.find("#pointer").length != 0) {
  	  $forcus_tab.find("#pointer").offset(position);
    }

    // ブロックと接触しているか判定
    collisionBlock($forcus_tab, opt_frame, pointer_y);
  }
};

// ポインタとブロックの接触判定処理用関数
var collisionBlock =  function($opt_tab, opt_frame, opt_pointer_y) {
  // 調査ループに使用する変数
  var block_loop = $opt_tab.find("#block_pos #block").length;

  // ブロックの数だけ接触しているか調査
  if (block_loop > num) {
  	var b = $opt_tab.find("#block_pos #block").eq(num);
  	var block_col = $opt_tab.find("#pointer").collision(b);

  	// 接触していた場合ブロックにフォーカスする
    if (block_col.length != 0) {
  	  $opt_tab.find("#block_pos #block_text").eq(num).focus();

  	  // スクロール処理
  	  scrollBrowser($opt_tab, opt_pointer_y, num);

  	  // 調査するブロックの範囲を絞る
      block_loop = num +5;

  	  // タップジェスチャーをした場合ブロックを押す
  	  if (typeof(opt_frame.gestures) != 'undefined' ) {
        for (var i=0; i < opt_frame.gestures.length; i++) {
          gesture_type = opt_frame.gestures[i].type;
  	      if (gesture_type == 'keyTap' ) {
  	        // ビューの状態により処理を分ける
  	      	switch (view_state) {
  	      	  case 0:
  	      	    // 音声を再生する
   	            $opt_tab.find("body").append('<audio src="http://localhost/audio/cancel.mp3" autoplay></audio>');
                $opt_tab.find("audio").get(0).play(); 
  	      	    var uri = $opt_tab.find("#block_pos #block_text").eq(num).children().get(0).href;
                Block(uri);
                break;
  	      	  case 1:
  	      	    selectTabview(num);
  	      	    break;
  	      	  case 2:
  	      	    selectBkview(num);
  	      	    break;
  	      	}
  	      }
  	    }
  	  }
  	  } else { num++; }
    } else { num = 0; }
};

// 画面スクロール処理用関数
var scrollBrowser =  function($opt_tab, opt_pointer_y, opt_num) {
  // 下にスクロールする場合の底
  var bottom = window.parent.screen.height * (4/5);
  // 上にスクロールする場合の天井
  var top = window.parent.screen.height / 4;
  // ポインタのY座標を調整
  var y  = Math.floor(opt_pointer_y * 2);
  
  // 下にスクロール
  if (y > bottom) {
  	$opt_tab.find("#scroll_down").click();
  }
  
  // 上にスクロール
  if (opt_pointer_y > top) {
  }
};

// 円の情報処理用関数
var getCirclegesture =  function(opt_frame) {
  // ジェスチャーの向き用変数
  var clockwiseness;
  
  // 円を描くジェスチャー取得
  if (typeof(opt_frame.gestures) != 'undefined' ) {
    for (var i=0; i < opt_frame.gestures.length; i++) {
      //console.log(opt_obj.gestures[i].type);
      gesture_type = opt_frame.gestures[i].type;
      gesture_state = opt_frame.gestures[i].state;

      // 時計回りか反時計回りか
      if (gesture_type =='circle') {
        if (opt_frame.gestures[i].normal[2] <= 0) {
          clockwiseness = true;
        } else {
          clockwiseness = false;
        }
      }
    }
  }

  // 円の向きに応じてカウントアップ
  if (gesture_type == 'circle' && gesture_state == 'stop') {
    if (clockwiseness == true) {
      right_cir_cnt++;
    } else if (clockwiseness == false) {
      left_cir_cnt++;
    }
  }
  
  // 反時計周り2回でタブ削除
  if (left_cir_cnt == 2) {
  	gBrowser.removeCurrentTab();
  	left_cir_cnt = 0;
  }
  
  // 時計回り3回で現在のページをブックマーク
  if (right_cir_cnt == 3) {
  	var bmsvc = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                      .getService(Components.interfaces.nsINavBookmarksService);
  	var io = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
    var uri = io.newURI(gBrowser.contentDocument.location, null, null);
    var newBkmkId = bmsvc.insertBookmark(bmsvc.toolbarFolder, uri, -1, gBrowser.contentDocument.title);
  	right_cir_cnt = 0;
  }
  
};

// タブビュー表示用関数
var openTabview =  function() {
  // ビュー識別の変数処理
  view_state = 1;
  // 現在開かれているタブの数を取得
  var num = gBrowser.tabContainer.childNodes.length;
  // タブ情報を格納する配列
  var Tab = [];
  // ブロック配置用配列
  var Tab_block = [];

  // タブビュー用の新規タブを開く
  tabview = gBrowser.getBrowserForTab(gBrowser.addTab());

  // タブビューにフォーカスを移す
  gBrowser.selectedTab = gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1];

  // ページを読み込み終わると次の処理に移る
  tabview.addEventListener("load", function() {
    // ブロック配置用のdiv要素でタブビューを上書き
    tabview.contentDocument.body.innerHTML = "<div id='block_pos'> </div>";

    // タブビューをJqueryのDOM要素に変換し変数に格納
    $tabview_dom = $(tabview.contentDocument);

    // headにポインタに使うCSSを配置
    var pointer_css = '<style type="text/css">#pointer {width: 50px;height: 50px;-webkit-border-radius: 25px;-moz-border-radius: 25px;border-radius: 25px;background-color: #999;position: absolute;}</style>';
    $tabview_dom.find("head").append(pointer_css);
      
    // ポインタ要素を配置
    $tabview_dom.find("body").append('<div id="pointer"></div>');
    
    // タブ情報を配列に格納し、ブロック用配列に格納
    for (var i = 0; i < num; ++i) {
      var r = [];
      r[i] = i+1;
      Tab[i] = gBrowser.tabContainer.childNodes[i];
      Tab_block[i] =
         '<div id="block" style="float:left;"><button id="block_text" aria-label="タブ' + r[i] + '" value="' + r[i] +'" style="width : 200px;height : 400px; word-break:keep-all;">' + r[i] + '</button></div>'; 
      //console.log(Tab_block[i]);
      $tabview_dom.find("#block_pos").append(Tab_block[i]);
    }

    // 音声を再生する
   	$tabview_dom.find("body").append('<audio src="http://localhost/audio/tab.mp3" autoplay></audio>');
    $tabview_dom.find("audio").get(0).play();
  }, true);

  // ループ制御
  sw_1 = 1;
};

// タブ選択用関数
var selectTabview =  function(opt_num) {
  $tabview_dom = $(tabview.contentDocument);
  if (sw_2 == 0) {
    // 音声を再生する
    $tabview_dom.find("audio").remove();
   	$tabview_dom.find("body").append('<audio src="http://localhost/audio/cancel.mp3" autoplay></audio>');
    $tabview_dom.find("audio").get(0).play();
    // 音声が再生終了したら閉じる処理をする
    var promise = closeView(opt_num);
    promise.done(function() {
    });
  }
  sw_2 = 1;
};

// タブビュー変数初期化用関数
var initTabview  = function() {
  view_state = 0;
  sw_1 = 0;
  sw_2 = 0;
  right_cir_cnt = 0;
  view_flag = 0;
  active_time = 0;
};

// ブックマークビュー表示用関数
var openBkview =  function() {
  // ビュー識別の変数処理
  view_state = 2;
  
  // ブックマークビュー用の新規タブを開く
  bkview = gBrowser.getBrowserForTab(gBrowser.addTab());

  // ブックマークビューにフォーカスを移す
  gBrowser.selectedTab = gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1];

  // ページを読み込み終わると次の処理に移る
  bkview.addEventListener("load", function() {
    // ブックマークの情報を得るための準備
    var historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"]
                    .getService(Components.interfaces.nsINavHistoryService);
    var options = historyService.getNewQueryOptions();
    var query = historyService.getNewQuery();

    var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
                        .getService(Components.interfaces.nsINavBookmarksService);
    var toolbarFolder = bookmarksService.toolbarFolder;

    query.setFolders([toolbarFolder], 1);

    // ブックマークツールバーのルート取得
    var result = historyService.executeQuery(query, options);
    var rootNode = result.root;
    // ルートフォルダを開ける
    rootNode.containerOpen = true;

    // ブックマークのタイトルを格納する配列
    var bk_title = [];
    // ブックマークのuriを格納する配列
    var bk_uri = [];
    // ブックマークの総数取得用変数
    var bk_num = rootNode.childCount;

    // 使用するブックマークフォルダにあるブックマーク取得
    for (var i = 0; i < rootNode.childCount; i++) {
        var node = rootNode.getChild(i);
        bk_title[i] = node.title;
        bk_uri[i] = node.uri;
    }

    // 開けたフォルダを閉じる
    rootNode.containerOpen = false;
    // ブロック配置用のdiv要素でタブビューを上書き
    bkview.contentDocument.body.innerHTML = "<div id='block_pos'> </div>";
    // ブックマークビューをJqueryのDOM要素に変換し変数に格納
    $bkview_dom = $(bkview.contentDocument);
    // ブックマークブロックを格納する配列
    var bk_block = [];
  
    // headにポインタに使うCSSを配置
    var pointer_css = '<style type="text/css">#pointer {width: 50px;height: 50px;-webkit-border-radius: 25px;-moz-border-radius: 25px;border-radius: 25px;background-color: #999;position: absolute;}</style>';
    $bkview_dom.find("head").append(pointer_css);
      
    // ポインタ要素を配置
    $bkview_dom.find("body").append('<div id="pointer"></div>');
    
    // ブックマーク情報を配列に格納し、ブロック用配列に格納
    for (var i = 1; i < bk_num; ++i) {
        bk_block[i] =  
          '<div id="block" style="float:left;"><button id="block_text" aria-label="' + bk_title[i] +'" value="' + bk_uri[i] +'" style="width : 200px;height : 400px; word-break:keep-all;">' + bk_title[i] + '</button></div>'; 
      //console.log(Tab_block[i]);
      $bkview_dom.find("#block_pos").append(bk_block[i]);
    }

    // 音声を再生する
   	$bkview_dom.find("body").append('<audio src="http://localhost/audio/bk.mp3" autoplay></audio>');
    $bkview_dom.find("audio").get(0).play();
  }, true);

  // ループ制御
  sw_3 = 1;
};

// ブックマーク選択用関数
var selectBkview =  function(opt) {
  $bkview_dom = $(bkview.contentDocument);
  // ブックマークブロックが押されたか
    if (sw_4 == 0) {
      // 音声を再生する
      $bkview_dom.find("audio").remove();
   	  $bkview_dom.find("body").append('<audio src="http://localhost/audio/cancel.mp3" autoplay></audio>');
   	  // 音声再生終了後処理開始
      $bkview_dom.find("audio").get(0).play();
      // 音声が再生終了したら閉じる処理をする
      var promise = closeView($bkview_dom.find("#block_pos #block_text").eq(opt).val());
      promise.done(function() {
      });
    }
    sw_4 = 1;
};

// ブックマークビュー変数初期化用関数
var initBkview =  function() {
  view_state = 0;
  sw_3 = 0;
  sw_4 = 0;
  left_cir_cnt = 0;
  view_flag = 0;
  active_time = 0;
};

// ビュー消去用関数
var closeView =  function(opt) {
  // 同期処理用変数
  var defer = $.Deferred();
  if (sw_1 == 1) {
    setTimeout(function() {
      // 押されたタブブロックの番号のタブを開く
      gBrowser.selectedTab = gBrowser.tabContainer.childNodes[opt];
      // タブビュー消去
      gBrowser.removeTab(gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1]);
      defer.resolve();
      // 初期化処処理
      initTabview();
    }, 500);
  } else if (sw_3 == 1) {
    setTimeout(function() {
      // ブックマークビュー消去
      gBrowser.removeTab(gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1]);
      // 押されたブックマークブロックのブックマークを開く
      Block(opt);
      defer.resolve();
      // 初期化処処理
      initBkview();
    }, 500);
  }
  return defer.promise();
};