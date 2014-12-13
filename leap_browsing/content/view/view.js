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
// ジェスチャーの向き用変数
var clockwiseness;
// 指の本数用変数
var finger_length = 0;
// ブロックの接触判定用変数
var num = 0, hide_block = 0;

// LeapMotion処理のループ関数
Leap.loop({enableGestures: true}, function(frame){
  // ポインターの更新処理
  if (frame.fingers[0]) {
    updatePointer(frame);
  }
  
  // 描いた円の処理
  getCirclegesture(frame);
  
  // 開いている指の本数を取得
  var finger_length = getFinger(frame);

  // タブビューを開く処理
  if (finger_length == 2 && right_cir_cnt == 1 && sw_1 == 0 && sw_3 == 0) { openTabview(); }
  if (sw_1 == 1) { selectTabview(); }
  if (sw_2 == 1) { initTabview(); }

  // ブックマークビューを開く処理
  if (finger_length == 3 && left_cir_cnt == 1 && sw_3 == 0 && sw_1 == 0) { openBkview(); }
  if (sw_3 == 1 && sw_4 == 0) { selectBkview(); }
  if (sw_4 == 1) { initBkview(); }

  gesture_type = 0;
  finger_length = 0;
});

// 指の本数取得用関数
function getFinger(opt_frame) {
  // 手が認識されているか
  if (opt_frame.hands.length > 0) {
    //受け取ったframeオブジェクトから指に関する値を取得
    var hand = opt_frame.hands[0];
    var finger = hand.fingers[0];
    var extendedFingers = 0;
		
    //開いている指の本数を取得
    for(var f = 0; f < hand.fingers.length; f++){
      var finger = hand.fingers[f];
      if(finger.extended) extendedFingers++;
    }
  } else {
    extendedFingers = 0;
  }
  return extendedFingers;
}

// ポインタ座標更新用関数
function updatePointer(opt_frame) {
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
  collisionBlock($forcus_tab);
}

// ポインタとブロックの接触判定処理用関数
function collisionBlock($opt_tab) {
  if ($opt_tab.find("#block_pos #block").length > num) {
  	var b = $opt_tab.find("#block_pos #block").eq(num);
  	var block_col = $opt_tab.find("#pointer").collision(b);
  	if (block_col.length != 0) {
  	  $opt_tab.find("#block_pos #block_text").eq(num).focus();
  	  console.log($opt_tab.find("#block_pos #block_text").eq(num).val());
  	} else {
  		num++;
  	}
  } else {
  	num = 0;
  }
  /*$opt_tab.find("#block_pos #block_text").each(function(index) {
    //var b = $opt_tab.find("#block_pos #block_text").eq(num);
    var block_col = $opt_tab.find("#pointer").collision($(this));
    //console.log(block_col);
    if (block_col.length != 0) {
  	  $(this).focus();
  	}
  });*/
}

// 円の情報処理用関数
function getCirclegesture(opt_frame) {
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
}

// タブビュー表示用関数
function openTabview() {
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
    tabview.contentDocument.body.innerHTML = "<div id='tab_block_pos'> </div>";

    // タブビューをJqueryのDOM要素に変換し変数に格納
    $tabview_dom = $(tabview.contentDocument);

    // タブ情報を配列に格納し、ブロック用配列に格納
    for (var i = 0; i < num; ++i) {
      var r = [];
      r[i] = i+1;
      Tab[i] = gBrowser.tabContainer.childNodes[i];
      Tab_block[i] =
         '<div id="block" style="float:left;"><button id="tab_block" aria-label="タブ' + r[i] + '" value="' + r[i] +'" style="width : 200px;height : 400px; word-break:keep-all;">' + r[i] + '</button></div>'; 
      //console.log(Tab_block[i]);
      $tabview_dom.find("#tab_block_pos").append(Tab_block[i]);
    }

    // 音声を再生する
   	$tabview_dom.find("body").append('<audio src="http://localhost/audio/tab.mp3" autoplay></audio>');
    $tabview_dom.find("audio").get(0).play();
  }, true);

  // ループ制御
  sw_1 = 1;
}

