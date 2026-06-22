/** 生产 /api/analysis health 专用知识 — 倪师疾厄论、人纪方案、星曜法则等 */

export interface JieEBranchAxis {
  organ: string;
  meridian: string;
  peakTime: string;
  tip: string;
}

/** 疾厄宫地支 → 倪师《天纪 05》宫位主轴（自生产 API 抓取） */
export const JIE_E_BRANCH_AXIS: Record<string, JieEBranchAxis> = {
  子: {
    organ: '膀胱 / 泌尿系统',
    meridian: '足太阳膀胱经',
    peakTime: '申时 15-17 点膀胱经旺',
    tip: '子宫为水，主生殖根源；忌长期憋尿与下焦受寒。',
  },
  丑: {
    organ: '肝（倪师天纪 05 明示）',
    meridian: '足厥阴肝经',
    peakTime: '丑时 1-3 点肝经旺',
    tip: '丑时熟睡养肝；怒则伤肝，情绪疏泄为要。',
  },
  寅: {
    organ: '胆 / 呼吸道 / 四肢',
    meridian: '足少阳胆经 / 手太阴肺经',
    peakTime: '子时 23-1 点胆经旺、寅时 3-5 点肺经旺',
    tip: '寅宫主动，筋骨呼吸需保养；忌熬夜。',
  },
  卯: {
    organ: '肝胆 / 神经系统',
    meridian: '足厥阴肝经 / 足少阳胆经',
    peakTime: '丑时肝经旺',
    tip: '肝木当令，养木之时，宜多食绿色蔬菜。',
  },
  辰: {
    organ: '脾胃 / 消化系统',
    meridian: '足阳明胃经',
    peakTime: '辰时 7-9 点胃经旺',
    tip: '辰时早餐要吃好；脾胃为后天之本。',
  },
  巳: {
    organ: '心 / 小肠 / 面部',
    meridian: '足太阴脾经 / 手太阳小肠经',
    peakTime: '巳时 9-11 点脾经旺',
    tip: '巳火上炎，护心防躁；小肠分清浊，宜温食。',
  },
  午: {
    organ: '心 / 头脑 / 眼目',
    meridian: '手少阴心经',
    peakTime: '午时 11-13 点心经旺',
    tip: '日丽中天之位，护眼护心；午时小憩最养心。',
  },
  未: {
    organ: '脾胃 / 四肢肌肉',
    meridian: '足太阴脾经',
    peakTime: '巳时脾经旺',
    tip: '未宫属土，脾主四肢，宜运动排湿。',
  },
  申: {
    organ: '肺 / 大肠 / 皮肤',
    meridian: '手太阴肺经 / 手阳明大肠经',
    peakTime: '寅时肺经旺、卯时 5-7 点大肠经旺',
    tip: '卯时空腹温水助排便；防呼吸道与皮肤问题。',
  },
  酉: {
    organ: '肾（倪师天纪 05 明示）',
    meridian: '足少阴肾经',
    peakTime: '酉时 17-19 点肾经旺',
    tip: '酉宫藏肾水，忌熬夜与纵欲；阴虚者当滋阴。',
  },
  戌: {
    organ: '脾胃 / 大肠 / 骨骼',
    meridian: '足太阴脾经 / 手阳明大肠经',
    peakTime: '辰时胃经旺',
    tip: '戌宫为土金交界，老年骨质与消化并重。',
  },
  亥: {
    organ: '肾 / 膀胱 / 生殖系统 / 头部',
    meridian: '足少阴肾经',
    peakTime: '酉时肾经旺、亥时 21-23 点三焦经旺',
    tip: '亥宫主水，养肾精；三焦通利则免疫强。',
  },
};

export interface StarWuxingJieE {
  element: string;
  organ: string;
  tip: string;
}

