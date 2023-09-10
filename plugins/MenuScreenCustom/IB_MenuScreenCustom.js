// Copyright (c) 2020 ibane
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php

/*:
 * @target MZ
 * @plugindesc カスタムステータスウィンドウを追加するプラグインです。
 * 
 * @param CustomStatusImage
 * @text カスタム画像ファイル
 * @desc カスタムステータスウィンドウに表示する画像ファイルのパスを指定してください。
 * @type file
 * @dir img/pictures
 * @default default.png
 * 
 * @param CustomStatusText
 * @text カスタムテキスト
 * @desc カスタムステータスウィンドウに表示するテキストを指定してください。
 * @type multiline_string
 * @default ""
 *
 * @param ResizeImageFlag
 * @text 画像リサイズフラグ
 * @desc 画像をウィンドウの幅に応じて拡大・縮小するかどうかを制御するフラグです。true または false に設定してください。
 * @type boolean
 * @default true
 * 
 * @param ImageAlignment
 * @text 画像配置
 * @desc 画像の配置を選択してください。'left', 'center', 'right' のいずれかを指定します。
 * @type select
 * @option 左寄せ
 * @value left
 * @option 中央寄せ
 * @value center
 * @option 右寄せ
 * @value right
 * @default center
 * 
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
(() => {
	"use strict";
	const pluginName = "IB_MenuScreenCustom";
	

	const parameters = PluginManager.parameters(pluginName);
	const ResizeImageFlag = parameters.ResizeImageFlag === "true";
	const customStatusText = String(parameters.CustomStatusText || "");
	const imageAlignment = parameters.ImageAlignment || "center";

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

	// プラグインパラメータから画像ファイルのパスを受け取る
	Window_CustomStatus.prototype.setCustomImage = function (imagePath) {
		this._customImage = ImageManager.loadPicture(imagePath);
	};

	Window_CustomStatus.prototype = Object.create(Window_StatusBase.prototype);
	Window_CustomStatus.prototype.constructor = Window_CustomStatus;

	Window_CustomStatus.prototype.initialize = function (rect) {
		Window_StatusBase.prototype.initialize.call(this, rect);
		// カスタムな初期化処理を追加
		this._customImage = ImageManager.loadPicture(parameters.CustomStatusImage);
	};

	Window_CustomStatus.prototype.refresh = function () {
		this.contents.clear();
		// 画像を描画する
		this.drawCustomImage();
		// 他のステータス情報の描画などの処理を追加
		this.drawCustomText(); // カスタムテキストを描画
	};

	Window_CustomStatus.prototype.drawCustomImage = function () {
		const x = 0; // 画像を描画するX座標
		const y = 0; // 画像を描画するY座標
		const maxWidth = this.contents.width; // 最大幅をウィンドウの幅とします
		const maxHeight = this.contents.height; // 最大高さをウィンドウの高さとします

		// フラグが true の場合、画像のサイズに合わせて描画します
		if (ResizeImageFlag) {
			const imageWidth = this._customImage.width;
			const imageHeight = this._customImage.height;

			// 画像がウィンドウよりも小さい場合でも拡大して描画
			const ratioX = maxWidth / imageWidth;
			const ratioY = maxHeight / imageHeight;
			const ratio = Math.min(ratioX, ratioY);

			const drawWidth = imageWidth * ratio;
			const drawHeight = imageHeight * ratio;

			// 画像配置に応じて描画位置を調整
			const imageX = imageAlignment === "left" ? 0 : imageAlignment === "center" ? (maxWidth - drawWidth) / 2 : maxWidth - drawWidth;

			this.contents.blt(this._customImage, 0, 0, imageWidth, imageHeight, imageX, y, drawWidth, drawHeight);
		} else {
			// フラグが false の場合、そのまま表示
			// 画像配置に応じて描画位置を調整
			const imageX = imageAlignment === "left" ? 0 : imageAlignment === "center" ? (maxWidth - this._customImage.width) / 2 : maxWidth - this._customImage.width;

			this.contents.blt(this._customImage, 0, 0, this._customImage.width, this._customImage.height, imageX, y);
		}
		

	};

	// カスタムテキストを描画
	Window_CustomStatus.prototype.drawCustomText = function () {
		const text = customStatusText;
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
		this._statusWindow.deselect(); // キャンセルボタンで選択解除
		this._commandWindow.activate(); // コマンドウィンドウを再びアクティブにする
	};

	Scene_Menu.prototype.onFormationCancel = function () {
		// ステータス画面を閉じる際に通常のステータスウィンドウに差し替える
		this._statusWindow = new Window_CustomStatus(this.statusWindowRect());
		this._statusWindow.refresh();
		this.addWindow(this._statusWindow);
		this._statusWindow.deselect(); // キャンセルボタンで選択解除
		this._commandWindow.activate(); // コマンドウィンドウを再びアクティブにする
	};

})();
