// Copyright (c) 2020 ibane
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/*:
 * @target MZ
 * @plugindesc カスタムステータスウィンドウを追加するプラグインです。
 * 
 * @param ShowPageNumber
 * @text ページ番号表示
 * @desc 複数ページの用語の場合、用語辞典の下部にページ番号を表示します。
 * @default true
 * @type boolean
 * 
 * @param PageNumberAlignment
 * @text ページ番号
 * @type select
 * @option 左寄せ
 * @value left
 * @option 中央寄せ
 * @value center
 * @option 右寄せ
 * @value right
 * @default center
 * 
 * @param CustomStatusPages
 * @text カスタムステータスページ
 * @desc カスタムステータスウィンドウの各ページの設定を配列で指定してください。
 * @type struct<CustomStatusPage>[]
 * @default []
 * 
 * @help
 * このプラグインは、カスタムステータスウィンドウを追加し、
 * 画像ファイルのパスとカスタムテキストを表示します。
 * 
 * カスタム画像ファイルのパスは、プラグインパラメータから設定できます。
 * 画像ファイルはプロジェクト内の "img/pictures" フォルダに配置してください。
 * 
 * カスタムテキストを指定することもできます。テキストはプラグインパラメータから設定し、
 * 改行を含めた複数行のテキストを表示できます。
 * 
 * カスタムステータスウィンドウを有効にするには、
 * イベントコマンドやプラグインコマンドを使用して画面に表示してください。
 * ウィンドウを表示する際に、画像ファイルのパスとテキスト配置を指定できます。
 * 
 * imagePath には表示したい画像ファイルのパスを指定します。
 * 画像配置として 'left', 'center', 'right' のいずれかを指定できます。
 * カスタムステータスウィンドウは指定された画像とテキストを表示します。
 * 
 */
// カスタムステータスウィンドウの設定
/*~struct~CustomStatusPage:
 * @param imagePath
 * @text カスタム画像ファイル
 * @type file
 * @dir img/pictures
 * @default default.png
 * 
 * @param customText
 * @text カスタムテキスト
 * @type note
 * @default ""
 *
 * @param ResizeImageFlag
 * @text 画像リサイズフラグ
 * @type boolean
 * @default true
 * 
 * @param imageAlignment
 * @text 画像配置
 * @type select
 * @option 左寄せ
 * @value left
 * @option 中央寄せ
 * @value center
 * @option 右寄せ
 * @value right
 * @default center
 */
