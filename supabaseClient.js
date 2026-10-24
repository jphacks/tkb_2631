// createClient: 接続クライアントを作るための機能
import { createClient } from '@supabase/supabase-js';

// 環境変数または直接設定するURLとAPIキー(プログラムの中で秘密にしておきたい情報を.envファイルに書いておく)
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

// 設定したURLとキーを使ってクライアントオブジェクトを作成する
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);