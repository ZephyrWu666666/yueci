// 精简版常用粤语字典（约 500 字，覆盖常见粤语歌词用字）
// 格式: { "字": ["粤拼1", "粤拼2"] }，第一个为最常用读音

let dictCache: Record<string, string[]> | null = null;

// 简体→繁体常用映射（用于字典查询回退）
const SIMPLIFIED_TO_TRADITIONAL: Record<string, string> = {
  "爱": "愛", "东": "東", "车": "車", "长": "長", "来": "來",
  "时": "時", "会": "會", "过": "過", "对": "對", "说": "說",
  "开": "開", "见": "見", "现": "現", "点": "點", "无": "無",
  "间": "間", "关": "關", "还": "還", "发": "發", "经": "經",
  "样": "樣", "实": "實", "进": "進", "问": "問", "从": "從",
  "动": "動", "体": "體", "头": "頭", "将": "將", "应": "應",
  "听": "聽", "让": "讓", "认": "認", "请": "請", "买": "買",
  "变": "變", "飞": "飛", "风": "風", "电": "電", "梦": "夢",
  "书": "書", "画": "畫", "话": "話", "词": "詞", "诗": "詩",
  "乐": "樂", "欢": "歡", "写": "寫", "读": "讀", "学": "學",
  "觉": "覺", "记": "記", "该": "該", "愿": "願", "离": "離",
  "终": "終", "旧": "舊", "岁": "歲", "亲": "親", "独": "獨",
  "双": "雙", "满": "滿", "错": "錯", "难": "難", "远": "遠",
  "宽": "寬", "轻": "輕", "软": "軟", "热": "熱", "湿": "濕",
  "浊": "濁", "咸": "鹹", "树": "樹", "鸟": "鳥", "鱼": "魚",
  "虫": "蟲", "马": "馬", "猪": "豬", "猫": "貓", "鸡": "雞",
  "鸭": "鴨", "龙": "龍", "凤": "鳳", "云": "雲", "雾": "霧",
  "红": "紅", "蓝": "藍", "绿": "綠", "黄": "黃", "银": "銀",
  "桥": "橋", "门": "門", "笔": "筆", "纸": "紙", "响": "響",
  "视": "視", "图": "圖", "剧": "劇", "戏": "戲", "叶": "葉",
  "种": "種", "面": "麵", "虾": "蝦", "铁": "鐵", "钢": "鋼",
  "铜": "銅", "紫": "紫",
  "单": "單", "担": "擔", "当": "當", "档": "檔", "挡": "擋",
  "弹": "彈", "诞": "誕", "胆": "膽",
  "邓": "鄧", "灯": "燈", "敌": "敵", "递": "遞",
  "垫": "墊", "淀": "澱", "钓": "釣",
  "调": "調", "叠": "疊", "钉": "釘", "顶": "頂", "订": "訂",
  "丢": "丟", "冻": "凍",
  "洞": "洞", "斗": "鬥", "豆": "豆",
  "肚": "肚", "度": "度", "端": "端", "断": "斷",
  "段": "段", "堆": "堆", "队": "隊", "吨": "噸",
  "顿": "頓", "盾": "盾", "夺": "奪", "朵": "朵",
  "躲": "躲",
};

/**
 * 加载粤拼字典（带缓存）
 * 支持服务端和客户端两种加载方式
 */
async function loadDict(): Promise<Record<string, string[]>> {
  if (dictCache) return dictCache;

  // 服务端环境：直接读取文件
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const dictPath = path.join(process.cwd(), 'public', 'data', 'jyutping-dict.json');
      if (fs.existsSync(dictPath)) {
        const content = fs.readFileSync(dictPath, 'utf-8');
        dictCache = JSON.parse(content);
        return dictCache!;
      }
    } catch {
      // 如果读取失败，使用内置精简字典
    }
  } else {
    // 客户端环境：通过 fetch 加载
    try {
      const res = await fetch('/data/jyutping-dict.json');
      if (res.ok) {
        dictCache = await res.json();
        return dictCache!;
      }
    } catch {
      // 如果 fetch 失败，使用内置精简字典
    }
  }

  dictCache = COMMON_CHARS_DICT;
  return dictCache;
}

