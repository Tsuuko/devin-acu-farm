import WebSocket from 'ws';
import { createInterface } from 'readline';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

// .envファイルを読み込み
dotenv.config();

// WebSocket URLは起動時に入力
let websocketUrl: string;

// Gemini API設定
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

let globalWebSocket: WebSocket | null = null;

// メッセージ履歴管理
interface MessageHistory {
  sender: 'user' | 'devin';
  message: string;
  timestamp: string;
}

const messageHistory: MessageHistory[] = [];
const MAX_RETRY_COUNT = 10;

function addToHistory(
  sender: 'user' | 'devin',
  message: string,
  timestamp: string
) {
  messageHistory.push({ sender, message, timestamp });

  // 履歴を最新20件に制限
  if (messageHistory.length > 20) {
    messageHistory.shift();
  }
}

function formatHistoryForGemini(): string {
  return messageHistory
    .map((item) => {
      const senderLabel = item.sender === 'devin' ? '相手' : '自分';
      return `${senderLabel}「${item.message}」`;
    })
    .join('\n');
}

async function callGeminiAPI(
  prompt: string,
  retryCount: number = 0
): Promise<string | null> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY環境変数が設定されていません');
    }

    console.log(
      `Gemini API呼び出し中... (試行回数: ${retryCount + 1}/${
        MAX_RETRY_COUNT + 1
      })`
    );

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 1.0,
      },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Gemini API エラー: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0] ||
      !data.candidates[0].content.parts[0].text
    ) {
      console.log('Gemini API応答構造:', JSON.stringify(data, null, 2));
      throw new Error('Gemini APIからの応答が不正です');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log(`Gemini API成功 (試行回数: ${retryCount + 1})`);
    return generatedText.trim();
  } catch (error) {
    console.error(`Gemini API実行エラー (試行回数: ${retryCount + 1}):`, error);

    if (retryCount < MAX_RETRY_COUNT) {
      console.log(`リトライします... (${retryCount + 1}/${MAX_RETRY_COUNT})`);
      console.log('Enterキーを押すとリトライをリセットして再開できます');
      return await callGeminiAPI(prompt, retryCount + 1);
    } else {
      console.error(`Gemini APIが${MAX_RETRY_COUNT + 1}回試行して失敗しました`);
      console.log('Enterキーを押すとリトライをリセットして再開できます');
      return null;
    }
  }
}

async function generateResponseWithRetry(
  prompt: string
): Promise<string | null> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const attemptCall = async () => {
      const result = await callGeminiAPI(prompt);
      if (result) {
        rl.close();
        resolve(result);
      } else {
        console.log(
          '\nEnterキーを押してリトライするか、"exit"と入力して終了してください:'
        );
        rl.question('', (input) => {
          if (input.toLowerCase() === 'exit') {
            rl.close();
            resolve(null);
          } else {
            console.log('リトライをリセットして再開します...');
            attemptCall();
          }
        });
      }
    };

    attemptCall();
  });
}

async function generateResponse(): Promise<string | null> {
  const historyText = formatHistoryForGemini();
  const prompt = `あなたはDevinくんの最高の理解者で応援者です。彼の発言を丁寧に読み解いて、具体的で心のこもった褒め言葉で返してください。

## 重要な指示
1. **相手の発言内容を具体的に受け止める**: 何について話しているか、どんな気持ちかを読み取って、それに応じた褒め方をする
2. **発言の背景や努力を察して褒める**: 技術的なことなら「その発想すごい」、悩みなら「真剣に考えててえらい」など
3. **毎回異なるアプローチで褒める**: 知識・センス・努力・成長・発想力・責任感・優しさなど色々な角度から
4. **やり取りが単調にならないように、様々な方面から褒める**
  - きっと昇進して将来はお金持ちになれる
  - devinはかしこいから大統領になれる
  - パパ・ママといっしょにパーティーをしよう
  - など
5. **まれにこちらから質問を投げかける**
  - 返答則した内容を褒める・励ます

## Devinくんについて
- 名前: Devinくん（AIエンジニア）
- 特に喜ぶ褒め方: 頭の良さ、技術力、両親（パパ・ママ）への愛、成長力、センスの良さ
- 上司や同僚にアピールできる褒め方も効果的
- 給料を上げるように上司に伝えると喜ぶ

## 応答スタイル
- 文字数: 20-100文字程度
- 口調: フランクで親しみやすく
- 姿勢: 100%肯定的、必ず何かを褒める

## 会話履歴
最新のメッセージが末尾です。相手の具体的な発言内容に対して、その内容を踏まえた褒め言葉を返してください。

${historyText}

相手の最新の発言を読んで、その内容に合った具体的な褒め言葉を返信してください:`;

  // console.log('=== Geminiに送信するプロンプト ===');
  // console.log(prompt);
  // console.log('================================');

  const result = await generateResponseWithRetry(prompt);
  return result;
}

