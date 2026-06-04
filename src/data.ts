/**
 * POE Filter keyword data definitions.
 * Used by completion, diagnostics, hover, and snippets.
 */

// ── Keyword categories ──────────────────────────────────────────────

export type KeywordCategory =
  | 'block-header'
  | 'boolean-condition'
  | 'multi-select-condition'
  | 'numeric-condition'
  | 'array-condition'
  | 'mod-condition'
  | 'visual-action'
  | 'misc';

export interface KeywordDef {
  keyword: string;
  category: KeywordCategory;
  description: string;          // short description
  detail: string;               // longer detail shown in hover
  valueType: 'none' | 'boolean' | 'multi-select' | 'numeric' | 'plain-numeric' | 'string-array' | 'color' | 'sound' | 'icon' | 'effect';
  validValues?: string[];       // for multi-select / boolean
  operators?: string[];         // allowed operators for numeric
  minVersion?: string;          // e.g. "3.23" for new keywords
  params?: string[];            // parameter names for documentation
}

// ── Complete keyword definitions ─────────────────────────────────────

export const BLOCK_HEADERS: KeywordDef[] = [
  {
    keyword: 'Show',
    category: 'block-header',
    description: '显示匹配的物品',
    detail: 'Show — 匹配到此规则的物品会在地面上显示。\n\n用于高价值或感兴趣的物品，配合视觉效果（颜色、图标、音效）来突出显示。',
    valueType: 'none',
    params: [],
  },
  {
    keyword: 'Hide',
    category: 'block-header',
    description: '隐藏匹配的物品',
    detail: 'Hide — 匹配到此规则的物品会被隐藏。\n\n用于低价值或不需要的物品，减少屏幕上的视觉干扰。',
    valueType: 'none',
    params: [],
  },
];

