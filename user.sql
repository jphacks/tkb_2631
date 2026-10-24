-- ① プロフィールテーブルの作成
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  university text default '東京大学',
  avatar int default 0,
  points int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS（セキュリティ）の有効化
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

-- ② ユーザー登録時に自動で profiles に行を追加する関数（メール認証完了等のトリガー用）
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, avatar, points)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', '名無しの農家'),
    coalesce((new.raw_user_meta_data->>'avatar')::int, 0),
    0
  );
  return new;
end;
$$;

-- ③ Authにユーザーが作られたら発火するトリガー
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();