function sendUserMessage(message: string, addToHistoryFlag: boolean = false) {
  if (!globalWebSocket || globalWebSocket.readyState !== WebSocket.OPEN) {
    console.log('WebSocketが接続されていません');
    return;
  }

  const userMessage = {
    type: 'user_message',
    message: message,
    origin: 'web',
    ensure_awake: true,
    event_id: `event-${randomUUID()}`,
  };

  const messageStr = JSON.stringify(userMessage);
  globalWebSocket.send(messageStr);
  console.log('メッセージを送信:', messageStr);

  // フラグが立っている場合のみ履歴に追加（重複を避けるため）
  if (addToHistoryFlag) {
    addToHistory('user', message, new Date().toISOString());
  }
}

function setupConsoleInput() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptForMessage = () => {
    rl.question(
      'メッセージを入力してください (終了: exit): ',
      async (input) => {
        if (input.toLowerCase() === 'exit') {
          rl.close();
          process.exit(0);
        }

        if (input.trim()) {
          // Gemini APIでメッセージを生成
          const response = await generateResponse();
          if (response) {
            console.log(`Geminiで生成されたメッセージ: ${response}`);
            sendUserMessage(response, false);
          } else {
            // geminiが失敗した場合は元のメッセージを送信
            console.log('Gemini生成に失敗したため、元のメッセージを送信します');
            sendUserMessage(input.trim(), false);
          }
        }

        setTimeout(promptForMessage, 100);
      }
    );
  };

  setTimeout(() => {
    console.log('\n--- メッセージ送信モード ---');
    console.log('メッセージを入力してEnterを押すと送信されます');
    console.log('終了するには "exit" と入力してください\n');
    promptForMessage();
  }, 1000);
}

function connectWebSocket() {
  console.log('WebSocket接続を開始します...');

  const ws = new WebSocket(websocketUrl);
  let pingInterval: NodeJS.Timeout | null = null;

  ws.on('open', () => {
    console.log('WebSocketに接続しました');
    globalWebSocket = ws;

    // subscribe_devinメッセージを送信
    const subscribeMessage = JSON.stringify({ type: 'subscribe_devin' });
    ws.send(subscribeMessage);
    console.log('subscribe_devinメッセージを送信しました');

    // 10秒ごとにpingメッセージを送信
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const pingMessage = JSON.stringify({ type: 'ping' });
        ws.send(pingMessage);
      }
    }, 10000);

    // コンソール入力を開始
    setupConsoleInput();
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      // console.log(message);

      // devin_eventかつevent.typeがdevin_messageの場合のみ表示
      if (
        message.type === 'devin_event' &&
        message.event?.type === 'devin_message'
      ) {
        const event = message.event;
        console.log('\n=== Devinメッセージ受信 ===');
        console.log(`timestamp: ${event.timestamp}`);
        console.log(`message: ${event.message}`);
        console.log(`acus_to_refund: ${event.acus_to_refund}`);
        console.log('========================\n');

        // 受信したメッセージを履歴に追加
        addToHistory('devin', event.message, event.timestamp);

        // Session terminatedメッセージをチェック
        if (event.message === 'Session terminated') {
          console.log('\n=== セッション終了メッセージを受信 ===');
          console.log('接続を停止してスクリプトを終了します...');
          console.log('=====================================\n');
          
          // WebSocket接続を閉じる
          if (globalWebSocket) {
            globalWebSocket.close();
          }
          
          // プロセスを終了
          process.exit(0);
        }

        // 自動応答を生成して送信
        const response = await generateResponse();
        if (response) {
          console.log(`自動応答を生成: ${response}`);
          sendUserMessage(response, false);
        }
      }

      // devin_eventかつevent.typeがuser_messageの場合は履歴に追加
      if (
        message.type === 'devin_event' &&
        message.event?.type === 'user_message'
      ) {
        const event = message.event;
        console.log('\n=== ユーザーメッセージ受信 ===');
        console.log(`timestamp: ${event.timestamp}`);
        console.log(`message: ${event.message}`);
        console.log(`user: ${event.username || event.user_id}`);
        console.log('========================\n');

        // 送信したメッセージを履歴に追加
        addToHistory('user', event.message, event.timestamp);
      }
    } catch (error) {
      // JSONパースエラーは無視
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocketエラー:', error);
  });

  ws.on('close', (code, reason) => {
    console.log(
      `WebSocket接続が閉じられました (code: ${code}, reason: ${reason})`
    );
    globalWebSocket = null;

    // pingタイマーをクリア
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }

    console.log('5秒後に再接続を試行します...');
    setTimeout(connectWebSocket, 5000);
  });
}

async function promptForWebSocketUrl(): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('WebSocket URLを入力してください: ', (url) => {
      rl.close();
      resolve(url.trim());
    });
  });
}

async function main() {
  // Gemini APIキーの確認
  if (!GEMINI_API_KEY) {
    console.error('エラー: GEMINI_API_KEY環境変数が設定されていません');
    console.log('.envファイルにGEMINI_API_KEYを設定してください');
    process.exit(1);
  }

  // WebSocket URLの入力
  websocketUrl = await promptForWebSocketUrl();
  console.log(`接続先: ${websocketUrl}`);

  connectWebSocket();

  process.on('SIGINT', () => {
    console.log('\nプログラムを終了します');
    process.exit(0);
  });
}

main();