export const STAR_WUXING_JIE_E: Record<string, StarWuxingJieE> = {
  紫微: { element: '己土', organ: '脾胃', tip: '规律饮食、忌暴饮暴食；情绪压抑易伤脾胃。' },
  天机: { element: '乙木', organ: '肝胆 / 神经', tip: '少思多动；丑时深睡养肝，防思虑过度失眠。' },
  太阳: { element: '丙火', organ: '心 / 眼目', tip: '护眼护心；午时小憩，防血压与目疾。' },
  武曲: { element: '辛金', organ: '肺 / 骨骼', tip: '寅时深睡养肺；防金属外伤与呼吸道问题。' },
  天同: { element: '壬水', organ: '肾 / 代谢', tip: '忌久坐少动；酉时温水养肾，防代谢慢性病。' },
  廉贞: { element: '丁火', organ: '心 / 血分', tip: '亥时静养；定期查血压血糖，防血光手术。' },
  天府: { element: '戊土', organ: '脾胃 / 肌肉', tip: '巳时走动助消化；忌过逸久坐致代谢慢。' },
  太阴: { element: '癸水', organ: '肾 / 妇科', tip: '酉时养肾水；女命重妇科与情绪性失眠。' },
  贪狼: { element: '甲木', organ: '肝胆 / 生殖', tip: '丑时深睡养肝；节欲少酒，防肝火与生殖问题。' },
  巨门: { element: '癸水', organ: '肠胃 / 口舌', tip: '辰巳时规律早餐；说话吃饭皆要慢。' },
  天相: { element: '壬水', organ: '膀胱 / 皮肤', tip: '多饮温水；申时不憋尿，防泌尿与皮肤过敏。' },
  天梁: { element: '戊土', organ: '脾胃 / 慢性病', tip: '天梁为寿星，老年病多但可化解；宜定期体检。' },
  七杀: { element: '庚金', organ: '肺 / 筋骨', tip: '防突发外伤与筋骨损伤；寅时养肺。' },
  破军: { element: '壬水', organ: '肾 / 血光', tip: '防手术血光；规律作息，忌熬夜耗精。' },
};

export const LUCKY_STAR_JIE_E: Record<string, string> = {
  文昌: '文书考试压力易转化为头痛失眠，喉部与神经系统需保养。',
  文曲: '呼吸道与喉部需保养，亦需留意情绪性失眠。',
  左辅: '贵人助力亦主劳心，宜劳逸结合。',
  右弼: '人际协调多耗神，注意睡眠与情绪缓冲。',
  天魁: '男性长辈缘强，精神压力大时可求师长开导。',
  天钺: '女性贵人缘强，夜间宜早休息以养心神。',
  禄存: '财帛与健康绑定，为守财过度操劳则伤体。',
  天马: '奔波劳碌易积劳成疾，出行注意安全与休息。',
};

export const STAR_TIANJI_RULES: Record<string, string> = {
  紫微: '紫微为帝座皇帝星，能解厄制化（逢凶化吉），但须文武百官（左右昌曲魁钺）夹辅方显贵气。',
  天机: '天机属乙木，主神经与四肢；思虑过多则伤肝，宜动不宜静。',
  太阳: '太阳属丙火，主心脏与眼目；庙旺则健，落陷则防目疾与血压。',
  武曲: '武曲属辛金，主肺与骨骼；化忌主刑伤，见羊陀火铃更防金创。',
  天同: '天同属壬水，主肾与代谢；过逸则生疾，宜动以养之。',
  廉贞: '廉贞属丁火，主血分与心血管；化忌主血光，须防手术意外。',
  天府: '天府为南斗禄库，属土，主脾胃；逢空劫则财库被劫，亦主代谢问题。',
  太阴: '太阴属癸水，主肾与妇科；落陷则情绪病与内分泌需重点关注。',
  贪狼: '贪狼属甲木，主肝胆与生殖；欲望星，纵欲则伤命根。',
  巨门: '巨门属癸水，主口腹与暗疾；是非口舌之疾，吃饭宜慢。',
  天相: '天相为印星、主辅佐，逢禄存独守则易守财小气；属水，主膀胱皮肤。',
  天梁: '天梁为荫星、寿星，入疾厄主慢性病，老年才发病但能化解。',
  七杀: '七杀属庚金，主肺与刑伤；见煞则血光骨折风险升高。',
  破军: '破军属壬水，主血光与破坏；化忌则手术外伤需提前防范。',
  文昌: '文昌为科甲星、主文书；在疾厄则压力转头痛失眠。',
  文曲: '文曲为科甲星、主才艺口才；在疾厄则呼吸道与喉部为弱项。',
};

export interface RenjiFormula {
  name: string;
  source: string;
  indication: string;
  niUsage: string;
}

export interface RenjiCase {
  title: string;
  chiefComplaint: string;
  diagnosis: string;
  niQuote: string;
}

export interface RenjiPlan {
  keywords: string;
  acupuncture: { label: string; points: string }[];
  formulas: RenjiFormula[];
  cases: RenjiCase[];
}

