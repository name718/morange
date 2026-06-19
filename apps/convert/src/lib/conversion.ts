export type UnitCategoryId =
  | 'length'
  | 'weight'
  | 'area'
  | 'volume'
  | 'time'
  | 'temperature'
  | 'data'
  | 'speed';

export interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  aliases?: string[];
  toBase(value: number): number;
  fromBase(value: number): number;
}

export interface UnitCategory {
  id: UnitCategoryId;
  name: string;
  icon: string;
  baseUnitId: string;
  precision: number;
  description: string;
  units: UnitDefinition[];
}

const linearUnit = (id: string, name: string, symbol: string, factor: number): UnitDefinition => ({
  id,
  name,
  symbol,
  toBase: (value) => value * factor,
  fromBase: (value) => value / factor
});

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    name: '长度',
    icon: '↔',
    baseUnitId: 'meter',
    precision: 6,
    description: '米、公里、厘米、英寸、英尺等常用长度换算',
    units: [
      linearUnit('kilometer', '公里', 'km', 1000),
      linearUnit('meter', '米', 'm', 1),
      linearUnit('decimeter', '分米', 'dm', 0.1),
      linearUnit('centimeter', '厘米', 'cm', 0.01),
      linearUnit('millimeter', '毫米', 'mm', 0.001),
      linearUnit('micrometer', '微米', 'μm', 0.000001),
      linearUnit('nanometer', '纳米', 'nm', 0.000000001),
      linearUnit('mile', '英里', 'mi', 1609.344),
      linearUnit('yard', '码', 'yd', 0.9144),
      linearUnit('foot', '英尺', 'ft', 0.3048),
      linearUnit('inch', '英寸', 'in', 0.0254),
      linearUnit('nautical-mile', '海里', 'nmi', 1852)
    ]
  },
  {
    id: 'weight',
    name: '重量',
    icon: '◎',
    baseUnitId: 'gram',
    precision: 6,
    description: '克、千克、吨、斤、磅、盎司等重量换算',
    units: [
      linearUnit('tonne', '吨', 't', 1000000),
      linearUnit('kilogram', '千克', 'kg', 1000),
      linearUnit('jin', '斤', '斤', 500),
      linearUnit('liang', '两', '两', 50),
      linearUnit('gram', '克', 'g', 1),
      linearUnit('milligram', '毫克', 'mg', 0.001),
      linearUnit('microgram', '微克', 'μg', 0.000001),
      linearUnit('pound', '磅', 'lb', 453.59237),
      linearUnit('ounce', '盎司', 'oz', 28.349523125),
      linearUnit('carat', '克拉', 'ct', 0.2)
    ]
  },
  {
    id: 'area',
    name: '面积',
    icon: '□',
    baseUnitId: 'square-meter',
    precision: 6,
    description: '平方米、亩、公顷、平方公里等面积换算',
    units: [
      linearUnit('square-kilometer', '平方公里', 'km²', 1000000),
      linearUnit('hectare', '公顷', 'ha', 10000),
      linearUnit('mu', '亩', '亩', 666.6666666667),
      linearUnit('square-meter', '平方米', 'm²', 1),
      linearUnit('square-decimeter', '平方分米', 'dm²', 0.01),
      linearUnit('square-centimeter', '平方厘米', 'cm²', 0.0001),
      linearUnit('square-millimeter', '平方毫米', 'mm²', 0.000001),
      linearUnit('acre', '英亩', 'acre', 4046.8564224),
      linearUnit('square-foot', '平方英尺', 'ft²', 0.09290304)
    ]
  },
  {
    id: 'volume',
    name: '体积',
    icon: '◈',
    baseUnitId: 'liter',
    precision: 6,
    description: '升、毫升、立方米、加仑等体积换算',
    units: [
      linearUnit('cubic-meter', '立方米', 'm³', 1000),
      linearUnit('liter', '升', 'L', 1),
      linearUnit('deciliter', '分升', 'dL', 0.1),
      linearUnit('milliliter', '毫升', 'mL', 0.001),
      linearUnit('cubic-centimeter', '立方厘米', 'cm³', 0.001),
      linearUnit('cubic-millimeter', '立方毫米', 'mm³', 0.000001),
      linearUnit('us-gallon', '美制加仑', 'gal', 3.785411784),
      linearUnit('uk-gallon', '英制加仑', 'imp gal', 4.54609),
      linearUnit('fluid-ounce', '液量盎司', 'fl oz', 0.0295735295625)
    ]
  },
  {
    id: 'time',
    name: '时间',
    icon: '◷',
    baseUnitId: 'second',
    precision: 6,
    description: '秒、分钟、小时、天、周、月、年换算',
    units: [
      linearUnit('year', '年', 'yr', 31536000),
      linearUnit('month', '月', 'mo', 2592000),
      linearUnit('week', '周', 'wk', 604800),
      linearUnit('day', '天', 'd', 86400),
      linearUnit('hour', '小时', 'h', 3600),
      linearUnit('minute', '分钟', 'min', 60),
      linearUnit('second', '秒', 's', 1),
      linearUnit('millisecond', '毫秒', 'ms', 0.001),
      linearUnit('microsecond', '微秒', 'μs', 0.000001)
    ]
  },
  {
    id: 'temperature',
    name: '温度',
    icon: '℃',
    baseUnitId: 'celsius',
    precision: 4,
    description: '摄氏度、华氏度、开尔文温度换算',
    units: [
      {
        id: 'celsius',
        name: '摄氏度',
        symbol: '℃',
        toBase: (value) => value,
        fromBase: (value) => value
      },
      {
        id: 'fahrenheit',
        name: '华氏度',
        symbol: '℉',
        toBase: (value) => (value - 32) * (5 / 9),
        fromBase: (value) => value * (9 / 5) + 32
      },
      {
        id: 'kelvin',
        name: '开尔文',
        symbol: 'K',
        toBase: (value) => value - 273.15,
        fromBase: (value) => value + 273.15
      }
    ]
  },
  {
    id: 'data',
    name: '数据',
    icon: '◇',
    baseUnitId: 'byte',
    precision: 6,
    description: 'Byte、KB、MB、GB、TB 与 bit 换算',
    units: [
      linearUnit('bit', '比特', 'bit', 0.125),
      linearUnit('byte', '字节', 'B', 1),
      linearUnit('kilobyte', '千字节', 'KB', 1024),
      linearUnit('megabyte', '兆字节', 'MB', 1024 ** 2),
      linearUnit('gigabyte', '吉字节', 'GB', 1024 ** 3),
      linearUnit('terabyte', '太字节', 'TB', 1024 ** 4),
      linearUnit('petabyte', '拍字节', 'PB', 1024 ** 5)
    ]
  },
  {
    id: 'speed',
    name: '速度',
    icon: '↗',
    baseUnitId: 'meter-per-second',
    precision: 6,
    description: '米/秒、公里/小时、英里/小时、节等速度换算',
    units: [
      linearUnit('meter-per-second', '米/秒', 'm/s', 1),
      linearUnit('kilometer-per-hour', '公里/小时', 'km/h', 1 / 3.6),
      linearUnit('mile-per-hour', '英里/小时', 'mph', 0.44704),
      linearUnit('foot-per-second', '英尺/秒', 'ft/s', 0.3048),
      linearUnit('knot', '节', 'kn', 0.5144444444)
    ]
  }
];

