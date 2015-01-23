// ページをブロック要素に変換する関数
var Block = function(opt_uri) {
  // 新規ページのインスタンス作成
  var newTab = gBrowser.getBrowserForTab(gBrowser.addTab(opt_uri));
  
  // 開いたタブにフォーカスを移す
  gBrowser.selectedTab = gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1];

  // Dom解析用関数
  var loopDom = function() {
    // ブロック要素のhtmlを格納する配列
    var block_html = [];
      
    // ページのhtmlをJqueryのDOM要素に変換し変数に格納
    var $dom = $(newTab.contentDocument);
    
    // 不要な要素を削除
    $dom.find("meta").remove();
    $dom.find("link").remove();
    $dom.find("style").remove();
    $dom.find("script").remove();
    $dom.find("ins").remove();
    $dom.find("hr").remove();
    $dom.find("table").unwrap();
    $dom.find("input").remove();

    // 全要素数を取得.
    var len = $dom.find("*").length;

    // 深さ用変数
    var deps = 0;
    // ログ出力用変数
    var str;
    // ブロックの内容用変数
    var text;

    for (var i = 0; i < len; i++){
      //console.log($dom.get(0).tagName);

      // リンク要素抽出
      if ($dom.get(0).tagName == "A") {
        if($dom.text() != "") {
          text = $dom.text().replace(/\"/g, 'だぶるくおーてーしょん');
          //console.log($dom.text())
          // alt属性がある場合
        } else if ($dom.children()[0]) {
          text = $dom.children()[0].alt;
  	      // alt属性が無い場合
  	    } else {
  	      text = "画像リンク";
  	    }
  	    if (len < 60) {
          block_html[i] = 
          '<div id = "block" style="float:left;"><button id="block_text" aria-label="' + text + 'リンク" style="width : 150px;height : 150px; word-break:keep-all;"><a href="' + $dom.get(0).href + '">' + text + '</ button></ a>';
          //console.log(block_html[i]);
        } else {
       	  block_html[i] = 
          '<div id = "block" style="float:left;"><button id="block_text" aria-label="' + text + 'リンク" style="width : 85px;height : 85px; word-break:keep-all;"><a href="' + $dom.get(0).href + '">' + text + '</ button></ a>';
          //console.log(block_html[i]);
        }
      }
        
      // テキスト要素抽出
      if (($dom.get(0).tagName == "P") || ($dom.get(0).tagName == "SPAN") || ($dom.get(0).tagName == "TH")) {
        if ($dom.text() != "") {
          text = $dom.text().replace(/\"/g, 'だぶるくおーてーしょん');
          if (len < 60) {
            block_html[i] = 
            '<div id = "block" style="float:left;"><button id="block_text" aria-label="' + text +'" style="width : 150px;height : 150px; word-break:keep-all;"><a href="text">' + text + '</ button></ a>';
            //console.log(opt_dom.firstChild.nodeValue);
          } else {
            block_html[i] = 
            '<div id = "block" style="float:left;"><button id="block_text" aria-label="' + text +'" style="width : 85px;height : 85px; word-break:keep-all;"><a href="text">' + text + '</ button></ a>';
            //console.log(opt_dom.firstChild.nodeValue);
          }
        }
      }
      
      // 題字要素抽出
      if (($dom.get(0).tagName == "H1") || ($dom.get(0).tagName == "H2") || ($dom.get(0).tagName == "H3") || ($dom.get(0).tagName == "H4")) {
        if ($dom.text() != "") {
          text = $dom.text().replace(/\"/g, 'だぶるくおーてーしょん');
          if (len < 60) {
            block_html[i] = 
            '<div id = "block" style="float:left;"><button id="block_text" aria-label="題字' + text +'" style="width : 150px;height : 150px; word-break:keep-all;"><a href="text">' + text + '</ button></ a>';
            //console.log(opt_dom.firstChild.nodeValue);
          } else {
            block_html[i] = 
            '<div id = "block" style="float:left;"><button id="block_text" aria-label="題字' + text +'" style="width : 85px;height : 85px; word-break:keep-all;"><a href="text">' + text + '</ button></ a>';
            //console.log(opt_dom.firstChild.nodeValue);
          }
        }
      }

      // 子孫が存在する場合
      if ($dom.children()[0]){
        // 階層インクリメント
        deps++;
        // カレントを更新して子孫に移動する
        $dom = $dom.children().eq(0);
        continue;
      }

      // 子孫がいないので兄弟を探索する
      if ($dom.next()[0]){
        $dom = $dom.next();
        continue;
      }

      // 子孫も兄弟もいないので親に戻って一つ進む
      $parent = $dom.parent();
      deps--;
 
      do{
        // 親の兄弟がいる場合はそちらへ
        if($parent.next().get(0)){
          $dom = $parent.next();
          break;

        // 兄弟がいない場合はさらに祖先へ
        }else{
          $parent = $parent.parent();
          deps--;
        }
      }while(deps);
    }
    // イベントリスナーを削除
    newTab.removeEventListener("DOMContentLoaded", loopDom, false);
        
    // ブロック化関数を呼ぶ
    createBlock(block_html);
  };
    
  // ページを読み込み終わるとloopDom関数を呼ぶ
  newTab.addEventListener("DOMContentLoaded", loopDom, false);
  
  // 要素ブロック化用関数
  var createBlock = function(opt_block_html) {      	
      // ブロック配置用のdiv要素でページを上書き
      newTab.contentDocument.body.innerHTML = "<div id='block_pos'> </div>";

      // 再度ページのhtmlをDOM要素として変数に格納
      var $block = $(newTab.contentDocument);

      // headにポインタに使うCSSを配置
      var pointer_css = '<style type="text/css">#pointer {width: 50px;height: 50px;-webkit-border-radius: 25px;-moz-border-radius: 25px;border-radius: 25px;background-color: #999;position: absolute;}</style>';
      $block.find("head").append(pointer_css);

      // ポインタ要素を配置
      $block.find("body").append('<div id="pointer"></div>');

      // スクロールに使用する要素とスクリプト配置
      //$block.find("body").append('<div id="scroll_down" onclick="window.scrollBy(0,20);"></div>');
      //$block.find("body").append('<div id="scroll_up" onclick="window.scrollBy(0,-20);"></div>');

      // ページにブロックを配置
      for (var i=0; i < opt_block_html.length; i++) {
        $block.find("#block_pos").append(opt_block_html[i]);
        //console.log(block_html[i]);
      }
  };
};