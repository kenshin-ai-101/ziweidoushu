import Link from 'next/link';
import { OracleChrome, OracleHero } from '@/components/OracleSubpage';

export const metadata = { title: '服务条款 · Oracle', description: 'Oracle 用户协议、免责声明、知识产权与服务条款' };

const rules = [
  '仅出于合法、个人参考目的使用本平台',
  '不传播本平台内容用于商业销售、转载或公开发布',
  '不进行扰乱平台正常运行的行为',
  '提交的出生信息真实有效；本平台对错误信息导致的解读偏差不承担责任',
];

export default function TermsPage() {
  return (
    <OracleChrome tone="ink" variant="terms">
      <OracleHero
        eyebrow="LEGAL · TERMS OF SERVICE"
        title="服务条款"
        subtitle="Terms of Service"
        description="最后更新：2026 年 6 月 · 用户协议、免责声明、知识产权"
      />

      <section className="oracle-content-band oracle-legal-band">
        <article className="oracle-legal-article">
          <h2>1. 服务概述</h2>
          <p>紫微命盘（以下简称“本平台”）基于倪海夏《天纪》紫微斗数体系提供命盘排盘与解读服务。本平台所有命理内容仅供参考，不构成任何医疗、投资、法律、心理咨询或人生重大决策建议。</p>

          <h2>2. 用户行为规范</h2>
          <p>使用本平台即表示您同意：</p>
          <ul className="oracle-number-list">
            {rules.map((rule, index) => (
              <li key={rule}><span>{String(index + 1).padStart(2, '0')}</span>{rule}</li>
            ))}
          </ul>

          <h2>3. 知识产权与禁止条款 · 反爬反训练</h2>
          <p>本平台所有命理内容、知识库（含 14 主星 × 12 宫 × 男女 × 四化 × 大限流年的全部解读文本）、UI 设计、算法整合方案、案例库均为本平台原创或经合法整理。</p>
          <p>严格禁止以下行为，违者保留追究民事赔偿与刑事责任的权利：</p>
          <ol>
            <li>通过爬虫、自动化脚本、批量调用 API 等任何技术手段抓取本平台内容；</li>
            <li>将本平台生成的命盘解读、文本、API 响应数据用于训练任何机器学习模型；</li>
            <li>将本平台生成的内容转售、发布到其他网站、APP、自媒体账号；</li>
            <li>反编译、复制、修改本平台前端或后端代码并以“自营”方式提供同类服务。</li>
          </ol>
          <p>本平台输出文本嵌入有指纹追溯水印，违规复制 / 训练所产生的输出可被检测追溯。一经发现违规，本平台有权要求每例违约赔偿 100 万元人民币，并保留向法院提起诉讼及配合公安机关调查的权利。</p>

          <h2>4. 免责声明</h2>
          <p>本平台命理内容基于传统紫微斗数与倪海夏体系的知识整理，不保证 100% 准确。命运受天、地、人三才共同影响，本平台输出仅作为认识自我的参考，使用者应理性看待，不应过度依赖任何单一命理判断。</p>
          <p>因使用本平台内容产生的任何后果（包括但不限于决策失误、心理影响、关系变化等），本平台不承担法律责任。</p>

          <h2>5. 服务变更与终止</h2>
          <p>本平台保留随时调整、暂停或终止部分或全部服务的权利。重大变更将以站内公告或邮件方式通知用户。</p>

          <h2>6. 法律适用与争议解决</h2>
          <p>本条款适用中华人民共和国法律。若发生争议，双方应友好协商；协商不成的，提交本平台运营主体所在地有管辖权的人民法院诉讼解决。</p>

          <h2>7. 联系方式</h2>
          <p>如有疑问，请通过本平台公布的客服邮箱联系。</p>

          <div className="oracle-legal-actions">
            <Link href="/privacy">← 隐私政策</Link>
            <span>本条款由 Oracle 运营主体发布</span>
          </div>
        </article>
        <Link className="oracle-back-home" href="/">← 返回首页</Link>
      </section>
    </OracleChrome>
  );
}
