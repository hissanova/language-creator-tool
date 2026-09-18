import { notFound } from "next/navigation";
import { ViewerSwitcher } from "@/app/components/ViewerSwitcher";
import { findViewerSample, viewerSampleStaticParams } from "@/samples/core-json/sampleRegistry";

export function generateStaticParams() {
  return viewerSampleStaticParams();
}

export default async function GeneratedSamplePage({
  params,
}: {
  params: Promise<{ sampleId: string }>;
}) {
  const { sampleId } = await params;
  const sample = findViewerSample(sampleId);
  if (!sample) notFound();

  return <ViewerSwitcher document={await sample.load()} />;
}
