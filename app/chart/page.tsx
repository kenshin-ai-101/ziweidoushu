import { ChartOraclePage } from '@/components/OracleSubpage';

export const metadata = {
  title: '紫微命盘在线排盘 · Oracle',
  description: '输入出生年月日时，使用本地开源紫微斗数排盘引擎生成命盘。',
};

export default function ChartPage() {
  return <ChartOraclePage />;
}
