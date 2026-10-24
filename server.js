// npm install express cors dotenv @supabase/supabase-js が必要です
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());
app.use(cors());

// Supabaseクライアント（フロントから送られてきたトークンやサービスキーを管理）
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * ① 大学メール限定の新規登録API
 * POST /api/signup
 */
app.post('/api/signup', async (req, res) => {
  const { email, password, name, avatar } = req.body;

  // セキュリティ対策：大学メールドメイン（.ac.jp）の厳格なチェック
  if (!email || !email.endsWith('.ac.jp')) {
    return res.status(400).json({ error: '登録には大学発行のメールアドレス（.ac.jp）が必要です。' });
  }

  try {
    // Supabase Authへサインアップを要求（自動で確認メールが送信される）
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, avatar },
        emailRedirectTo: 'https://your-frontend-url.com/login' // フロント側のリダイレクト先
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ 
      message: '確認メールを送信しました。メール内のリンクから認証を完了してください。',
      user: data.user 
    });
  } catch (err) {
    return res.status(500).json({ error: 'サーバー内部のエラーが発生しました。' });
  }
});

/**
 * ② ユーザーデータの取得API（メール認証完了後、DBからデータを引く）
 * GET /api/profile/:id
 */
app.get('/api/profile/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'プロフィールが見つかりません。' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'データ取得に失敗しました。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});