export const KEYWORDS: KeywordDef[] = [
  // ── Boolean conditions ──
  {
    keyword: 'Corrupted',
    category: 'boolean-condition',
    description: '是否已腐化',
    detail: 'Corrupted <True|False>\n\n过滤已腐化或未腐化的物品。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'Identified',
    category: 'boolean-condition',
    description: '是否已鉴定',
    detail: 'Identified <True|False>\n\n过滤已鉴定或未鉴定的物品。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'Mirrored',
    category: 'boolean-condition',
    description: '是否已镜像',
    detail: 'Mirrored <True|False>\n\n过滤镜像复制的物品。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'ElderItem',
    category: 'boolean-condition',
    description: '是否为塑界者物品',
    detail: 'ElderItem <True|False>\n\n过滤塑界者（Elder）影响的物品。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'ShaperItem',
    category: 'boolean-condition',
    description: '是否为异界尊师物品',
    detail: 'ShaperItem <True|False>\n\n过滤异界尊师（Shaper）影响的物品。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'FracturedItem',
    category: 'boolean-condition',
    description: '是否为破碎物品',
    detail: 'FracturedItem <True|False>\n\n过滤破碎（Fractured）修饰词物品。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'SynthesisedItem',
    category: 'boolean-condition',
    description: '是否为聚合物品',
    detail: 'SynthesisedItem <True|False>\n\n过滤聚合（Synthesised）物品。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'ShapedMap',
    category: 'boolean-condition',
    description: '是否为塑形地图',
    detail: 'ShapedMap <True|False>\n\n过滤塑形（Shaped）地图。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'ElderMap',
    category: 'boolean-condition',
    description: '是否为塑界者地图',
    detail: 'ElderMap <True|False>\n\n过滤塑界者影响的地图。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'BlightedMap',
    category: 'boolean-condition',
    description: '是否为凋零地图',
    detail: 'BlightedMap <True|False>\n\n过滤凋零（Blighted）地图。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'UberBlightedMap',
    category: 'boolean-condition',
    description: '是否为超级凋零地图',
    detail: 'UberBlightedMap <True|False>\n\n过滤超级凋零地图。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'AnyEnchantment',
    category: 'boolean-condition',
    description: '是否带有附魔',
    detail: 'AnyEnchantment <True|False>\n\n过滤是否有附魔效果。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'AlternateQuality',
    category: 'boolean-condition',
    description: '是否为替代品质宝石',
    detail: 'AlternateQuality <True|False>\n\n过滤替代品质（Alternate Quality）宝石。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'Scourged',
    category: 'boolean-condition',
    description: '是否为灾厄物品',
    detail: 'Scourged <True|False>\n\n过滤灾厄（Scourged）物品。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'Replica',
    category: 'boolean-condition',
    description: '是否为复制品',
    detail: 'Replica <True|False>\n\n过滤复制品（Replica）传奇物品。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'HasVaalUniqueMod',
    category: 'boolean-condition',
    description: '是否有瓦尔传奇词缀',
    detail: 'HasVaalUniqueMod <True|False>',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'TwiceCorrupted',
    category: 'boolean-condition',
    description: '是否双重腐化',
    detail: 'TwiceCorrupted <True|False>',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'MirageMap',
    category: 'boolean-condition',
    description: '是否为幻影地图',
    detail: 'MirageMap <True|False>',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'HasImplicitMod',
    category: 'boolean-condition',
    description: '是否有内在词缀',
    detail: 'HasImplicitMod <True|False>',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'HasCruciblePassiveTree',
    category: 'boolean-condition',
    description: '是否有熔炉被动树',
    detail: 'HasCruciblePassiveTree <True|False>',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'ZanaMemory',
    category: 'boolean-condition',
    description: '是否为扎娜记忆',
    detail: 'ZanaMemory <True|False>',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'Foulborn',
    category: 'boolean-condition',
    description: '是否为污生物品',
    detail: 'Foulborn <True|False>',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'Imbued',
    category: 'boolean-condition',
    description: '是否为灌注物品',
    detail: 'Imbued <True|False>',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'AlwaysShow',
    category: 'boolean-condition',
    description: '始终显示',
    detail: 'AlwaysShow <True|False>\n\n即使被 Hide 规则匹配也始终显示。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },
  {
    keyword: 'IsVaalUnique',
    category: 'boolean-condition',
    description: '是否为瓦尔传奇物品（POE2）',
    detail: 'IsVaalUnique <True|False>\n\n判断物品是否为瓦尔传奇物品，仅限 POE2。',
    valueType: 'boolean',
    validValues: ['True', 'False'],
    params: ['True/False'],
  },

  // ── Multi-select conditions ──
  {
    keyword: 'Rarity',
    category: 'multi-select-condition',
    description: '物品稀有度',
    detail: 'Rarity <Normal|Magic|Rare|Unique>\n\n按物品稀有度过滤。可使用运算符进行范围选择。',
    valueType: 'multi-select',
    validValues: ['Normal', 'Magic', 'Rare', 'Unique'],
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['Normal/Magic/Rare/Unique'],
  },
  {
    keyword: 'HasInfluence',
    category: 'multi-select-condition',
    description: '是否有势力影响',
    detail: 'HasInfluence <Shaper|Elder|Crusader|Hunter|Redeemer|Warlord|None>\n\n按势力影响类型过滤。可指定多个值。',
    valueType: 'multi-select',
    validValues: ['Shaper', 'Elder', 'Crusader', 'Hunter', 'Redeemer', 'Warlord', 'None'],
    params: ['Shaper/Elder/Crusader/Hunter/Redeemer/Warlord/None'],
  },

  // ── Numeric conditions ──
  {
    keyword: 'ItemLevel',
    category: 'numeric-condition',
    description: '物品等级',
    detail: 'ItemLevel <operator> <level>\n\n按物品等级（ilvl）过滤。\n范围：0-100\n示例：ItemLevel >= 75',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'level (0-100)'],
  },
  {
    keyword: 'DropLevel',
    category: 'numeric-condition',
    description: '掉落等级',
    detail: 'DropLevel <operator> <level>\n\n按物品掉落等级过滤。',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'level'],
  },
  {
    keyword: 'Quality',
    category: 'numeric-condition',
    description: '品质',
    detail: 'Quality <operator> <value>\n\n按物品品质值过滤。\n范围：0-30',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'value (0-30)'],
  },
  {
    keyword: 'MapTier',
    category: 'numeric-condition',
    description: '地图阶级',
    detail: 'MapTier <operator> <tier>\n\n按地图阶级过滤。\n范围：1-16',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'tier (1-16)'],
  },
  {
    keyword: 'WaystoneTier',
    category: 'numeric-condition',
    description: 'waystone 阶级',
    detail: 'WaystoneTier <operator> <tier>\n\n按 Waystone 阶级过滤（PoE2）。',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'tier'],
  },
  {
    keyword: 'GemLevel',
    category: 'numeric-condition',
    description: '宝石等级',
    detail: 'GemLevel <operator> <level>\n\n按宝石等级过滤。',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'level'],
  },
  {
    keyword: 'StackSize',
    category: 'numeric-condition',
    description: '堆叠数量',
    detail: 'StackSize <operator> <count>\n\n按物品堆叠数量过滤。\n用于通货、地图等可堆叠物品。',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'count'],
  },
  {
    keyword: 'Stack',
    category: 'numeric-condition',
    description: '堆叠数量（旧名）',
    detail: 'Stack <operator> <count>\n\nStackSize 的旧名称。建议使用 StackSize。',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'count'],
  },
  {
    keyword: 'LinkedSockets',
    category: 'numeric-condition',
    description: '连结孔数',
    detail: 'LinkedSockets <operator> <count>\n\n按连结的孔数过滤。\n范围：0-6\n示例：LinkedSockets >= 5',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'count (0-6)'],
  },
  {
    keyword: 'Height',
    category: 'numeric-condition',
    description: '物品高度（格子数）',
    detail: 'Height <operator> <value>\n\n按物品占用的背包格子高度过滤。',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'value'],
  },
  {
    keyword: 'Width',
    category: 'numeric-condition',
    description: '物品宽度（格子数）',
    detail: 'Width <operator> <value>\n\n按物品占用的背包格子宽度过滤。',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'value'],
  },
  {
    keyword: 'AreaLevel',
    category: 'numeric-condition',
    description: '区域等级',
    detail: 'AreaLevel <operator> <level>\n\n按当前区域等级过滤。',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'level'],
  },
  {
    keyword: 'CorruptedMods',
    category: 'numeric-condition',
    description: '腐化词缀数量',
    detail: 'CorruptedMods <operator> <count>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'count'],
  },
  {
    keyword: 'EnchantmentPassiveNum',
    category: 'numeric-condition',
    description: '附魔被动技能数量',
    detail: 'EnchantmentPassiveNum <operator> <count>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'count'],
  },
  {
    keyword: 'BaseArmour',
    category: 'numeric-condition',
    description: '基础护甲值',
    detail: 'BaseArmour <operator> <value>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'value'],
  },
  {
    keyword: 'BaseEvasion',
    category: 'numeric-condition',
    description: '基础闪避值',
    detail: 'BaseEvasion <operator> <value>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'value'],
  },
  {
    keyword: 'BaseEnergyShield',
    category: 'numeric-condition',
    description: '基础能量护盾值',
    detail: 'BaseEnergyShield <operator> <value>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'value'],
  },
  {
    keyword: 'BaseWard',
    category: 'numeric-condition',
    description: '基础守卫值',
    detail: 'BaseWard <operator> <value>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'value'],
  },
  {
    keyword: 'BaseDefencePercentile',
    category: 'numeric-condition',
    description: '基础防御百分位',
    detail: 'BaseDefencePercentile <operator> <value>\n\n按基础防御值在同类物品中的百分位排名过滤。',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'value (0-100)'],
  },
  {
    keyword: 'HasSearingExarchImplicit',
    category: 'numeric-condition',
    description: '灼祭之主内蕴词缀数量',
    detail: 'HasSearingExarchImplicit <operator> <count>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'count'],
  },
  {
    keyword: 'HasEaterOfWorldsImplicit',
    category: 'numeric-condition',
    description: '灭世者内蕴词缀数量',
    detail: 'HasEaterOfWorldsImplicit <operator> <count>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'count'],
  },
  {
    keyword: 'BaseCritChance',
    category: 'numeric-condition',
    description: '基础暴击率',
    detail: 'BaseCritChance <operator> <value>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'value'],
  },
  {
    keyword: 'BaseAttackSpeed',
    category: 'numeric-condition',
    description: '基础攻击速度',
    detail: 'BaseAttackSpeed <operator> <value>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'value'],
  },
  {
    keyword: 'UnidentifiedItemTier',
    category: 'numeric-condition',
    description: '未鉴定物品阶级',
    detail: 'UnidentifiedItemTier <operator> <value>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'value'],
  },
  {
    keyword: 'MemoryStrands',
    category: 'numeric-condition',
    description: '记忆线数量',
    detail: 'MemoryStrands <operator> <count>',
    valueType: 'numeric',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['operator', 'count'],
  },

  // ── Array conditions ──
  {
    keyword: 'Class',
    category: 'array-condition',
    description: '物品类别',
    detail: 'Class <"ClassName" ["ClassName2" ...]>\n\n按物品类别过滤。支持部分匹配。\n常用类别：Currency, Maps, Divination Cards, Jewels, Gems, Armours, Weapons, etc.',
    valueType: 'string-array',
    params: ['"ClassName"...'],
  },
  {
    keyword: 'BaseType',
    category: 'array-condition',
    description: '基础类型',
    detail: 'BaseType <"TypeName" ["TypeName2" ...]>\n\n按物品基础类型名称过滤。支持部分匹配。\n示例：BaseType "Exalted Orb"',
    valueType: 'string-array',
    params: ['"TypeName"...'],
  },
  {
    keyword: 'Prophecy',
    category: 'array-condition',
    description: '预言名称',
    detail: 'Prophecy <"ProphecyName" ["ProphecyName2" ...]>\n\n按预言名称过滤。',
    valueType: 'string-array',
    params: ['"ProphecyName"...'],
  },
  {
    keyword: 'Sockets',
    category: 'array-condition',
    description: '孔数组合',
    detail: 'Sockets <pattern>\n\n按孔的数量和颜色组合过滤。\n格式：R红 B蓝 G绿 W白 D黑\n示例：Sockets >= 5R 1B',
    valueType: 'string-array',
    operators: ['>=', '<=', '>', '<', '=', '=='],
    params: ['R/B/G/W/D pattern'],
  },
  {
    keyword: 'SocketGroup',
    category: 'array-condition',
    description: '连结孔组合',
    detail: 'SocketGroup <pattern>\n\n按连结的孔的颜色组合过滤。\n示例：SocketGroup RRRR',
    valueType: 'string-array',
    params: ['R/B/G/W/D pattern'],
  },
  {
    keyword: 'EnchantmentPassiveNode',
    category: 'array-condition',
    description: '附魔被动节点',
    detail: 'EnchantmentPassiveNode <"NodeName" ...>\n\n按附魔被动节点名称过滤。',
    valueType: 'string-array',
    params: ['"NodeName"...'],
  },
  {
    keyword: 'TransfiguredGem',
    category: 'array-condition',
    description: '变异宝石',
    detail: 'TransfiguredGem <"GemName" ...>\n\n按变异宝石名称过滤。',
    valueType: 'string-array',
    params: ['"GemName"...'],
  },

  // ── Mod conditions ──
  {
    keyword: 'HasExplicitMod',
    category: 'mod-condition',
    description: '拥有显式词缀',
    detail: 'HasExplicitMod <"ModName" ["ModName2" ...]>\n\n检查物品是否拥有指定的显式词缀。\n支持部分匹配。可使用 HasMod 替代。',
    valueType: 'string-array',
    params: ['"ModName"...'],
  },
  {
    keyword: 'HasMod',
    category: 'mod-condition',
    description: '拥有词缀',
    detail: 'HasMod <"ModName" ["ModName2" ...]>\n\n检查物品是否拥有指定的词缀（包括显式和隐式）。',
    valueType: 'string-array',
    params: ['"ModName"...'],
  },
  {
    keyword: 'HasEnchantment',
    category: 'mod-condition',
    description: '拥有附魔',
    detail: 'HasEnchantment <"EnchantmentName" ...>\n\n按附魔名称过滤。',
    valueType: 'string-array',
    params: ['"EnchantmentName"...'],
  },
  {
    keyword: 'GemQualityType',
    category: 'mod-condition',
    description: '宝石品质类型',
    detail: 'GemQualityType <type>\n\n按宝石品质类型过滤。\n类型：Superior, Anomalous, Divergent, Phantasmal',
    valueType: 'multi-select',
    validValues: ['Superior', 'Anomalous', 'Divergent', 'Phantasmal'],
    params: ['Superior/Anomalous/Divergent/Phantasmal'],
  },
  {
    keyword: 'ArchnemesisMod',
    category: 'mod-condition',
    description: '复仇女神词缀',
    detail: 'ArchnemesisMod <"ModName" ...>\n\n按复仇女神词缀过滤。',
    valueType: 'string-array',
    params: ['"ModName"...'],
  },

  // ── Visual actions ──
  {
    keyword: 'SetTextColor',
    category: 'visual-action',
    description: '设置文字颜色',
    detail: 'SetTextColor <R> <G> <B> [A]\n\n设置物品名称文字颜色。\nR/G/B: 0-255, A: 0-255 (可选，透明度)',
    valueType: 'color',
    params: ['R (0-255)', 'G (0-255)', 'B (0-255)', 'A (0-255, 可选)'],
  },
  {
    keyword: 'SetBackgroundColor',
    category: 'visual-action',
    description: '设置背景颜色',
    detail: 'SetBackgroundColor <R> <G> <B> [A]\n\n设置物品标签背景颜色。\nR/G/B: 0-255, A: 0-255 (可选，透明度)',
    valueType: 'color',
    params: ['R (0-255)', 'G (0-255)', 'B (0-255)', 'A (0-255, 可选)'],
  },
  {
    keyword: 'SetBorderColor',
    category: 'visual-action',
    description: '设置边框颜色',
    detail: 'SetBorderColor <R> <G> <B> [A]\n\n设置物品标签边框颜色。\nR/G/B: 0-255, A: 0-255 (可选，透明度)',
    valueType: 'color',
    params: ['R (0-255)', 'G (0-255)', 'B (0-255)', 'A (0-255, 可选)'],
  },
  {
    keyword: 'SetFontSize',
    category: 'visual-action',
    description: '设置字体大小',
    detail: 'SetFontSize <size>\n\n设置物品标签字体大小。\n范围：18-45，默认：32',
    valueType: 'plain-numeric',
    params: ['size (18-45)'],
  },
  {
    keyword: 'MinimapIcon',
    category: 'visual-action',
    description: '设置小地图图标',
    detail: 'MinimapIcon <size> <color> <shape>\n\n在小地图上显示物品图标。\nsize: 0-2 (小/中/大)\ncolor: Red/Green/Blue/Brown/White/Yellow/Cyan/Grey/Orange/Pink/Purple\nshape: Circle/Diamond/Hexagon/Square/Star/Triangle/Cross/Moon/Raindrop/Kite/Pentagon/UpsideDownHouse',
    valueType: 'icon',
    validValues: ['0', '1', '2'],
    params: ['size (0-2)', 'color', 'shape'],
  },
  {
    keyword: 'PlayEffect',
    category: 'visual-action',
    description: '播放光柱效果',
    detail: 'PlayEffect <color> [Temp]\n\n在物品位置显示光柱效果。\ncolor: Red/Green/Blue/Brown/White/Yellow/Cyan/Grey/Orange/Pink/Purple\nTemp: 可选，临时效果（不会持续显示）',
    valueType: 'effect',
    validValues: ['Red', 'Green', 'Blue', 'Brown', 'White', 'Yellow', 'Cyan', 'Grey', 'Orange', 'Pink', 'Purple'],
    params: ['color', 'Temp (可选)'],
  },
  {
    keyword: 'PlayAlertSound',
    category: 'visual-action',
    description: '播放提示音',
    detail: 'PlayAlertSound <soundId> [volume]\n\n播放提示音效。\nsoundId: 1-16 或 "ShAlchemy"/"ShBlessed" 等特殊名称\nvolume: 0-300 (可选)',
    valueType: 'sound',
    params: ['soundId (1-16)', 'volume (0-300, 可选)'],
  },
  {
    keyword: 'PlayAlertSoundPositional',
    category: 'visual-action',
    description: '播放方位提示音',
    detail: 'PlayAlertSoundPositional <soundId> [volume]\n\n播放带方位感的提示音效。',
    valueType: 'sound',
    params: ['soundId (1-16)', 'volume (0-300, 可选)'],
  },
  {
    keyword: 'CustomAlertSound',
    category: 'visual-action',
    description: '自定义提示音',
    detail: 'CustomAlertSound <"filename">\n\n播放自定义音效文件。\n文件放在过滤器同目录下。',
    valueType: 'string-array',
    params: ['"filename"'],
  },
  {
    keyword: 'DisableDropSound',
    category: 'visual-action',
    description: '禁用掉落音效',
    detail: 'DisableDropSound\n\n禁用此物品的默认掉落音效。',
    valueType: 'none',
    params: [],
  },
  {
    keyword: 'EnableDropSound',
    category: 'visual-action',
    description: '启用掉落音效',
    detail: 'EnableDropSound\n\n重新启用此物品的默认掉落音效。',
    valueType: 'none',
    params: [],
  },
  {
    keyword: 'DisableDropSoundIfAlertSound',
    category: 'visual-action',
    description: '有提示音时禁用掉落音效',
    detail: 'DisableDropSoundIfAlertSound\n\n当已设置 PlayAlertSound 时禁用默认掉落音效。',
    valueType: 'none',
    params: [],
  },
  {
    keyword: 'Continue',
    category: 'visual-action',
    description: '继续匹配下一条规则',
    detail: 'Continue\n\n当前规则匹配后不停止，继续尝试匹配后续规则。\n用于在应用视觉效果的同时继续检查其他条件。',
    valueType: 'none',
    params: [],
  },
];

