import { DocumentViewer } from "@/app/components/DocumentViewer";
import { ContentsViewer } from "@/app/components/ContentsViewer";

import { sampleDocument } from "@/app/data/sampleGrammarAnnotations";

export default function SampleAnnotationPage() {
  return <ContentsViewer document={sampleDocument} />;
}