export interface ConversionResult {
  unit: UnitDefinition;
  value: number;
  displayValue: string;
}

export function getCategory(categoryId: UnitCategoryId): UnitCategory {
  const category = UNIT_CATEGORIES.find((item) => item.id === categoryId);
  if (!category) {
    return UNIT_CATEGORIES[0];
  }
  return category;
}

export function getUnit(category: UnitCategory, unitId: string): UnitDefinition {
  return category.units.find((unit) => unit.id === unitId) || category.units[0];
}

export function convertValue(
  category: UnitCategory,
  value: number,
  fromUnitId: string
): ConversionResult[] {
  const fromUnit = getUnit(category, fromUnitId);
  const baseValue = fromUnit.toBase(value);

  return category.units.map((unit) => {
    const converted = unit.fromBase(baseValue);
    return {
      unit,
      value: converted,
      displayValue: formatValue(converted, category.precision)
    };
  });
}

export function formatValue(value: number, precision: number): string {
  if (!Number.isFinite(value)) {
    return '--';
  }

  if (Object.is(value, -0)) {
    return '0';
  }

  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 100000000000 || abs < 0.000001)) {
    return value.toExponential(6).replace(/\.?0+e/, 'e');
  }

  const fixed = value.toFixed(precision);
  return fixed.replace(/\.?0+$/, '');
}

export function normalizeNumericInput(value: string): string {
  const normalized = value.replace(/[^\d.-]/g, '');
  const hasNegative = normalized.startsWith('-');
  const unsigned = normalized.replace(/-/g, '');
  const parts = unsigned.split('.');
  const integer = parts[0] || '';
  const decimal = parts.slice(1).join('');
  const next = `${hasNegative ? '-' : ''}${integer}${parts.length > 1 ? `.${decimal}` : ''}`;
  return next === '-' ? next : next.replace(/^(-?)0+(\d)/, '$1$2');
}

export function parseInputValue(value: string): number | null {
  if (!value || value === '-' || value === '.' || value === '-.') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
