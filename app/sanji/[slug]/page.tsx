import { notFound } from 'next/navigation';
import { SanjiModulePage } from '@/components/SanjiModulePage';
import { ALL_SANJI_MODULES, getModuleBySlug } from '@/lib/nihai/modules';

export async function generateStaticParams() {
  return ALL_SANJI_MODULES.map(module => ({ slug: module.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const module = getModuleBySlug(slug);
  if (!module) return {};

  const categoryName = module.category === 'tianji' ? '天纪' : module.category === 'diji' ? '地纪' : '人纪';

  return {
    title: `${module.name} · ${categoryName}学科详解 · 倪海夏体系`,
    description: `${module.name}（${module.subtitle}）——${module.description}`,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const module = getModuleBySlug(slug);
  if (!module) notFound();

  return <SanjiModulePage module={module} />;
}