// 多音字首选读音（按常见用法）
const PREFERRED_READINGS: Record<string, string> = {
  "單": "daan1",  // 孤單、簡單
  "說": "syut3",  // 說話
  "會": "wui5",   // 會議
  "還": "waan4",  // 還有
  "發": "faat3",  // 發現
  "見": "gin3",   // 看見
  "時": "si4",    // 時間
  "間": "gaan1",  // 中間
  "來": "loi4",   // 來到
  "過": "gwo3",   // 經過
  "開": "hoi1",   // 打開
  "對": "deoi3",  // 對不起
  "樣": "joeng6",  // 一樣
  "實": "sat6",   // 真實
  "進": "zeon3",  // 進入
  "問": "man6",   // 問題
  "從": "cung4",  // 從來
  "動": "dung6",  // 運動
  "頭": "tau4",   // 頭部
  "將": "zoeng1",  // 將來
  "聽": "teng1",  // 聽到
  "讓": "joeng6",  // 讓步
  "買": "maai5",  // 買賣
  "飛": "fei1",   // 飛行
  "風": "fung1",  // 風景
  "電": "din6",   // 電話
  "夢": "mung6",  // 夢想
  "書": "syu1",   // 書本
  "話": "waa6",   // 說話
  "詞": "ci4",    // 歌詞
  "詩": "si1",    // 詩歌
  "樂": "lok6",   // 快樂
  "讀": "duk6",   // 閱讀
  "學": "hok6",   // 學習
  "記": "gei3",   // 記得
  "該": "goi1",   // 應該
  "願": "jyun6",  // 願意
  "離": "lei4",   // 離開
  "終": "zung1",  // 終於
  "舊": "gau6",   // 新舊
  "歲": "seoi3",  // 歲月
  "親": "can1",   // 親人
  "獨": "duk6",   // 獨自
  "雙": "soeng1",  // 雙方
  "滿": "mun5",   // 滿意
  "錯": "co3",    // 錯誤
  "難": "naan4",  // 困難
  "遠": "jyun5",  // 遠方
  "輕": "heng1",  // 輕鬆
  "熱": "jit6",   // 熱情
  "濕": "sap1",   // 潮濕
  "樹": "syu6",   // 樹木
  "鳥": "niu5",   // 小鳥
  "魚": "jyu4",   // 魚類
  "馬": "maa5",   // 馬匹
  "貓": "maau1",  // 貓咪
  "雞": "gai1",   // 雞肉
  "龍": "lung4",  // 龍鳳
  "雲": "wan4",   // 雲朵
  "霧": "mou6",   // 霧氣
  "紅": "hung4",  // 紅色
  "藍": "laam4",  // 藍色
  "綠": "luk6",   // 綠色
  "黃": "wong4",  // 黃色
  "銀": "ngan4",  // 銀色
  "橋": "kiu4",   // 橋樑
  "門": "mun4",   // 門口
  "筆": "bat1",   // 筆記
  "紙": "zi2",    // 紙張
  "響": "hoeng2",  // 響聲
  "圖": "tou4",   // 圖片
  "劇": "kek6",   // 戲劇
  "葉": "jip6",   // 葉子
  "麵": "min6",   // 麵條
  "蝦": "haa1",   // 蝦子
  "鐵": "tit3",   // 鐵路
  "銅": "tung4",  // 銅器
};

/**
 * 查询单个汉字的粤拼（返回首选读音）
 */
export async function lookupJyutping(char: string): Promise<string[]> {
  const dict = await loadDict();

  // 直接查找
  if (dict[char]) {
    // 如果有首选读音，优先返回
    if (PREFERRED_READINGS[char]) {
      return [PREFERRED_READINGS[char]];
    }
    return dict[char];
  }

  // 如果是简体字，尝试转繁体查找
  const traditional = SIMPLIFIED_TO_TRADITIONAL[char];
  if (traditional && dict[traditional]) {
    // 如果有首选读音，优先返回
    if (PREFERRED_READINGS[traditional]) {
      return [PREFERRED_READINGS[traditional]];
    }
    return dict[traditional];
  }

  // 如果是繁体字，尝试转简体查找（反向）
  for (const [simp, trad] of Object.entries(SIMPLIFIED_TO_TRADITIONAL)) {
    if (trad === char && dict[simp]) return dict[simp];
  }

  return [];
}

/**
 * 查询单个汉字的所有读音（用于多音字审核）
 */
export async function lookupAllReadings(char: string): Promise<string[]> {
  const dict = await loadDict();

  if (dict[char]) return dict[char];

  const traditional = SIMPLIFIED_TO_TRADITIONAL[char];
  if (traditional && dict[traditional]) return dict[traditional];

  for (const [simp, trad] of Object.entries(SIMPLIFIED_TO_TRADITIONAL)) {
    if (trad === char && dict[simp]) return dict[simp];
  }

  return [];
}

/**
 * 为一行汉字标注粤拼
 */
