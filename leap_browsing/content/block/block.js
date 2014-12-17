// ページをブロック要素に変換する関数
var Block = function(opt_uri) {
  // 新規ページのインスタンス作成
    var newTab = gBrowser.getBrowserForTab(gBrowser.addTab(opt_uri));

  // 開いたタブにフォーカスを移す
  gBrowser.selectedTab = gBrowser.tabContainer.childNodes[gBrowser.tabContainer.childNodes.length-1];

  // ページを読み込み終わると次の処理に移る
  newTab.addEventListener("load", function() {
    // ページのhtmlをJqueryのDOM要素に変換し変数に格納
    var $dom = $(newTab.contentDocument);

    // 不要な要素を削除
    //$dom.find("meta").remove();
    $dom.find("link").remove();

    // 出力用ノード配列
    var node = [];
    // ブロック要素のhtmlを格納する配列
    var block_html = [];

    // 全要素数を取得.
    var len = $dom.find("*").length;
    // 深さ用変数
    var deps = 0;
    // ログ出力用変数
    var str;

    // DOMループ処理
    for (var i = 0; i < len; i++){
      // コンソールに全要素を表示
      str = deps + "__" + $dom.get(0).tagName;
      node.push(str);
      //console.log(str);

      // 特定要素をブロック要素に変換し、配列に格納
      if ($dom.get(0).tagName == "P" || $dom.get(0).tagName == "A" || $dom.get(0).tagName == "H2" || $dom.get(0).tagName == "PRE" || $dom.get(0).tagName == "SPAN"){
        var temp_text = $dom.text().replace(/\"/g, 'だぶるくおーてーしょん');
        if ($dom.get(0).tagName == "A"){
          block_html[i] = 
          '<div id = "block" style="float:left;"><button id="block_text" aria-label="' + temp_text + '" style="width : 200px;height : 200px; word-break:keep-all;"><a href="' + $dom.get(0).href + '">' + temp_text + '</ button></ div>';
        } else {
          block_html[i] = '<div id = "block" style="float:left;"><button id="block_text" aria-label="' + temp_text +'" style="width : 200px;height : 200px; word-break:keep-all;">' + temp_text + '</button></div>';
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
    $block.find("body").append('<div id="scroll_down" onclick="window.scrollTo(0,1000);"></div>');
    
    // ページにブロックを配置
    for (var i=0; i < len; i++) {
      $block.find("#block_pos").append(block_html[i]);
      //console.log(block_html[i]);
    };
  }, true);
};