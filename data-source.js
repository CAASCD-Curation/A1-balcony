/* ════════════════════════════════════════════════════════
   data-source.js — 数据访问层
   当前：读取本地静态数据 data/balcony-data.js（由 scripts/build_data.py 生成）
   未来：接入 Supabase 时，仅需改写本文件的 load()，页面代码零改动。

   Supabase 表结构建议（与字段一一对应）：
     create table entries (
       id text primary key,            -- 分类编号，如 A-01
       category text,                  -- 分类字母 A/F/S/L
       category_name text,             -- 经典艺术档案…
       title text,
       original_title text,
       source text,
       year text,
       description text,
       dimension text,                 -- D1…D7
       dimension_name text,
       keywords text[],                -- 关键词数组
       image text                      -- 图片 URL，可空
     );

   接入示例：
     import { createClient } from '@supabase/supabase-js'
     const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
     async load() {
       const [{ data: entries }, { data: dimensions }, { data: categories }] =
         await Promise.all([
           supabase.from('entries').select('*').order('id'),
           supabase.from('dimensions').select('*').order('id'),
           supabase.from('categories').select('*').order('id'),
         ])
       return { entries, dimensions, categories }
     }
   ════════════════════════════════════════════════════════ */

const DataSource = {
  async load() {
    const raw = window.BALCONY_DATA;
    if (!raw || !Array.isArray(raw.entries)) {
      throw new Error('数据文件缺失：请先运行 scripts/build_data.py 生成 data/balcony-data.js');
    }
    return {
      entries: raw.entries,
      dimensions: raw.dimensions || [],
      categories: raw.categories || [],
    };
  },
};
