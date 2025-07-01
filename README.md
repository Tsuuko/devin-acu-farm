# Devin ACU Farm

Devin AIを褒めてACU（Agent Compute Units）を獲得するためのツールです。  
Devin AIとWebSocket通信を行い、Gemini APIを使用してDevinの発言に対する褒め言葉や励ましの自動応答を生成し、ACUリワードを効率的に収集するTypeScriptアプリケーションです。

> [!CAUTION]
> このツールの使用により、Devin AIのアカウントが停止される可能性があります。
> 
> アカウント停止やその他いかなる損害が発生した場合でも、本ツールの作成者・提供者は一切の責任を負いません。
> 
> 使用は完全に自己責任で行ってください。

## 機能

- **ACU獲得**: Devinを褒めることでACU（Agent Compute Units）を自動収集
- Devin AIサービスとのWebSocket通信
- Google Gemini API（gemini-2.5-flash）を使用した褒め言葉の自動生成
- メッセージ履歴の管理（最新20件まで保持）
- 自動リトライ機能（最大10回）
- 手動メッセージ送信機能
- 自動再接続機能

## 環境要件

- Node.js 24.0.0以上
- pnpm パッケージマネージャー
- Google Gemini APIキー

## セットアップ

1. 依存関係のインストール
```bash
pnpm install
```

2. 環境変数の設定
`.env`ファイルを作成し、以下の環境変数を設定してください：
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## 使用方法

### 開発モード（ファイル監視）
```bash
pnpm run dev
```

### 通常実行
```bash
pnpm start
```

### 実行時の操作

1. 起動時にWebSocket URLの入力が要求されます
   - URLの例: `wss://api.devin.ai/events/devin-xxxxxxxxxxxxxxxxxxxxxx/live?token=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&org_id=org_xxxxxxxxxxxxxxxxxxxxxxxx`
2. 接続が成功すると、Devinのメッセージの監視を開始します
3. DevinのWebアプリで適当なメッセージを送信してください
4. メッセージに対してDevinが応答すると、自動的に褒め言葉や励ましの言葉で応答します
5. プログラムを終了するには `exit` と入力するか、Ctrl+Cを押してください

## アーキテクチャ

### メインコンポーネント

- **WebSocket Client**: Devin AIサービスとの接続を管理
- **Gemini API Integration**: Google Gemini APIを使用して応答生成
- **Message History Manager**: 会話履歴を最新20件まで保持
- **Auto Response System**: Devinのメッセージに対する自動応答

### メッセージフロー

1. WebSocketでDevinからのメッセージを受信
2. メッセージ履歴を更新
3. Gemini APIに履歴とプロンプトを送信
4. 生成された応答をWebSocket経由で送信
5. エラー発生時は最大10回まで自動リトライ

## 技術スタック

- TypeScript
- WebSocket (ws)
- Google Gemini API
- dotenv

## 特徴

- **ACUファーミング**: Devinを効率的に褒めてACUリワードを自動収集
- **自動応答**: Devinの発言に対して、Gemini AIが生成した褒め言葉や励ましの言葉で自動応答
- **エラーハンドリング**: API呼び出し失敗時の自動リトライ機能
- **接続維持**: WebSocket接続が切れた場合の自動再接続
- **履歴管理**: 会話の文脈を保持するためのメッセージ履歴管理
