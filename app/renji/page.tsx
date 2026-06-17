import { SanjiPage, SectionTitle } from '@/components/OracleSubpage';
import { RENJI_MODULES, RENJI_STATS } from '@/lib/nihai';
import Link from 'next/link';
import { Fragment } from 'react';

export const metadata = {
  title: '人纪 · 倪海厦中医经典教学体系 · 针灸 / 内经 / 本草 / 伤寒 / 金匮',
  description: '人纪中知人事，整理针灸大成、黄帝内经、神农本草经、伤寒论、金匮要略五大经典课程。',
};

export default function Page() {
  return (
    <SanjiPage
      category="renji"
      modules={RENJI_MODULES}
      statLine={`5 大经典 · 35 个章节 · ${RENJI_STATS.totalLessons} · ${RENJI_STATS.completionYear}年完成`}
      sectionTitle="五大经典课程"
      sectionSubtitle="Five Classics"
      quoteIndex="03"
      beforeQuote={(
        <section className="oracle-content-band">
          <SectionTitle index="02" title="学习路线" subtitle="倪师指定的学习顺序" />
          <div className="oracle-learning-route">
            {RENJI_STATS.learningOrder.map((name, index) => (
              <Fragment key={name}>
                {index > 0 && <span className="oracle-learning-route-arrow">→</span>}
                <div className="oracle-learning-route-pill">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span>{name}</span>
                </div>
              </Fragment>
            ))}
          </div>
        </section>
      )}
      quote={(
        <>
          中医是<strong>物理医学</strong>——从物理的角度分析人体，阴阳寒热虚实是最基本的物理状态。学完五大经典，可从感冒治至肝癌。
        </>
      )}
      quoteFrom="经方一剂知，二剂已——精确辨证后，张仲景的经方往往一两剂即可见效。"
      quoteSource="伤寒论总论"
      disclaimer="人纪 · 基于倪海厦正宗中医教学体系 · 仅供学习参考 · 不构成任何医疗建议 · 身体不适请就医"
    >
      <div className="oracle-inline-links">
        <div className="oracle-sanity-nav">
          <Link href="/library">《黄帝内经·素问》<span>3 章 →</span></Link>
        </div>
      </div>
    </SanjiPage>
  );
}