// タブ選択用関数
function selectTabview() {
  $tabview_dom = $(tabview.contentDocument);
  // タブブロックが押されたか
  $tabview_dom.find("#tab_block_pos #tab_block").click(function () {
  	if (sw_2 == 0) {
  	  // 音声を再生する
      $tabview_dom.find("audio").remove();
   	  $tabview_dom.find("body").append('<audio src="http://localhost/audio/cancel.mp3" autoplay></audio>');
      $tabview_dom.find("audio").get(0).play();
      // 音声が再生終了したら閉じる処理をする
      var promise = closeView($(this).val() - 1);
      promise.done(function() {
      });
   }
    sw_2 = 1;
   });
}

// タブビュー変数初期化用関数
function initTabview() {
  sw_1 = 0;
  sw_2 = 0;
  right_cir_cnt = 0;
}

// ブックマークビュー表示用関数
function openBkview() {
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
    for (var i = 1; i < rootNode.childCount; i++) {
        var node = rootNode.getChild(i);
        bk_title[i] = node.title;
        bk_uri[i] = node.uri;
    }

    // 開けたフォルダを閉じる
    rootNode.containerOpen = false;
    // ブロック配置用のdiv要素でタブビューを上書き
    bkview.contentDocument.body.innerHTML = "<div id='bk_block_pos'> </div>";
    // ブックマークビューをJqueryのDOM要素に変換し変数に格納
    $bkview_dom = $(bkview.contentDocument);
    // ブックマークブロックを格納する配列
    var bk_block = [];

    // ブックマーク情報を配列に格納し、ブロック用配列に格納
    for (var i = 1; i < bk_num; ++i) {
        bk_block[i] =  
          '<div id="block" style="float:left;"><button id="bk_block" aria-label="' + bk_title[i] +'" value="' + bk_uri[i] +'" style="width : 200px;height : 400px; word-break:keep-all;">' + bk_title[i] + '</button></div>'; 
      //console.log(Tab_block[i]);
      $bkview_dom.find("#bk_block_pos").append(bk_block[i]);
    }

    // 音声を再生する
   	$bkview_dom.find("body").append('<audio src="http://localhost/audio/bk.mp3" autoplay></audio>');
    $bkview_dom.find("audio").get(0).play();
  }, true);

  // ループ制御
  sw_3 = 1;
}

// ブックマーク選択用関数
function selectBkview() {
  $bkview_dom = $(bkview.contentDocument);
  // ブックマークブロックが押されたか
  $bkview_dom.find("#bk_block_pos #bk_block").one('click', function () {
    if (sw_4 == 0) {
      // 音声を再生する
      $bkview_dom.find("audio").remove();
   	  $bkview_dom.find("body").append('<audio src="http://localhost/audio/cancel.mp3" autoplay></audio>');
   	  // 音声再生終了後処理開始
      $bkview_dom.find("audio").get(0).play();
      // 音声が再生終了したら閉じる処理をする
      var promise = closeView($(this).val());
      promise.done(function() {
      });
    }
    sw_4 = 1;
  });
}

// ブックマークビュー変数初期化用関数
function initBkview() {
  sw_3 = 0;
  sw_4 = 0;
  left_cir_cnt = 0;
}

// ビュー消去用関数
function closeView(opt) {
  // 同期処理用変数
  var defer = $.Deferred();
  if (sw_1 == 1) {
    setTimeout(function() {
      // 押されたタブブロックの番号のタブを開く
      gBrowser.selectedTab = gBrowser.tabContainer.childNodes[opt];
      // タブビュー消去
      gBrowser.removeTab(gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1]);
      defer.resolve();
    }, 500);
  } else if (sw_3 == 1) {
    setTimeout(function() {
      // ブックマークビュー消去
      gBrowser.removeTab(gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1]);
      // 押されたブックマークブロックのブックマークを開く
      Block.startBlock(opt);
    defer.resolve();
    }, 500);
  }
  return defer.promise();
}