/** 生产 health 主题「倪师人纪方案参考」— 按疾厄主星（首星） */
export const HEALTH_RENJI_PLAN: Partial<Record<string, RenjiPlan>> = {
  紫微: {
    keywords: '心血管 / 心脏 / 消化 / 高血压 / 胃 / 皮肤 / 结石 / 湿疹',
    acupuncture: [
      { label: '高血压', points: '太冲、行间、风池、曲池、合谷、太溪（肝阳上亢主穴）' },
      { label: '湿疹', points: '曲池、合谷、血海、三阴交、足三里（配凉血方）' },
      { label: '急性胃痉挛', points: '梁丘（特效）、足三里、中脘、内关（梁丘急性胃痛特效）' },
    ],
    formulas: [
      { name: '调胃承气汤', source: '伤寒论·阳明篇', indication: '阳明腑实轻证：腹满便秘、烦热', niUsage: '三承气中最缓。大黄不后下，与甘草同煎' },
      { name: '理中汤', source: '伤寒论·太阴篇', indication: '太阴脾胃虚寒：腹痛喜温喜按、下利清稀、口不渴', niUsage: '中焦虚寒第一方。慢性胃炎、胃溃疡、肠炎首选' },
      { name: '麦门冬汤', source: '金匮·肺痿', indication: '肺胃阴虚：咳嗽气逆、咽干口燥、舌红少苔', niUsage: '糖尿病上消（肺燥）、慢性咳嗽、咽喉干燥' },
      { name: '补中益气汤', source: '脾胃论', indication: '脾胃气虚下陷：体倦乏力、少气懒言、内脏下垂', niUsage: '胃下垂、子宫脱垂、脱肛、慢性疲劳' },
    ],
    cases: [
      { title: '皮肤过敏湿疹 · 皮肤过敏丸', chiefComplaint: '皮肤红疹、瘙痒、抓后渗液、反复发作', diagnosis: '脾胃失调，湿热内蕴', niQuote: '皮肤是脾胃的镜子——脾胃好不好看皮肤就知道' },
      { title: '不寐（失眠） · 半夏秫米汤', chiefComplaint: '入睡困难、多梦易醒、心烦、舌红少苔', diagnosis: '阳不入阴，胃不和则卧不安', niQuote: '内经讲「胃不和则卧不安」——这句话治了多少失眠' },
      { title: '胃痛 · 中脘为主', chiefComplaint: '上腹疼痛、嗳气吞酸、食欲不振', diagnosis: '胃气不和，可能寒可能热可能瘀', niQuote: '中脘加足三里——胃病治疗的两个王牌' },
    ],
  },
  巨门: {
    keywords: '口腔 / 咽喉 / 消化 / 胃 / 咳嗽',
    acupuncture: [
      { label: '小儿咳嗽', points: '肺俞、列缺、太渊、尺泽' },
      { label: '咽喉肿痛', points: '少商（放血）、商阳、合谷、天突（少商一刺出血即效）' },
      { label: '急性胃痉挛', points: '梁丘（特效）、足三里、中脘、内关（梁丘急性胃痛特效）' },
    ],
    formulas: [
      { name: '麦门冬汤', source: '金匮·肺痿', indication: '肺胃阴虚：咳嗽气逆、咽干口燥、舌红少苔', niUsage: '糖尿病上消（肺燥）、慢性咳嗽、咽喉干燥' },
      { name: '调胃承气汤', source: '伤寒论·阳明篇', indication: '阳明腑实轻证：腹满便秘、烦热', niUsage: '三承气中最缓。大黄不后下，与甘草同煎' },
      { name: '理中汤', source: '伤寒论·太阴篇', indication: '太阴脾胃虚寒：腹痛喜温喜按、下利清稀、口不渴', niUsage: '中焦虚寒第一方。慢性胃炎、胃溃疡、肠炎首选' },
    ],
    cases: [
      { title: '不寐（失眠） · 半夏秫米汤', chiefComplaint: '入睡困难、多梦易醒、心烦、舌红少苔', diagnosis: '阳不入阴，胃不和则卧不安', niQuote: '内经讲「胃不和则卧不安」——这句话治了多少失眠' },
      { title: '胃痛 · 中脘为主', chiefComplaint: '上腹疼痛、嗳气吞酸、食欲不振', diagnosis: '胃气不和，可能寒可能热可能瘀', niQuote: '中脘加足三里——胃病治疗的两个王牌' },
    ],
  },
  天机: {
    keywords: '神经 / 失眠 / 肝胆 / 头痛 / 焦虑',
    acupuncture: [
      { label: '失眠焦虑', points: '神门、内关、三阴交、太冲、百会' },
      { label: '偏头痛', points: '风池、太阳、合谷、太冲、悬厘' },
      { label: '胁肋胀痛', points: '期门、太冲、阳陵泉、行间' },
    ],
    formulas: [
      { name: '酸枣仁汤', source: '金匮·虚劳', indication: '虚劳失眠：虚烦不得眠、心悸', niUsage: '倪师常合甘麦大枣汤治焦虑失眠' },
      { name: '逍遥散', source: '太平惠民和剂局方', indication: '肝郁脾虚：胁痛目眩、月经不调', niUsage: '思虑过度、肝气郁结第一方' },
    ],
    cases: [
      { title: '不寐 · 酸枣仁汤', chiefComplaint: '入睡困难、多梦、心悸', diagnosis: '血虚肝郁，心神不安', niQuote: '天机人想太多——酸枣仁汤让脑子停下来' },
    ],
  },
  太阳: {
    keywords: '心血管 / 眼目 / 高血压 / 头痛 / 血热',
    acupuncture: [
      { label: '高血压', points: '太冲、行间、风池、曲池、合谷、太溪' },
      { label: '眼疾', points: '睛明、太阳、合谷、光明、太冲' },
      { label: '头痛', points: '合谷、太冲、风池、百会' },
    ],
    formulas: [
      { name: '天麻钩藤饮', source: '杂病证治新义', indication: '肝阳上亢：头痛眩晕、面红耳赤', niUsage: '太阳人高血压、头痛常用' },
    ],
    cases: [
      { title: '目疾 · 清肝明目', chiefComplaint: '目赤肿痛、视力疲劳', diagnosis: '肝火上炎，目窍不利', niQuote: '太阳主目——目疾难逃，要早养' },
    ],
  },
  武曲: {
    keywords: '肺 / 呼吸道 / 骨骼 / 外伤 / 手术',
    acupuncture: [
      { label: '咳嗽', points: '肺俞、列缺、太渊、尺泽、定喘' },
      { label: '肩背筋骨', points: '肩髃、天宗、阿是穴、阳陵泉' },
    ],
    formulas: [
      { name: '麻杏甘石汤', source: '伤寒论', indication: '邪热壅肺：气喘咳嗽、无汗或微汗', niUsage: '武曲属金主肺，外感后咳喘常用' },
    ],
    cases: [
      { title: '金创 · 预防', chiefComplaint: '易有金属外伤、手术', diagnosis: '武曲化忌主刑伤', niQuote: '武曲人要注意金属——能防则防' },
    ],
  },
  天同: {
    keywords: '肾 / 代谢 / 糖尿病 / 水肿 / 泌尿',
    acupuncture: [
      { label: '代谢调理', points: '足三里、三阴交、太溪、关元、脾俞' },
      { label: '水肿', points: '水分、阴陵泉、足三里、气海' },
    ],
    formulas: [
      { name: '肾气丸', source: '金匮要略', indication: '肾阳不足：腰痛脚软、小便频数', niUsage: '天同主水，代谢慢、水肿可用' },
    ],
    cases: [
      { title: '懒病 · 运动处方', chiefComplaint: '少动、代谢慢、体重上升', diagnosis: '天同过逸，气血不运', niQuote: '天同人最怕懒，懒就生病' },
    ],
  },
  廉贞: {
    keywords: '心血管 / 血分 / 手术 / 血光 / 炎症',
    acupuncture: [
      { label: '心血管', points: '内关、神门、膻中、足三里' },
      { label: '血热', points: '曲池、合谷、血海、三阴交' },
    ],
    formulas: [
      { name: '黄连解毒汤', source: '外台秘要', indication: '三焦火毒：大热烦躁、口燥咽干', niUsage: '廉贞化忌血热毒盛时可参考' },
    ],
    cases: [
      { title: '血光预防', chiefComplaint: '易有手术、外伤', diagnosis: '廉贞化忌主血光', niQuote: '廉贞是血光官非的星——体检比算命重要' },
    ],
  },
  天府: {
    keywords: '脾胃 / 消化 / 体重 / 代谢 / 肌肉',
    acupuncture: [
      { label: '消化不良', points: '中脘、足三里、内关、公孙' },
      { label: '肥胖代谢', points: '天枢、丰隆、三阴交、足三里' },
    ],
    formulas: [
      { name: '理中汤', source: '伤寒论·太阴篇', indication: '脾胃虚寒', niUsage: '天府属土，脾胃为第一关注' },
      { name: '补中益气汤', source: '脾胃论', indication: '中气下陷', niUsage: '天府人易胖易坠，升提中气' },
    ],
    cases: [
      { title: '胃疾 · 节饮食', chiefComplaint: '腹胀、消化不良、体重偏重', diagnosis: '脾胃运化不足', niQuote: '天府人容易胖，要会动' },
    ],
  },
  太阴: {
    keywords: '肾 / 妇科 / 内分泌 / 情绪 / 睡眠',
    acupuncture: [
      { label: '妇科', points: '三阴交、关元、气海、血海' },
      { label: '失眠', points: '神门、内关、三阴交、照海' },
    ],
    formulas: [
      { name: '温经汤', source: '金匮要略', indication: '冲任虚寒、瘀血阻滞', niUsage: '女命太阴疾厄，月经不调可参考' },
    ],
    cases: [
      { title: '情绪病 · 养心安神', chiefComplaint: '焦虑、抑郁、失眠', diagnosis: '阴血不足，心神失养', niQuote: '太阴主肾水，水浊则病' },
    ],
  },
  贪狼: {
    keywords: '肝胆 / 生殖 / 酒色 / 肝火 / 过敏',
    acupuncture: [
      { label: '肝火', points: '太冲、行间、曲池、合谷' },
      { label: '过敏', points: '曲池、合谷、血海、足三里' },
    ],
    formulas: [
      { name: '龙胆泻肝汤', source: '医方集解', indication: '肝胆湿热', niUsage: '纵欲肝火旺、下焦湿热' },
    ],
    cases: [
      { title: '节欲养生', chiefComplaint: '纵欲后体力下降', diagnosis: '欲望过重伤命根', niQuote: '贪狼是欲望星，欲望伤身就在生殖系统' },
    ],
  },
  天相: {
    keywords: '膀胱 / 泌尿 / 皮肤 / 结石 / 水分代谢',
    acupuncture: [
      { label: '泌尿', points: '中极、膀胱俞、三阴交、阴陵泉' },
      { label: '皮肤', points: '曲池、合谷、血海、风市' },
    ],
    formulas: [
      { name: '猪苓汤', source: '伤寒论', indication: '水热互结：小便不利、渴欲饮水', niUsage: '天相主水，泌尿结石可参考' },
    ],
    cases: [
      { title: '多喝水', chiefComplaint: '皮肤干燥、尿少', diagnosis: '水液代谢不足', niQuote: '天相是水星，要多喝水' },
    ],
  },
  天梁: {
    keywords: '慢性病 / 长寿 / 脾胃 / 老年病 / 化解',
    acupuncture: [
      { label: '慢性病调理', points: '足三里、关元、气海、三阴交' },
      { label: '老年保健', points: '百会、涌泉、合谷、内关' },
    ],
    formulas: [
      { name: '补中益气汤', source: '脾胃论', indication: '中气不足', niUsage: '天梁为寿星，老年体虚升提' },
    ],
    cases: [
      { title: '老年慢病', chiefComplaint: '慢性老毛病反复', diagnosis: '天梁入疾厄，老年才发病但能化解', niQuote: '天梁是寿星，有病也能化' },
    ],
  },
  七杀: {
    keywords: '肺 / 筋骨 / 外伤 / 血光 / 突发',
    acupuncture: [
      { label: '外伤预防', points: '合谷、太冲、阿是穴' },
      { label: '呼吸', points: '肺俞、定喘、列缺' },
    ],
    formulas: [
      { name: '桃核承气汤', source: '伤寒论', indication: '下焦蓄血', niUsage: '七杀主刑伤，瘀阻可用' },
    ],
    cases: [
      { title: '血光防范', chiefComplaint: '易有突发外伤', diagnosis: '七杀主杀气', niQuote: '七杀临身，行车签约都要稳' },
    ],
  },
  破军: {
    keywords: '血光 / 手术 / 肾 / 破坏 / 消耗',
    acupuncture: [
      { label: '术后恢复', points: '足三里、三阴交、气海、关元' },
      { label: '腰肾', points: '肾俞、命门、太溪、腰阳关' },
    ],
    formulas: [
      { name: '十灰散', source: '十药神书', indication: '血热妄行：各种出血', niUsage: '破军主血光，出血倾向可参考' },
    ],
    cases: [
      { title: '手术预防', chiefComplaint: '易有手术、血光', diagnosis: '破军主破坏', niQuote: '破军要捧着饭碗走天下——先护命再折腾' },
    ],
  },
};

export const SHA_JIE_E_WARNING: Record<string, string> = {
  擎羊: '擎羊',
  陀罗: '陀罗',
  火星: '火星',
  铃星: '铃星',
};
