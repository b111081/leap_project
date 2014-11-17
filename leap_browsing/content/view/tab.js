// LeapControllerObjectを取得
var controller = new Leap.Controller({enableGestures: true});

// タブ情報を格納する配列
var Tab = [];
// ブロック配置用配列
var Tab_block = [];
// 排他処理用変数
var sw_1 = 0;
var sw_2 = 0;
// jquery用変数
var $dom;
//タブビュー用変数
var Tabview;

// Leap Motionによるフレーム処理
controller.loop(function(frame) {
	// 現在開かれているタブの数を取得
	var num = gBrowser.tabContainer.childNodes.length;

	// 関数を用いて認識している指の数を取得
	var finger_length = getFinger(frame);
	
	// 2本指にするとタブビューを開く処理
	if (finger_length == 2 && sw_1 == 0) {
		// タブビュー用の新規タブを開く
		Tabview = gBrowser.getBrowserForTab(gBrowser.addTab());
		
		// タブビューにフォーカスを移す
		gBrowser.selectedTab = gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1];
		
		// ページを読み込み終わると次の処理に移る
		Tabview.addEventListener("load", function() {
			// ブロック配置用のdiv要素でタブビューを上書き
			Tabview.contentDocument.body.innerHTML = "<div id='tab_block_pos'> </div>";
			
			// タブビューをJqueryのDOM要素に変換し変数に格納
			$dom = $(Tabview.contentDocument);
			
			// タブ情報を配列に格納し、ブロック用配列に格納
			for (var i = 0; i < num; ++i) {
				var r = [];
				r[i] = i+1;
    			Tab[i] = gBrowser.tabContainer.childNodes[i];
    			Tab_block[i] =	
    			'<div id="block" style="float:left;"><button id="tab_block" aria-label="タブ' + r[i] + '" value="' + r[i] +'" style="width : 200px;height : 400px; word-break:keep-all;">' + r[i] + '</button></div>'; 
				//console.log(Tab_block[i]);
				$dom.find("#tab_block_pos").append(Tab_block[i]);
			}
		}, true);
		
		//ループ制御
		sw_1 = 1;	
	}
	
	// タブの選択処理
	if (sw_1 == 1) { 
		$dom = $(Tabview.contentDocument);
		// タブブロックが押されたか
		$dom.find("#tab_block_pos #tab_block").click(function () {
			//押されたタブブロックの番号のタブを開く
			gBrowser.selectedTab = gBrowser.tabContainer.childNodes[$(this).val() - 1];
			//console.log($(this).val());
			sw_2 = 1;
		});
	}
	
	//タブ選択後に1本指に戻すとタブビューを削除する処理
	if (finger_length == 1 && sw_2 == 1) {
		gBrowser.removeTab(gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1]);
		sw_1 = 0;
		sw_2 = 0;
	}
	
});

// 認識している指の本数を取得する関数
function getFinger(opt_frame) {
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
		//console.log("Extended fingers: " + extendedFingers);
	} else {
		extendedFingers = 0;
	}

	return extendedFingers;
}

/*残骸
	if  (frame.pointable.isExtended() == 2 && sw == 0) {
			console.log(frame.pointable.isExtended());
			//var Tabview = gBrowser.getBrowserForTab(gBrowser.addTab("http://www.google.com/"));
			sw = 1;
			/*
			if (frame.fingers.length > 0) {
				//console.log(folderNode.childCount);
				gBrowser.selectedTab = tab[frame.fingers.length];
    		}
    		*/
	
	/*
	if(frame.hands.length == 2 && sw == 1) {
    	if(frame.fingers.length > 0) {
			gBrowser.selectedTab = gBrowser.addTab(bk[frame.fingers.length]);
		}
    	sw = 2;
	}
	
var bk = [];

var history = Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService);
var bookmarks = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);

var query = history.getNewQueryOptions();
query.setFolders([bookmarks.bookmarksMenuFolder], 1);

var result = history.executeQuery(query, history.getNewQueryOptions());
var folderNode = result.root;
folderNode.containerOpen = true;
  if(sw == 0) {
    for (var i = 0; i < folderNode.childCount; i++) {
      var childNode = folderNode.getChild(i);
      bk[i+1] = childNode.uri;
    }
     sw = 1;
  }
*/
