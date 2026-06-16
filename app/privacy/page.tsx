import Link from 'next/link';
import { OracleChrome, OracleHero } from '@/components/OracleSubpage';

export const metadata = { title: '隐私政策 · Oracle', description: 'Oracle 个人信息保护规则与用户权利' };

export default function PrivacyPage() {
  return (
    <OracleChrome tone="ink" variant="terms">
      <OracleHero
        eyebrow="LEGAL · PRIVACY POLICY"
        title="隐私政策"
        subtitle="Privacy Policy"
        description="最后更新：2026 年 6 月 · 个人信息保护规则与用户权利"
      />

      <section className="oracle-content-band oracle-legal-band">
        <article className="oracle-legal-article">
          <h2>1. 我们收集的信息</h2>
          <p>为提供紫微命盘排盘与解读服务，我们可能收集以下信息：</p>
          <ul>
            <li><strong>命盘必要信息</strong>：姓名（选填）、出生公历年月日、出生时辰、性别、出生地经度</li>
            <li><strong>账号信息（注册后）</strong>：邮箱地址或手机号（用于登录验证与会员服务）</li>
            <li><strong>交互信息</strong>：你在站内的点击、浏览、命盘历史记录</li>
            <li><strong>反馈信息</strong>：你对解读内容的“准 / 不准”打分与文字反馈</li>
            <li><strong>支付信息</strong>：购买会员或单项服务时通过第三方支付处理，本平台不存储完整卡号或密码</li>
          </ul>

          <h2>2. 我们如何使用信息</h2>
          <ul>
            <li>命盘信息仅用于本次解读与你账号下的历史命盘记录</li>
            <li>账号信息用于注册、登录验证、订单通知与客服沟通</li>
            <li>反馈信息用于持续改进命理内容质量（脱敏后聚合分析）</li>
            <li>聚合数据可能用于行业研究与平台优化</li>
          </ul>

          <h2>3. 信息共享与第三方</h2>
          <p>除以下情形外，我们不会向第三方共享你的个人信息：</p>
          <ul>
            <li>支付服务商：处理订单结算</li>
            <li>邮件或短信服务商：发送登录验证码、订单通知与必要服务信息</li>
            <li>云服务商：如 Vercel / Cloudflare / 阿里云，用于技术承载</li>
            <li>AI 解读服务：处理你的命盘解读与自由追问（已做必要匿名化）</li>
            <li>司法机关或政府部门基于法律法规的合法要求</li>
          </ul>

          <h2>4. 信息安全</h2>
          <p>我们采取业界常见的技术与管理手段保护你的信息（HTTPS 传输加密、数据库加密存储、访问权限控制等）。但请注意，互联网传输无法保证 100% 安全。</p>

          <h2>5. 你的权利</h2>
          <ul>
            <li><strong>查询</strong>：可通过账号中心查看你的历史命盘与订单</li>
            <li><strong>删除</strong>：联系客服删除账号下指定命盘 / 注销账号</li>
            <li><strong>导出</strong>：可申请导出你的全部个人数据</li>
          </ul>

          <h2>6. Cookie 与本地存储</h2>
          <p>本站使用 cookie / localStorage 用于：保存你的主题偏好、最近的命盘历史、会员登录状态。你可在浏览器设置中关闭，但部分功能可能受影响。</p>

          <h2>7. 未成年人</h2>
          <p>本平台命理内容面向 18 岁以上成年用户。未成年人请在监护人同意下使用，并不得将解读用于重大人生决策。</p>

          <h2>8. 政策变更</h2>
          <p>本政策可能不定期更新。重大变更将以显著方式通知。继续使用即表示同意更新后的版本。</p>

          <div className="oracle-legal-actions">
            <Link href="/terms">服务条款 →</Link>
            <span>本政策由 Oracle 运营主体发布</span>
          </div>
        </article>
        <Link className="oracle-back-home" href="/">← 返回首页</Link>
      </section>
    </OracleChrome>
  );
}
