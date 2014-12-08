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

// 各ビュー処理の監視用関数
function viewLoop() {
  // leapmotionから送られるデータ用変数
  var leap_soket = null;

  // 2つのWebSocketオブジェクトをサポートしているか
  if ((typeof(WebSocket) == 'undefined') && (typeof(MozWebSocket) != 'undefined')) {
    WebSocket = MozWebSocket;
  }

  // LeapMotionからデータ取得
  leap_soket = new WebSocket("ws://localhost:6437/");
  // 成功
  leap_soket.onopen = function(event) {
  	var enableMessage = JSON.stringify({enableGestures: true});
    leap_soket.send(enableMessage); // ジェスチャー有効化
  	console.log(event + "WebSocket connection open!"); 
  };
   // エラー
  leap_soket.onerror = function(event) { console.log(event + "Received error"); };
  // 切断
  leap_soket.onclose = function(event) {
    leap_soket = null;
    console.log(event + "WebSocket connection closed");
  };
  
  // データが送られてくる度処理を行う
  leap_soket.onmessage = function(event) {
    // JSON解析
    var obj = JSON.parse(event.data);
    
    // 描いた円の処理
    getCircleGesture(obj);
    
    // タブビューを開く処理
    if (right_cir_cnt == 1 && sw_1 == 0 && sw_3 == 0) { tabviewOpen(); }
    if (sw_1 == 1) { tabviewSelect(); }
    if (sw_2 == 1) { tabviewInit(); }
    
    // ブックマークビューを開く処理
    if (left_cir_cnt == 1 && sw_3 == 0 && sw_1 == 0) { bkviewOpen(); }
    if (sw_3 == 1 && sw_4 == 0) { bkviewSelect(); }
    if (sw_4 == 1) { bkviewInit(); }
    
    gesture_type = 0;
  };  
}

// 円の情報処理用関数
function getCircleGesture(opt_obj) {
    // 円を描くジェスチャー取得
    if (typeof(opt_obj.gestures) != 'undefined' ) {
      for (var i=0; i < opt_obj.gestures.length; i++) {
      	gesture_type = opt_obj.gestures[i].type;
      	gesture_state = opt_obj.gestures[i].state;
      	
      	// 時計回りか反時計回りか
      	if (gesture_type =='circle') {
      	  if (opt_obj.gestures[i].normal[2] <= 0) {
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
        console.log(right_cir_cnt);
      } else if (clockwiseness == false) {
      	left_cir_cnt++;
      	console.log(left_cir_cnt);
      }
    }
}

// タブビュー表示用関数
function tabviewOpen() {
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

    // 音声再生用処理
   	//$tabview_dom.find("body").append('<audio src="http://localhost/audio/tab_open.mp3" autoplay></audio>');
    //$tabview_dom.find("audio").get(0).play();
  }, true);
  
  //ループ制御
  sw_1 = 1;
}

// タブ選択用関数
function tabviewSelect() {
  $tabview_dom = $(tabview.contentDocument);
  // タブブロックが押されたか
  $tabview_dom.find("#tab_block_pos #tab_block").click(function () {
  	if (sw_2 == 0) {
      // 押されたタブブロックの番号のタブを開く
      gBrowser.selectedTab = gBrowser.tabContainer.childNodes[$(this).val() - 1];
      // タブビュー消去
      gBrowser.removeTab(gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1]);
   }
    sw_2 = 1;
  });
}

// タブビュー変数初期化用関数
function tabviewInit() {
  sw_1 = 0;
  sw_2 = 0;
  right_cir_cnt = 0;
}

// ブックマークビュー表示用関数
function bkviewOpen() {
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
    
    // 音声再生用処理
   	//$tabview_dom.find("body").append('<audio src="http://localhost/audio/bk_open.mp3" autoplay></audio>');
    //$tabview_dom.find("audio").get(0).play();

    
  }, true);
  
  //ループ制御
  sw_3 = 1;
}

// ブックマーク選択用関数
function bkviewSelect() {
  $bkview_dom = $(bkview.contentDocument);
  // ブックマークブロックが押されたか
  $bkview_dom.find("#bk_block_pos #bk_block").one('click', function () {
    if (sw_4 == 0) {
      // 押されたブックマークブロックのブックマークを開く
      Block.startBlock($(this).val());
      // ブックマークビュー消去
      gBrowser.removeTab(gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-2]);
    }
    sw_4 = 1;
  });
}

// ブックマークビュー変数初期化用関数
function bkviewInit() {
  sw_3 = 0;
  sw_4 = 0;
  left_cir_cnt = 0;
}