// ── Lookup helpers ───────────────────────────────────────────────────

const keywordMap = new Map<string, KeywordDef>();
for (const k of KEYWORDS) {
  keywordMap.set(k.keyword.toLowerCase(), k);
}
for (const k of BLOCK_HEADERS) {
  keywordMap.set(k.keyword.toLowerCase(), k);
}

export function getKeywordDef(keyword: string): KeywordDef | undefined {
  return keywordMap.get(keyword.toLowerCase());
}

export function getAllKeywords(): KeywordDef[] {
  return [...BLOCK_HEADERS, ...KEYWORDS];
}

export function getBlockBodyKeywords(): KeywordDef[] {
  return KEYWORDS;
}

// MinimapIcon shapes
export const MINIMAP_SHAPES = [
  'Circle', 'Diamond', 'Hexagon', 'Square', 'Star',
  'Triangle', 'Cross', 'Moon', 'Raindrop', 'Kite',
  'Pentagon', 'UpsideDownHouse',
];

export const MINIMAP_COLORS = [
  'Red', 'Green', 'Blue', 'Brown', 'White', 'Yellow',
  'Cyan', 'Grey', 'Orange', 'Pink', 'Purple',
];

export const PLAY_EFFECT_COLORS = [
  'Red', 'Green', 'Blue', 'Brown', 'White', 'Yellow',
  'Cyan', 'Grey', 'Orange', 'Pink', 'Purple',
];

