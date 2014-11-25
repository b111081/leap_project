// 排他処理用変数
var sw_1 = 0, sw_2 = 0, sw_3 = 0, sw_4 = 0;
//ビュー用変数
var tabview, bkview;
// jquery用変数
var $tabview_dom, $bkview_dom;
// 指の本数用変数
var finger_length = 0;

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
	leap_soket.onopen = function(event) { console.log(event + "WebSocket connection open!"); };
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
		var str = JSON.stringify(obj, undefined, 2);
		
		// 現在開かれているタブの数を取得
		var num = gBrowser.tabContainer.childNodes.length;
		
		// 指の本数を取得
		if (typeof(obj.hands) != 'undefined' && obj.hands.length > 0) {
			for (var i in obj.pointables) {
				finger_length++;
			}
			//console.log(finger_length);
		}
		
		// タブビューを開く処理
		if (finger_length == 2 && sw_1 == 0 && sw_3 == 0) { tabviewOpen(num); }
		if (sw_1 == 1) { tabviewSelect(); }
		if (finger_length == 1 && sw_2 == 1) {	tabviewClose(); }
		
		// ブックマークビューを開く処理
		if (finger_length == 3 && sw_3 == 0 && sw_1 == 0) { bkviewOpen(); }
		if (sw_3 == 1 && sw_4 == 0) { bkviewSelect(); }
		if (finger_length == 1 && sw_4 == 1) {	bkviewClose(); }
		
		finger_length = 0;
	};	
}

// タブビュー表示用関数
function tabviewOpen(opt_num) {
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
		for (var i = 0; i < opt_num; ++i) {
			var r = [];
			r[i] = i+1;
    		Tab[i] = gBrowser.tabContainer.childNodes[i];
    		Tab_block[i] =	
    			'<div id="block" style="float:left;"><button id="tab_block" aria-label="タブ' + r[i] + '" value="' + r[i] +'" style="width : 200px;height : 400px; word-break:keep-all;">' + r[i] + '</button></div>'; 
			//console.log(Tab_block[i]);
			$tabview_dom.find("#tab_block_pos").append(Tab_block[i]);
		}
	}, true);
	
	//ループ制御
	sw_1 = 1;
}

// タブ選択用関数
function tabviewSelect() {
	$tabview_dom = $(tabview.contentDocument);
	// タブブロックが押されたか
	$tabview_dom.find("#tab_block_pos #tab_block").click(function () {
		//押されたタブブロックの番号のタブを開く
		gBrowser.selectedTab = gBrowser.tabContainer.childNodes[$(this).val() - 1];
		//console.log($(this).val());
		sw_2 = 1;
	});
}

// タブビュー消去用関数
function tabviewClose() {
	gBrowser.removeTab(gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1]);
	sw_1 = 0;
	sw_2 = 0;
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
			//押されたブックマークブロックのブックマークを開く
			Block.startBlock($(this).val());
		}
		sw_4 = 1;
	});
}

// ブックマークビュー消去用関数
function bkviewClose() {
	gBrowser.removeTab(gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-2]);
	sw_3 = 0;
	sw_4 = 0;
}