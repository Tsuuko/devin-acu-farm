# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要
このプロジェクトは「Devin ACU Farm」で、Devin AIを褒めてACU（Agent Compute Units）を獲得するためのツールです。Devin AIとWebSocket通信を行い、Gemini APIを使用してDevinの発言に対する褒め言葉や励ましの自動応答を生成し、ACUリワードを効率的に収集します。

## 免責事項
このツールの使用により、Devin AIのアカウントが停止される可能性があります。アカウント停止やその他いかなる損害が発生した場合でも、本ツールの作成者・提供者は一切の責任を負いません。使用は完全に自己責任で行ってください。

## 開発コマンド

### 基本的な実行コマンド
- `pnpm start` - TypeScriptファイルを直接実行
- `pnpm run dev` - ファイル変更を監視しながら実行

### 環境要件
- Node.js 24.0.0以上
- pnpm パッケージマネージャー

## 環境設定
プロジェクト実行前に以下の環境変数を`.env`ファイルに設定する必要があります：
- `GEMINI_API_KEY` - Google Gemini APIキー

## アーキテクチャ

### メインコンポーネント
- **WebSocket Client** - Devin AIサービスとの接続を管理
- **Gemini API Integration** - Google Gemini APIを使用して応答生成
- **Message History Manager** - 会話履歴を最新20件まで保持
- **Auto Response System** - Devinのメッセージに対する自動応答

### メッセージフロー
1. WebSocketでDevinからのメッセージを受信
2. メッセージ履歴を更新
3. Gemini APIに履歴とプロンプトを送信
4. 生成された応答をWebSocket経由で送信
5. エラー発生時は最大10回まで自動リトライ

### 主要な技術スタック
- TypeScript
- WebSocket (ws)
- Google Gemini API
- dotenv (環境変数管理)

### 実行時の動作
- 起動時にWebSocket URLの入力を要求（例: `wss://api.devin.ai/events/devin-xxxxxxxxxxxxxxxxxxxxxx/live?token=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&org_id=org_xxxxxxxxxxxxxxxxxxxxxxxx`）
- 接続後は自動的にDevinメッセージに応答
- 手動でのメッセージ送信も可能
- 接続が切れた場合は5秒後に自動再接続