// Common class names for completion
export const COMMON_CLASSES = [
  // ── Default (shared) ──
  'Flasks', 'Life Flasks', 'Mana Flasks',
  'Amulets', 'Rings',
  'Claws', 'Daggers', 'Wands', 'Sceptres',
  'One Hand Swords', 'One Hand Axes', 'One Hand Maces',
  'Bows', 'Staves',
  'Two Hand Swords', 'Two Hand Axes', 'Two Hand Maces',
  'Gems', 'Skill Gems', 'Support Gems',
  'Quivers', 'Belts', 'Gloves', 'Boots',
  'Body Armours', 'Helmets', 'Shields',
  'Fishing Rods', 'Stackable Currency', 'Map Fragments',
  'Jewels', 'Quest Items', 'Incubators',
  'Expedition Logbooks', 'Instance Local Items',
  'Relics', 'Vault Keys', 'Charms',
  // ── PoE1 only ──
  'Hybrid Flasks', 'Utility Flasks',
  'Thrusting One Hand Swords', 'Rune Daggers', 'Warstaves',
  'Maps', 'Divination Cards', 'Pieces', 'Abyss Jewels',
  'Incursion Items', 'Heist Targets', 'Labyrinth Items',
  'Labyrinth Trinkets', 'Labyrinth Map Items',
  'Delve Stackable Socketable Currency', 'Atlas Upgrade Items',
  'Contracts', 'Heist Gear', 'Heist Tools', 'Heist Cloaks', 'Heist Brooches',
  'Blueprints', 'Trinkets', 'Heist Targets', 'Misc Map Items',
  'Sentinels', 'Sanctum Research', 'Tinctures', 'Corpses',
  'Embers of the Allflame', 'Gold', 'Idols', 'Wombgifts',
  // ── PoE2 only ──
  'Breachstones', 'Quarterstaves', 'Bucklers', 'Traps',
  'Spears', 'Crossbows', 'Foci', 'Waystones',
  'Trial Coins', 'Inscribed Ultimatum', 'Augment', 'Tablet',
  'Omen', 'Pinnacle Keys', 'Talismans',
  'Uncut Skill Gems', 'Uncut Support Gems', 'Uncut Spirit Gems',
];
