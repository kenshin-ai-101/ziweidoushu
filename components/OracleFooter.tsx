import Link from 'next/link';

export function OracleFooter({ showBackLink = true }: { showBackLink?: boolean }) {
  return (
    <footer className="oracle-site-footer">
      <div className="oracle-site-footer-top">
        <div className="oracle-site-footer-back">
          {showBackLink ? (
            <Link href="/">← 返回首页</Link>
          ) : (
            <span className="oracle-site-footer-back-placeholder" aria-hidden="true">·</span>
          )}
        </div>
        <div className="oracle-site-footer-links">
          <Link href="/privacy">隐私政策</Link>
          <span>·</span>
          <Link href="/terms">服务条款</Link>
          <span>·</span>
          <a href="mailto:feedback@wdyziweidoushu666.com?subject=违法和不良信息举报">违法和不良信息举报</a>
          <span>·</span>
          <a href="https://www.12377.cn/" target="_blank" rel="noopener noreferrer">
            12377 举报
          </a>
        </div>
      </div>
      <div className="oracle-site-footer-bottom">
        <p>本平台基于中国传统文化研究，仅供学习参考，不构成医疗、投资、婚姻、法律或重大决策建议。AI 输出非医疗诊断。</p>
        <p>
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">京ICP备2026027116号</a>
          <span>·</span>
          <a href="http://www.beian.gov.cn/portal/registerSystemInfo" target="_blank" rel="noopener noreferrer">京公网安备11010502061088号</a>
          <span>·</span>
          <span>©2026 Metis</span>
        </p>
        <p className="oracle-site-footer-host">
          主办主体：两江新区旺多鱼网络科技工作室（个体工商户） · 客服：
          <a href="mailto:wdy778@outlook.com">wdy778@outlook.com</a>
        </p>
      </div>
    </footer>
  );
}