(() => {
    "use strict";
    const pluginName = "IB_MaltiMenuScreenCustom";

    const parameters = PluginManager.parameters(pluginName);
    const ShowPageNumber = parameters.ShowPageNumber === "true";
    const PageNumberAlignment = String(parameters.PageNumberAlignment || "");

    Scene_Menu.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createCommandWindow();
        this.createGoldWindow();
        this.createStatusWindow();
    };

    // ステータスウィンドウを差し替えるための新しいウィンドウクラス
    function Window_CustomStatus() {
        this.initialize(...arguments);
    }

    Window_CustomStatus.prototype = Object.create(Window_Base.prototype);
    Window_CustomStatus.prototype.constructor = Window_CustomStatus;

    Window_CustomStatus.prototype.initialize = function (rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._customPages = JSON.parse(parameters.CustomStatusPages); // カスタムページの設定を取得
        this._maxPages = this._customPages.length;
        this._itemData = null;
        this._pageIndex = 0;
        this.drawCustomPage();
        //事前読み込み
        Window_StatusBase.prototype.loadFaceImages();
    };



    Window_CustomStatus.prototype.refresh = function (item, index) {
        this.contents.clear();
        this._listIndex = 0;
        this._itemData = item;
        this._enemy = null;
        this._maxPages = this._customPages.length;
        this.drawItem(0, true);
        this.drawCustomPage(this._customPages); // カスタムページを描画
    };

    // カスタムページの描画
    Window_CustomStatus.prototype.drawCustomPage = async function () {
        const pageIndex = this._pageIndex; // 現在のページ番号
        if (pageIndex < this._customPages.length) {
            const customPage = JSON.parse(this._customPages[pageIndex]);
            const imagePath = customPage.imagePath; // 画像パス
            const customText = customPage.customText; // カスタムテキスト
            const imageAlignment = customPage.imageAlignment; // テキスト配置
            const resizeImageFlag = customPage.ResizeImageFlag === "true";

            // 画像を読み込み完了するまで待つ
            const customImage = await this.loadImage(imagePath);

            // 画像を描画
            this.drawCustomImage(imagePath, imageAlignment, resizeImageFlag);
            // テキストを描画
            this.drawCustomText(customText);
            // ページ番号を描画
            this.drawPageNumber();
        }
    };

    Window_CustomStatus.prototype.drawCustomImage = function (imagePath, imageAlignment, ResizeImageFlag) {
        const customImage = ImageManager.loadPicture(imagePath);
        const x = 0; // 画像を描画するX座標
        const y = 0; // 画像を描画するY座標
        const maxWidth = this.contents.width; // 最大幅をウィンドウの幅とします
        const maxHeight = this.contents.height; // 最大高さをウィンドウの高さとします
        // フラグが true の場合、画像のサイズに合わせて描画します
        if (ResizeImageFlag) {
            const imageWidth = customImage.width;
            const imageHeight = customImage.height;

            // 画像がウィンドウよりも小さい場合でも拡大して描画
            const ratioX = maxWidth / imageWidth;
            const ratioY = maxHeight / imageHeight;
            const ratio = Math.min(ratioX, ratioY);

            const drawWidth = imageWidth * ratio;
            const drawHeight = imageHeight * ratio;

            // 画像配置に応じて描画位置を調整
            const imageX = imageAlignment === "left" ? 0 : imageAlignment === "center" ? (maxWidth - drawWidth) / 2 : maxWidth - drawWidth;

            this.contents.blt(customImage, 0, 0, imageWidth, imageHeight, imageX, y, drawWidth, drawHeight);
        } else {
            // フラグが false の場合、そのまま表示
            // 画像配置に応じて描画位置を調整
            const imageX = imageAlignment === "left" ? 0 : imageAlignment === "center" ? (maxWidth - customImage.width) / 2 : maxWidth - customImage.width;

            this.contents.blt(customImage, 0, 0, customImage.width, customImage.height, imageX, y);
        }


    };

    // 画像を非同期で読み込む関数
    Window_CustomStatus.prototype.loadImage = function (imagePath) {
        return new Promise((resolve) => {
            const customImage = ImageManager.loadPicture(imagePath);
            customImage.addLoadListener(() => {
                resolve(customImage);
            });
        });
    };

    // カスタムテキストを描画
    Window_CustomStatus.prototype.drawCustomText = function (customText) {
        const text = customText;
        const x = 0; // テキストを描画するX座標
        const y = 0; // テキストを描画するY座標
        const maxWidth = this.contents.width; // 最大幅をウィンドウの幅とします

        this.drawTextEx(text, x, y, maxWidth);
    };

    Scene_Menu.prototype.createStatusWindow = function () {
        const rect = this.statusWindowRect();
        this._statusWindow = new Window_CustomStatus(rect); // カスタムステータスウィンドウを作成
        this.addWindow(this._statusWindow);
    };


    /// マルチページ
    // カーソルを右に移動する
    Window_CustomStatus.prototype.cursorRight = function (wrap) {
        if (this._maxPages === 1) return;
        if (this.canMoveRight()) {
            this.drawItem(this._pageIndex + 1);
        } else if (wrap) {
            this.drawItem(0);
        }
    };

    // カーソルを左に移動する
    Window_CustomStatus.prototype.cursorLeft = function (wrap) {
        if (this._maxPages === 1) return;
        if (this.canMoveLeft()) {
            this.drawItem(this._pageIndex - 1);
        } else if (wrap) {
            this.drawItem(this._maxPages - 1);
        }
    };

    // 左にカーソルを移動できるかどうかを判定する
    Window_CustomStatus.prototype.canMoveLeft = function () {
        return this._pageIndex > 0;
    };

    // 右にカーソルを移動できるかどうかを判定する
    Window_CustomStatus.prototype.canMoveRight = function () {
        return this._pageIndex < this._maxPages - 1;
    };

    // 右キーを押したときの処理
    Window_CustomStatus.prototype.processCursorRight = function () {
        if (this.isOpenAndActive()) {
            this.cursorRight(true);
        }
    };

    // 左キーを押したときの処理
    Window_CustomStatus.prototype.processCursorLeft = function () {
        if (this.isOpenAndActive()) {
            this.cursorLeft(true);
        }
    };

    // キーボード入力のハンドラを設定
    // Window_CustomStatus.prototype.setHandlers = function () {
    //     Window_Selectable.prototype.setHandlers.call(this);
    //     this.setHandler("right", this.processCursorRight.bind(this)); // 右キーを処理
    //     this.setHandler("left", this.processCursorLeft.bind(this)); // 左キーを処理
    // };


    // ページの表示内容を描画する
    Window_CustomStatus.prototype.drawItem = function (pageIndex, noSound) {
        this.contents.clear();
        this._pageIndex = pageIndex;
        this.updateArrows();
        this.drawCustomPage(pageIndex);
        if (!noSound) SoundManager.playCursor();
    };

    // 表示内容をクリアする
    Window_CustomStatus.prototype.clearItem = function () {
        this._listIndex = -1;
        this.contents.clear();
        this.hiddenArrows();
    };

    // カーソル位置に応じて矢印の表示を更新する
    Window_CustomStatus.prototype.updateArrows = function () {
        this.downArrowVisible = this.canMoveLeft();
        this.upArrowVisible = this.canMoveRight();
    };

    // 矢印を非表示にする
    Window_CustomStatus.prototype.hiddenArrows = function () {
        this.downArrowVisible = false;
        this.upArrowVisible = false;
    };

    // ページ番号を描画する
    Window_CustomStatus.prototype.drawPageNumber = function () {
        if (!this.isNeedPageNumber()) {
            return;
        }
        var frame = this.padding * 2;
        this.drawText(this.getPageNumberText(), 0, this.height - frame - 30, this.width - frame, PageNumberAlignment);
    };

    // ページ番号のテキストを取得する
    Window_CustomStatus.prototype.getPageNumberText = function () {
        return (this._pageIndex + 1) + '/' + this._maxPages;
    };

    // ページ番号を表示する必要があるかどうかを判定する
    Window_CustomStatus.prototype.isNeedPageNumber = function () {
        return ShowPageNumber && this._maxPages > 1;
    };

    // ウィンドウを更新する
    Window_CustomStatus.prototype.update = function () {
        Window_Base.prototype.update.call(this);
        this.processTouch();
    };

    // タッチ入力を処理する
    Window_CustomStatus.prototype.processTouch = function () {
        if (this._listIndex < 0 || !TouchInput.isTriggered()) {
            return;
        }
        var touchPos = new Point(TouchInput.x, TouchInput.y);
        var localPos = this.worldTransform.applyInverse(touchPos);
        var x = localPos.x;
        var y = localPos.y;
        if (y >= 0 && y <= this.height) {
            if (x >= 0 && x < this.width / 2) this.cursorLeft(true);
            if (x >= this.width / 2 && x < this.width) this.cursorRight(true);
        }
    };

    // 矢印の表示を更新する
    Window_CustomStatus.prototype._refreshArrows = function () {
        Window.prototype._refreshArrows.call(this);
        var w = this._width;
        var h = this._height;
        var p = 24;
        var q = p / 2;

        this._downArrowSprite.rotation = 90 * Math.PI / 180;
        this._downArrowSprite.move(q, h / 2);
        this._upArrowSprite.rotation = 90 * Math.PI / 180;
        this._upArrowSprite.move(w - q, h / 2);
    };


    // ステータス画面が閉じられる際に通常のステータス画面に戻す
    Scene_Menu.prototype.popScene = function () {
        Scene_MenuBase.prototype.popScene.call(this);
        if (SceneManager.isNextScene(Scene_Menu)) {
            // ステータスウィンドウを通常のウィンドウに差し替える
            this._statusWindow = new Window_MenuStatus(this.statusWindowRect());
            this.addWindow(this._statusWindow);
        }
    };

    // ステータスボタンが押された際の処理
    Scene_Menu.prototype.commandPersonal = function () {
        // ステータスウィンドウを通常のウィンドウに差し替える
        this._statusWindow = new Window_MenuStatus(this.statusWindowRect());
        this.addWindow(this._statusWindow);

        // ステータス画面に切り替える
        this._statusWindow.setFormationMode(false);
        this._statusWindow.selectLast();
        this._statusWindow.activate();
        this._statusWindow.setHandler("ok", this.onPersonalOk.bind(this));
        this._statusWindow.setHandler("cancel", this.onPersonalCancel.bind(this));
    };

    Scene_Menu.prototype.commandFormation = function () {
        // ステータスウィンドウを通常のウィンドウに差し替える
        this._statusWindow = new Window_MenuStatus(this.statusWindowRect());
        this.addWindow(this._statusWindow);

        this._statusWindow.setFormationMode(true);
        this._statusWindow.selectLast();
        this._statusWindow.activate();
        this._statusWindow.setHandler("ok", this.onFormationOk.bind(this));
        this._statusWindow.setHandler("cancel", this.onFormationCancel.bind(this));
    };

    // キャンセルボタンが押された際の処理
    Scene_Menu.prototype.onPersonalCancel = function () {
        // ステータス画面を閉じる際に通常のステータスウィンドウに差し替える
        this._statusWindow = new Window_CustomStatus(this.statusWindowRect());
        this._statusWindow.refresh();
        this.addWindow(this._statusWindow);
        // this._statusWindow.deselect(); // キャンセルボタンで選択解除
        this._commandWindow.activate(); // コマンドウィンドウを再びアクティブにする
    };

    Scene_Menu.prototype.onFormationCancel = function () {
        // ステータス画面を閉じる際に通常のステータスウィンドウに差し替える
        this._statusWindow = new Window_CustomStatus(this.statusWindowRect());
        this._statusWindow.refresh();
        this.addWindow(this._statusWindow);
        // this._statusWindow.deselect(); // キャンセルボタンで選択解除
        this._commandWindow.activate(); // コマンドウィンドウを再びアクティブにする
    };

})();
