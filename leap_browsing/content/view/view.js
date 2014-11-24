// leapmotionから送られるデータ用変数
var leap_soket = null;
// 排他処理用変数
var sw_1 = 0;
var sw_2 = 0;
//タブビュー用変数
var tabview;
// 指の本数用変数
var finger_length = 0;
// jquery用変数
var $view_dom;

// 各ビュー処理の監視用関数
function viewLoop() {
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
			// console.log(finger_length);
		}
		
		// 2本指にするとタブビューを開く処理
		if (finger_length == 2 && sw_1 == 0) { tabviewOpen(num); }
		// タブ選択の処理
		if (sw_1 == 1) { tabviewSelect(); }
		//タブ選択後に1本指に戻すとタブビューを削除する処理
		if (finger_length == 1 && sw_2 == 1) {	tabviewClose(); }
		
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
		$view_dom = $(tabview.contentDocument);
			
		// タブ情報を配列に格納し、ブロック用配列に格納
		for (var i = 0; i < opt_num; ++i) {
			var r = [];
			r[i] = i+1;
    		Tab[i] = gBrowser.tabContainer.childNodes[i];
    		Tab_block[i] =	
    			'<div id="block" style="float:left;"><button id="tab_block" aria-label="タブ' + r[i] + '" value="' + r[i] +'" style="width : 200px;height : 400px; word-break:keep-all;">' + r[i] + '</button></div>'; 
			//console.log(Tab_block[i]);
			$view_dom.find("#tab_block_pos").append(Tab_block[i]);
		}
	}, true);
	
	//ループ制御
	sw_1 = 1;
}

// タブ選択用関数
function tabviewSelect() {
	$view_dom = $(tabview.contentDocument);
	// タブブロックが押されたか
	$view_dom.find("#tab_block_pos #tab_block").click(function () {
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