export async function lookupLine(chars: string[]): Promise<string> {
  const pinyins: string[] = [];
  for (const char of chars) {
    const readings = await lookupJyutping(char);
    pinyins.push(readings[0] || char);
  }
  return pinyins.join(' ');
}

// 内置精简字典（覆盖高频粤语歌词用字约 500 字）
const COMMON_CHARS_DICT: Record<string, string[]> = {
  "的": ["dik1"],
  "一": ["jat1"],
  "是": ["si6"],
  "不": ["bat1"],
  "了": ["le5", "liu5"],
  "人": ["jan4"],
  "我": ["ngo5"],
  "在": ["zoi6"],
  "有": ["jau5"],
  "他": ["taa1"],
  "这": ["ze2", "nei2"],
  "中": ["zung1"],
  "大": ["daai6"],
  "来": ["loi4"],
  "上": ["soeng5", "soeng6"],
  "国": ["gwok3"],
  "个": ["go3"],
  "到": ["dou3"],
  "说": ["syut3"],
  "们": ["mun4"],
  "为": ["wai4", "wai6"],
  "子": ["zi2"],
  "和": ["wo4", "wo6"],
  "你": ["nei5"],
  "地": ["dei6", "deng6"],
  "出": ["ceot1"],
  "会": ["wui5", "wui2"],
  "时": ["si4"],
  "要": ["jiu3", "jiu1"],
  "生": ["saang1", "sang1"],
  "可": ["ho2"],
  "也": ["jaa5"],
  "得": ["dak1"],
  "着": ["zoek6", "zoek3"],
  "那": ["naa5"],
  "以": ["ji5"],
  "过": ["gwo3"],
  "去": ["heoi3"],
  "下": ["haa5", "haa6"],
  "年": ["nin4"],
  "后": ["hau6"],
  "里": ["leoi5"],
  "没": ["mut6"],
  "多": ["do1"],
  "天": ["tin1"],
  "看": ["hon3"],
  "好": ["hou2"],
  "她": ["taa1"],
  "两": ["loeng5"],
  "想": ["soeng2"],
  "心": ["sam1"],
  "无": ["mou4"],
  "情": ["cing4"],
  "爱": ["oi3"],
  "长": ["coeng4", "zoeng2"],
  "日": ["jat6"],
  "行": ["hang4", "haang4"],
  "世": ["sai3"],
  "家": ["gaa1"],
  "老": ["lou5"],
  "头": ["tau4"],
  "同": ["tung4"],
  "三": ["saam1"],
  "开": ["hoi1"],
  "面": ["min6"],
  "走": ["zau2"],
  "体": ["tai2"],
  "最": ["zeoi3"],
  "经": ["ging1"],
  "见": ["gin3"],
  "么": ["mo1"],
  "什": ["sam6"],
  "道": ["dou6"],
  "对": ["deoi3"],
  "些": ["se1"],
  "它": ["taa1"],
  "前": ["cin4"],
  "而": ["ji4"],
  "还": ["waan4"],
  "让": ["joeng6"],
  "高": ["gou1"],
  "知": ["zi1"],
  "事": ["si6"],
  "样": ["joeng6", "joeng2"],
  "理": ["lei5"],
  "手": ["sau2"],
  "做": ["zou6"],
  "太": ["taai3"],
  "都": ["dou1"],
  "只": ["zek3", "zi2"],
  "把": ["baa2"],
  "方": ["fong1"],
  "又": ["jau6"],
  "如": ["jyu4"],
  "己": ["gei2"],
  "间": ["gaan1"],
  "问": ["man6"],
  "死": ["sei2"],
  "身": ["san1"],
  "真": ["zan1"],
  "内": ["noi6"],
  "信": ["seon3"],
  "进": ["zeon3"],
  "动": ["dung6"],
  "其": ["kei4"],
  "被": ["bei6"],
  "此": ["ci2"],
  "话": ["waa6"],
  "别": ["bit6"],
  "将": ["zoeng1"],
  "主": ["zyu2"],
  "新": ["san1"],
  "实": ["sat6"],
  "正": ["zeng3", "zing3"],
  "等": ["dang2"],
  "已": ["ji5"],
  "明": ["ming4", "ming5"],
  "第": ["dai6"],
  "回": ["wui4"],
  "很": ["han2"],
  "定": ["ding6"],
  "起": ["hei2"],
  "发": ["faat3"],
  "工": ["gung1"],
  "水": ["seoi2"],
  "所": ["so2"],
  "果": ["gwo2"],
  "候": ["hau6"],
  "先": ["sin1"],
  "找": ["zaau2"],
  "感": ["gam2"],
  "教": ["gaau3"],
  "次": ["ci3"],
  "加": ["gaa1"],
  "风": ["fung1"],
  "空": ["hung1"],
  "红": ["hung4"],
  "山": ["saan1"],
  "车": ["ce1"],
  "花": ["faa1"],
  "雨": ["jyu5"],
  "白": ["baak6"],
  "月": ["jyut6"],
  "星": ["sing1", "seng1"],
  "夜": ["je6"],
  "海": ["hoi2"],
  "远": ["jyun5"],
  "近": ["kan5", "gan6"],
  "低": ["dai1"],
  "深": ["sam1"],
  "笑": ["siu3"],
  "哭": ["huk1"],
  "歌": ["go1"],
  "听": ["teng1", "ting3"],
  "声": ["seng1", "sing1"],
  "音": ["jam1"],
  "美": ["mei5"],
  "甜": ["tim4", "tim5"],
  "苦": ["fu2"],
  "痛": ["tung3"],
  "梦": ["mung6"],
  "醒": ["seng2", "sing2"],
  "睡": ["seoi6"],
  "光": ["gwong1"],
  "暗": ["am3"],
  "黑": ["hak1"],
  "蓝": ["laam4"],
  "绿": ["luk6"],
  "黄": ["wong4"],
  "金": ["gam1"],
  "银": ["ngan4"],
  "木": ["muk6"],
  "火": ["fo2"],
  "土": ["tou2"],
  "路": ["lou6"],
  "桥": ["kiu4"],
  "门": ["mun4"],
  "窗": ["coeng1"],
  "床": ["cong4"],
  "椅": ["ji2"],
  "桌": ["coek3"],
  "书": ["syu1"],
  "笔": ["bat1"],
  "纸": ["zi2"],
  "字": ["zi6"],
  "画": ["waa6"],
  "诗": ["si1"],
  "词": ["ci4"],
  "曲": ["kuk1"],
  "唱": ["coeng3"],
  "跳": ["tiu3"],
  "跑": ["paau2"],
  "站": ["zaam6"],
  "坐": ["co5"],
  "躺": ["tong2"],
  "吃": ["hek3", "jaak3"],
  "喝": ["hot3"],
  "读": ["duk6"],
  "写": ["se2"],
  "忘": ["mong4"],
  "记": ["gei3"],
  "怕": ["paa3"],
  "敢": ["gam2"],
  "能": ["nang4"],
  "该": ["goi1"],
  "愿": ["jyun6"],
  "喜": ["hei2"],
  "怒": ["nou6"],
  "哀": ["oi1"],
  "乐": ["lok6", "ngok6"],
  "离": ["lei4"],
  "合": ["hap6"],
  "聚": ["zeoi6"],
  "散": ["saan3"],
  "留": ["lau4"],
  "停": ["ting4"],
  "始": ["ci2"],
  "终": ["zung1"],
  "旧": ["gau6"],
  "岁": ["seoi3"],
  "分": ["fan1"],
  "秒": ["miu5"],
  "春": ["ceon1"],
  "夏": ["haa6"],
  "秋": ["cau1"],
  "冬": ["dung1"],
  "早": ["zou2"],
  "午": ["ng5"],
  "晚": ["maan5"],
  "昨": ["zok6"],
  "今": ["gam1"],
  "男": ["naam4"],
  "女": ["neoi5"],
  "少": ["siu3"],
  "友": ["jau5"],
  "敌": ["dik6"],
  "亲": ["can1"],
  "陌": ["mak6"],
  "独": ["duk6"],
  "双": ["soeng1"],
  "全": ["cyun4"],
  "半": ["bun3"],
  "满": ["mun5"],
  "失": ["sat1"],
  "假": ["gaa2"],
  "错": ["co3"],
  "非": ["fei1"],
  "难": ["naan4"],
  "易": ["ji6"],
  "快": ["faai3"],
  "慢": ["maan6"],
  "短": ["dyun2"],
  "宽": ["fun1"],
  "窄": ["zaak3"],
  "厚": ["hau5"],
  "薄": ["bok6"],
  "重": ["cung5", "zung6"],
  "轻": ["heng1"],
  "硬": ["ngaang6"],
  "软": ["jyun5"],
  "热": ["jit6"],
  "冷": ["laang5"],
  "干": ["gon1"],
  "湿": ["sap1"],
  "清": ["cing1"],
  "浊": ["zuk6"],
  "香": ["hoeng1"],
  "臭": ["cau3"],
  "酸": ["syun1"],
  "辣": ["laat6"],
  "咸": ["haam4"],
};
